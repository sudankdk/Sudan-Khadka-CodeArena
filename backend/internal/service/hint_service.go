package service

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"
)

// ErrRateLimited is returned when the API rate limit is exceeded.
var ErrRateLimited = errors.New("AI hint rate limit exceeded, please try again in a minute")

// ErrCooldown is returned when a user requests hints too quickly.
var ErrCooldown = errors.New("please wait before requesting another hint")

// HintService generates progressive hints for coding problems via OpenRouter.
type HintService struct {
	apiKey    string
	baseURL   string
	model     string
	client    *http.Client
	cooldowns sync.Map // userID -> time.Time (next allowed request)
}

const (
	hintCooldown  = 30 * time.Second
	maxDescLen    = 800
	maxCodeLen    = 600
	maxOutputToks = 150
)

// NewHintService creates a HintService configured for OpenRouter.
func NewHintService(apiKey string) (*HintService, error) {
	if apiKey == "" {
		return nil, errors.New("OpenRouter API key is required")
	}
	return &HintService{
		apiKey:  apiKey,
		baseURL: "https://openrouter.ai/api/v1/chat/completions",
		model:   "google/gemini-3-flash-preview",
		client:  &http.Client{Timeout: 30 * time.Second},
	}, nil
}

// truncate cuts s to at most maxLen characters, appending "…" if truncated.
func truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "…"
}

// CheckCooldown checks whether the user is still in cooldown. Does NOT set a new cooldown.
func (h *HintService) CheckCooldown(userID string) error {
	if v, ok := h.cooldowns.Load(userID); ok {
		if next, _ := v.(time.Time); time.Now().Before(next) {
			remaining := time.Until(next).Truncate(time.Second)
			return fmt.Errorf("%w (%s remaining)", ErrCooldown, remaining)
		}
	}
	return nil
}

// SetCooldown starts the cooldown timer for a user. Call after a successful hint.
func (h *HintService) SetCooldown(userID string) {
	h.cooldowns.Store(userID, time.Now().Add(hintCooldown))
}

// openRouterRequest is the OpenAI-compatible chat completions request body.
type openRouterRequest struct {
	Model       string              `json:"model"`
	Messages    []openRouterMessage `json:"messages"`
	MaxTokens   int                 `json:"max_tokens,omitempty"`
	Temperature float64             `json:"temperature,omitempty"`
}

type openRouterMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type openRouterResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
		Code    any    `json:"code"`
	} `json:"error,omitempty"`
}

// GenerateHint returns a hint for the given problem based on the hint level (1-3).
func (h *HintService) GenerateHint(ctx context.Context, problemTitle, problemDesc, difficulty string, userCode string, hintLevel int) (string, error) {
	if hintLevel < 1 || hintLevel > 3 {
		hintLevel = 1
	}

	levelInstructions := map[int]string{
		1: "Give a subtle hint in 1-2 sentences. Don't reveal the approach.",
		2: "Suggest the approach or data structure in 2-3 sentences. No code.",
		3: "Explain the approach with pseudocode-level guidance. No solution code.",
	}

	desc := truncate(problemDesc, maxDescLen)
	codeSnippet := truncate(userCode, maxCodeLen)

	var codeCtx string
	if codeSnippet != "" {
		codeCtx = fmt.Sprintf("User code:\n```\n%s\n```", codeSnippet)
	}

	userPrompt := fmt.Sprintf(`Problem: %s (%s). %s
%s
Hint %d/3: %s
Never give solution code. Be concise.`,
		problemTitle, difficulty, desc,
		codeCtx,
		hintLevel, levelInstructions[hintLevel],
	)

	reqBody := openRouterRequest{
		Model: h.model,
		Messages: []openRouterMessage{
			{Role: "system", Content: "You are a concise coding tutor. Give hints, never solutions."},
			{Role: "user", Content: userPrompt},
		},
		MaxTokens:   maxOutputToks,
		Temperature: 0.7,
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, h.baseURL, bytes.NewReader(bodyBytes))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+h.apiKey)

	resp, err := h.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("OpenRouter request failed: %w", err)
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode == http.StatusTooManyRequests {
		return "", ErrRateLimited
	}
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("OpenRouter error (HTTP %d): %s", resp.StatusCode, string(respBytes))
	}

	var orResp openRouterResponse
	if err := json.Unmarshal(respBytes, &orResp); err != nil {
		return "", fmt.Errorf("failed to parse response: %w", err)
	}

	if orResp.Error != nil {
		msg := orResp.Error.Message
		if strings.Contains(msg, "rate") || strings.Contains(msg, "429") || strings.Contains(msg, "RESOURCE_EXHAUSTED") {
			return "", ErrRateLimited
		}
		return "", fmt.Errorf("OpenRouter API error: %s", msg)
	}

	if len(orResp.Choices) == 0 || orResp.Choices[0].Message.Content == "" {
		return "", errors.New("empty response from AI")
	}

	return orResp.Choices[0].Message.Content, nil
}
