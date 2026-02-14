package dto

import "time"

type CreateContestDTO struct {
	Title       string    `json:"title" binding:"required"`
	Description string    `json:"description"`
	StartTime   time.Time `json:"start_time" binding:"required"`
	EndTime     time.Time `json:"end_time" binding:"required"`
	IsRated     bool      `json:"is_rated"`
}

//	AddProblem(contestID, problemID uuid.UUID, orderIndex int, maxPoints int, partialCredit bool, timeMultiplier float64) error

type AddProblemToContestDTO struct {
	ProblemTitle       string `json:"problem_title" binding:"required"`
	MaxPoints          int    `json:"max_points" binding:"required"`
	TimePenaltyMinutes int    `json:"time_penalty_minutes" binding:"required"`
}
