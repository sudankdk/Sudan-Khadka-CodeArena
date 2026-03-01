package service

import (
	"context"
	"fmt"
	"image"
	"image/color"
	"image/png"
	"math"
	"os"
	"path/filepath"
	"time"

	"github.com/chromedp/chromedp"
	"github.com/google/uuid"
	"github.com/sudankdk/codearena/internal/domain"
	"github.com/sudankdk/codearena/internal/dto"
	"github.com/sudankdk/codearena/internal/logger"
	"go.uber.org/zap"
)

// JudgeService handles visual comparison of player submissions against reference screenshots.
type JudgeService struct {
	allocCtx    context.Context
	allocCancel context.CancelFunc
	outputDir   string
}

// findChromiumBrowser returns the path to the first available Chromium-based browser.
// It checks Chrome first, then Edge, then Chromium.
func findChromiumBrowser() string {
	candidates := []string{
		// Chrome
		`C:\Program Files\Google\Chrome\Application\chrome.exe`,
		`C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`,
		// Edge
		`C:\Program Files\Microsoft\Edge\Application\msedge.exe`,
		`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`,
		// Chromium
		`C:\Program Files\Chromium\Application\chrome.exe`,
		// Linux paths
		"/usr/bin/google-chrome",
		"/usr/bin/chromium-browser",
		"/usr/bin/chromium",
		"/usr/bin/microsoft-edge",
	}
	for _, p := range candidates {
		if _, err := os.Stat(p); err == nil {
			return p
		}
	}
	return "" // let chromedp use its default lookup
}

// NewJudgeService creates a new JudgeService with a persistent browser allocator.
func NewJudgeService(outputDir string) *JudgeService {
	if outputDir == "" {
		outputDir = "screenshots"
	}
	if err := os.MkdirAll(outputDir, 0755); err != nil {
		logger.Error("Failed to create screenshots directory", zap.Error(err))
	}

	opts := append(chromedp.DefaultExecAllocatorOptions[:],
		chromedp.Flag("headless", true),
		chromedp.Flag("disable-gpu", true),
		chromedp.Flag("no-sandbox", true),
		chromedp.Flag("disable-dev-shm-usage", true),
		chromedp.Flag("disable-web-security", true),
	)

	// If Chrome isn't found, try to use Edge or another Chromium-based browser
	if browserPath := findChromiumBrowser(); browserPath != "" {
		opts = append(opts, chromedp.ExecPath(browserPath))
		logger.Info("Using Chromium browser", zap.String("path", browserPath))
	}

	allocCtx, allocCancel := chromedp.NewExecAllocator(context.Background(), opts...)

	return &JudgeService{
		allocCtx:    allocCtx,
		allocCancel: allocCancel,
		outputDir:   outputDir,
	}
}

// Close releases the browser allocator resources.
func (js *JudgeService) Close() {
	if js.allocCancel != nil {
		js.allocCancel()
	}
}

// buildDocument combines HTML, CSS, and JS into a single HTML document.
func buildDocument(html, css, js string) string {
	return fmt.Sprintf(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>%s</style>
</head>
<body>
%s
<script>%s</script>
</body>
</html>`, css, html, js)
}

// JudgeSubmission takes a screenshot of the submitted code and compares it against
// the reference screenshot for the given challenge.
func (js *JudgeService) JudgeSubmission(htmlCode, cssCode, jsCode string, challenge domain.FrontendChallenge) (*dto.JudgeResult, error) {
	ctx, cancel := chromedp.NewContext(js.allocCtx)
	defer cancel()

	// Set a timeout for the entire judging operation
	ctx, cancelTimeout := context.WithTimeout(ctx, 30*time.Second)
	defer cancelTimeout()

	content := buildDocument(htmlCode, cssCode, jsCode)

	var screenshotBuf []byte
	err := chromedp.Run(ctx,
		chromedp.EmulateViewport(int64(challenge.ViewportWidth), int64(challenge.ViewportHeight)),
		chromedp.Navigate("about:blank"),
		chromedp.ActionFunc(func(ctx context.Context) error {
			return chromedp.Evaluate(fmt.Sprintf(`document.open(); document.write(%q); document.close();`, content), nil).Do(ctx)
		}),
		chromedp.Sleep(500*time.Millisecond), // Wait for rendering to settle
		chromedp.FullScreenshot(&screenshotBuf, 100),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to capture screenshot: %w", err)
	}

	// Save submission screenshot
	screenshotID := uuid.New().String()
	screenshotPath := filepath.Join(js.outputDir, screenshotID+".png")
	if err := os.WriteFile(screenshotPath, screenshotBuf, 0644); err != nil {
		return nil, fmt.Errorf("failed to save screenshot: %w", err)
	}

	// Load reference screenshot
	refImg, err := loadPNG(challenge.ReferenceScreenshotPath)
	if err != nil {
		return nil, fmt.Errorf("failed to load reference screenshot: %w", err)
	}

	// Decode submission screenshot
	subFile, err := os.Open(screenshotPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open submission screenshot: %w", err)
	}
	defer subFile.Close()

	subImg, err := png.Decode(subFile)
	if err != nil {
		return nil, fmt.Errorf("failed to decode submission screenshot: %w", err)
	}

	// Compare screenshots
	diffRatio, err := compareScreenshots(subImg, refImg, challenge.PixelThreshold)
	if err != nil {
		return nil, fmt.Errorf("screenshot comparison failed: %w", err)
	}

	passed := diffRatio < challenge.DiffThreshold

	logger.Info("Judge result",
		zap.Float64("diff_ratio", diffRatio),
		zap.Float64("diff_threshold", challenge.DiffThreshold),
		zap.Bool("passed", passed),
	)

	return &dto.JudgeResult{
		DiffRatio:      diffRatio,
		Passed:         passed,
		ScreenshotPath: screenshotPath,
	}, nil
}

// GenerateReferenceScreenshot captures a reference screenshot for a challenge.
// This should be called when creating a challenge, using the correct/fixed code.
func (js *JudgeService) GenerateReferenceScreenshot(htmlCode, cssCode, jsCode string, viewportWidth, viewportHeight int) (string, error) {
	ctx, cancel := chromedp.NewContext(js.allocCtx)
	defer cancel()

	ctx, cancelTimeout := context.WithTimeout(ctx, 30*time.Second)
	defer cancelTimeout()

	content := buildDocument(htmlCode, cssCode, jsCode)

	var screenshotBuf []byte
	err := chromedp.Run(ctx,
		chromedp.EmulateViewport(int64(viewportWidth), int64(viewportHeight)),
		chromedp.Navigate("about:blank"),
		chromedp.ActionFunc(func(ctx context.Context) error {
			return chromedp.Evaluate(fmt.Sprintf(`document.open(); document.write(%q); document.close();`, content), nil).Do(ctx)
		}),
		chromedp.Sleep(500*time.Millisecond),
		chromedp.FullScreenshot(&screenshotBuf, 100),
	)
	if err != nil {
		return "", fmt.Errorf("failed to capture reference screenshot: %w", err)
	}

	refID := uuid.New().String()
	refPath := filepath.Join(js.outputDir, "ref_"+refID+".png")
	if err := os.WriteFile(refPath, screenshotBuf, 0644); err != nil {
		return "", fmt.Errorf("failed to save reference screenshot: %w", err)
	}

	return refPath, nil
}

// loadPNG loads a PNG image from disk.
func loadPNG(path string) (image.Image, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	return png.Decode(f)
}

// compareScreenshots performs pixel-by-pixel comparison of two images.
// threshold controls per-pixel color tolerance (0-1).
// Returns the ratio of different pixels (0.0 = identical, 1.0 = completely different).
func compareScreenshots(actual, reference image.Image, threshold float64) (float64, error) {
	refBounds := reference.Bounds()
	actBounds := actual.Bounds()

	// Use the smaller dimensions to avoid out-of-bounds
	width := refBounds.Dx()
	height := refBounds.Dy()
	actWidth := actBounds.Dx()
	actHeight := actBounds.Dy()

	if actWidth < width {
		width = actWidth
	}
	if actHeight < height {
		height = actHeight
	}

	if width == 0 || height == 0 {
		return 1.0, fmt.Errorf("one or both images have zero dimensions")
	}

	totalPixels := width * height
	diffPixels := 0
	maxColorDist := threshold * 255.0 // Convert threshold to color distance

	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			refR, refG, refB, refA := reference.At(refBounds.Min.X+x, refBounds.Min.Y+y).RGBA()
			actR, actG, actB, actA := actual.At(actBounds.Min.X+x, actBounds.Min.Y+y).RGBA()

			dist := colorDistance(
				color.RGBA{R: uint8(refR >> 8), G: uint8(refG >> 8), B: uint8(refB >> 8), A: uint8(refA >> 8)},
				color.RGBA{R: uint8(actR >> 8), G: uint8(actG >> 8), B: uint8(actB >> 8), A: uint8(actA >> 8)},
			)

			if dist > maxColorDist {
				diffPixels++
			}
		}
	}

	// Account for size difference as additional diff pixels
	refTotal := refBounds.Dx() * refBounds.Dy()
	actTotal := actBounds.Dx() * actBounds.Dy()
	maxTotal := refTotal
	if actTotal > maxTotal {
		maxTotal = actTotal
	}
	sizeDiffPixels := maxTotal - totalPixels

	return float64(diffPixels+sizeDiffPixels) / float64(maxTotal), nil
}

// colorDistance calculates the Euclidean distance between two colors normalized to 0-255 range.
func colorDistance(c1, c2 color.RGBA) float64 {
	dr := float64(c1.R) - float64(c2.R)
	dg := float64(c1.G) - float64(c2.G)
	db := float64(c1.B) - float64(c2.B)
	da := float64(c1.A) - float64(c2.A)
	return math.Sqrt(dr*dr+dg*dg+db*db+da*da) / 2.0 // normalize to 0-255 range approx
}
