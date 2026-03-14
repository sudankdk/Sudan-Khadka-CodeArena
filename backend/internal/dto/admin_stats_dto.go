package dto

import "time"

// AdminStats represents the overall admin dashboard statistics
type AdminStats struct {
	TotalUsers           int              `json:"total_users"`
	TotalProblems        int              `json:"total_problems"`
	ActiveContests       int              `json:"active_contests"`
	UserGrowth           []TimeSeriesData `json:"user_growth"`
	SubmissionStats      []TimeSeriesData `json:"submission_stats"`
	ContestParticipation []TimeSeriesData `json:"contest_participation"`
	LastUpdated          time.Time        `json:"last_updated"`
}

// TimeSeriesData represents data points for charts
type TimeSeriesData struct {
	Period string `json:"period"` // e.g., "January", "2024-01-15"
	Count  int    `json:"count"`
}
