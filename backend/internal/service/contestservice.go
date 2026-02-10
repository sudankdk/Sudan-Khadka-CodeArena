package service

import (
	"time"

	"github.com/google/uuid"
	// Import your domain and repo packages
)

// ContestService handles contest operations and orchestrates scoring
type ContestService struct {
	scoringService *ContestScoringService
	// Add repositories:
	// contestRepo       repo.ContestRepository
	// participantRepo   repo.ContestParticipantRepository
	// submissionRepo    repo.SubmissionRepository
	// userRepo          repo.UserRepository
}

// NewContestService creates a new contest service
func NewContestService() *ContestService {
	return &ContestService{
		scoringService: &ContestScoringService{},
		// Initialize repositories
	}
}

// ProcessSubmission handles a new submission in a contest
// This should be called whenever a user submits a solution during a contest
func (cs *ContestService) ProcessSubmission(
	contestID uuid.UUID,
	userID uuid.UUID,
	problemID uuid.UUID,
	submissionID uuid.UUID,
	status string, // "accepted", "wrong_answer", etc.
	testCasesPassed int,
	totalTestCases int,
	executionTime int,
) error {
	// TODO: Implement database operations
	// Steps:
	// 1. Get contest problem to find max points and settings
	// 2. Get participant record
	// 3. Count previous attempts for this problem
	// 4. Calculate time since contest start
	// 5. Calculate points using scoring service
	// 6. Update submission with points earned
	// 7. If status is ACCEPTED:
	//    - Update participant's total points
	//    - Increment problems solved
	//    - Update penalty time
	//    - Update last submission time
	// 8. Recalculate contest rankings

	return nil
}

// FinalizeContestRankings calculates final rankings and rating changes
// This should be called when a contest ends
func (cs *ContestService) FinalizeContestRankings(contestID uuid.UUID) error {
	// TODO: Implement
	// Steps:
	// 1. Get all participants with their scores
	// 2. Calculate final rankings using scoring service
	// 3. For each participant:
	//    - Calculate rating change
	//    - Update participant record with final rank and new rating
	//    - Update user's global rating
	// 4. Create leaderboard entries
	// 5. Update global leaderboard if needed

	return nil
}

// UpdateGlobalLeaderboard updates the global leaderboard after contest
func (cs *ContestService) UpdateGlobalLeaderboard(userID uuid.UUID) error {
	// TODO: Implement
	// Steps:
	// 1. Get user's latest rating and stats
	// 2. Update or create global leaderboard entry
	// 3. Recalculate global ranks

	return nil
}

// GetContestLeaderboard returns current leaderboard for a contest
func (cs *ContestService) GetContestLeaderboard(contestID uuid.UUID, limit int) ([]LeaderboardEntry, error) {
	// TODO: Implement
	return nil, nil
}

// LeaderboardEntry represents a row in the leaderboard
type LeaderboardEntry struct {
	Rank             int        `json:"rank"`
	UserID           uuid.UUID  `json:"user_id"`
	Username         string     `json:"username"`
	TotalPoints      int        `json:"total_points"`
	ProblemsSolved   int        `json:"problems_solved"`
	PenaltyTime      int        `json:"penalty_time"`
	Rating           float64    `json:"rating"`
	RatingChange     int        `json:"rating_change"`
	LastSubmissionAt *time.Time `json:"last_submission_at"`
}
