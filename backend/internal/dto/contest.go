package dto

import "time"

type CreateContestDTO struct {
	Name      string    `json:"name" binding:"required"`
	StartTime time.Time `json:"start_time" binding:"required"`
	EndTime   time.Time `json:"end_time" binding:"required"`
}

//	AddProblem(contestID, problemID uuid.UUID, orderIndex int, maxPoints int, partialCredit bool, timeMultiplier float64) error

type AddProblemToContestDTO struct {
	ContestID      string  `json:"contest_id" binding:"required"`
	ProblemID      string  `json:"problem_id" binding:"required"`
	OrderIndex     int     `json:"order_index" binding:"required"`
	MaxPoints      int     `json:"max_points" binding:"required"`
	PartialCredit  bool    `json:"partial_credit"`
	TimeMultiplier float64 `json:"time_multiplier" binding:"required"`
}
