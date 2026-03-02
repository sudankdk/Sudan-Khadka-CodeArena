package dto

// HintRequestDTO is the payload sent by the frontend to request a hint.
type HintRequestDTO struct {
	ProblemTitle string `json:"problem_title"`
	ProblemDesc  string `json:"problem_desc"`
	Difficulty   string `json:"difficulty"`
	UserCode     string `json:"user_code"`
	HintLevel    int    `json:"hint_level"`
}

// HintResponseDTO is the response returned with the generated hint.
type HintResponseDTO struct {
	Hint  string `json:"hint"`
	Level int    `json:"level"`
}
