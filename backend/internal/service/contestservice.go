package service

import (
	"github.com/google/uuid"
	"github.com/sudankdk/codearena/internal/domain"
	"github.com/sudankdk/codearena/internal/dto"
	"github.com/sudankdk/codearena/internal/repo"
)

// ContestService handles contest operations and orchestrates scoring
type ContestService struct {
	// scoringService *ContestScoringService
	ContestRepo repo.ContestRepo

	// Add repositories:
	// contestRepo       repo.ContestRepository
	// participantRepo   repo.ContestParticipantRepository
	// submissionRepo    repo.SubmissionRepository
	// userRepo          repo.UserRepository
}

// CreateContest creates a new contest
func (cs *ContestService) CreateContest(dto dto.CreateContestDTO) (*domain.Contest, error) {
	contest := &domain.Contest{
		Name:      dto.Name,
		StartTime: dto.StartTime,
		EndTime:   dto.EndTime,
	}
	if err := cs.ContestRepo.Create(contest); err != nil {
		return nil, err
	}

	return contest, nil
}

// add problems to contest
func (cs *ContestService) AddProblemsToContest(dto dto.AddProblemToContestDTO) error {
	contestID, err := uuid.Parse(dto.ContestID)
	if err != nil {
		return err
	}
	problemID, err := uuid.Parse(dto.ProblemID)
	if err != nil {
		return err
	}

	if _, err := cs.ContestRepo.GetByID(contestID); err != nil {
		return err
	}

	return cs.ContestRepo.AddProblem(contestID, problemID, dto.OrderIndex, dto.MaxPoints, dto.PartialCredit, dto.TimeMultiplier)
}

// remove problem from contest
func (cs *ContestService) RemoveProblemFromContest(contestIDStr, problemIDStr string) error {
	contestID, err := uuid.Parse(contestIDStr)
	if err != nil {
		return err
	}
	problemID, err := uuid.Parse(problemIDStr)
	if err != nil {
		return err
	}

	if _, err := cs.ContestRepo.GetByID(contestID); err != nil {
		return err
	}

	return cs.ContestRepo.RemoveProblem(contestID, problemID)
}

// register participant to contest
func (cs *ContestService) RegisterParticipant(contestIDStr, userIDStr string) error {
	contestID, err := uuid.Parse(contestIDStr)
	if err != nil {
		return err
	}
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return err
	}

	if _, err := cs.ContestRepo.GetByID(contestID); err != nil {
		return err
	}
	return cs.ContestRepo.RegisterParticipant(contestID, userID)
}

// unregister participant from contest
func (cs *ContestService) UnregisterParticipant(contestIDStr, userIDStr string) error {
	contestID, err := uuid.Parse(contestIDStr)
	if err != nil {
		return err
	}
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return err
	}

	if _, err := cs.ContestRepo.GetByID(contestID); err != nil {
		return err
	}
	return cs.ContestRepo.UnregisterParticipant(contestID, userID)
}

// GetContestParticipants returns list of participants in a contest
func (cs *ContestService) GetContestParticipants(contestIDStr string) ([]*domain.ContestParticipant, error) {
	contestID, err := uuid.Parse(contestIDStr)
	if err != nil {
		return nil, err
	}
	if _, err := cs.ContestRepo.GetByID(contestID); err != nil {
		return nil, err
	}
	participants, err := cs.ContestRepo.GetParticipants(contestID)
	if err != nil {
		return nil, err
	}
	return participants, nil
}

// GetContestProblems returns list of problems in a contest
func (cs *ContestService) GetContestProblems(contestIDStr string) ([]*domain.ContestProblem, error) {
	contestID, err := uuid.Parse(contestIDStr)
	if err != nil {
		return nil, err
	}
	if _, err := cs.ContestRepo.GetByID(contestID); err != nil {
		return nil, err
	}
	problems, err := cs.ContestRepo.GetProblems(contestID)
	if err != nil {
		return nil, err
	}
	return problems, nil
}

// getContestLeaderboard returns current leaderboard for a contest
func (cs *ContestService) GetContestLeaderboard(contestIDStr string, limit int) ([]*domain.ContestLeaderboardEntry, error) {
	contestID, err := uuid.Parse(contestIDStr)
	if err != nil {
		return nil, err
	}
	if _, err := cs.ContestRepo.GetByID(contestID); err != nil {
		return nil, err
	}
	leaderboard, err := cs.ContestRepo.GetLeaderboard(contestID)
	if err != nil {
		return nil, err
	}
	return leaderboard, nil
}

// list contests with pagination and filtering
func (cs *ContestService) ListContests(query dto.ListQuery) ([]*domain.Contest, error) {
	contests, err := cs.ContestRepo.List(query)
	if err != nil {
		return nil, err
	}
	return contests, nil
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
