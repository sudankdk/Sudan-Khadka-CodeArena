package service

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/sudankdk/codearena/internal/domain"
	"github.com/sudankdk/codearena/internal/dto"
	"github.com/sudankdk/codearena/internal/repo"
)

// ContestService handles contest operations and orchestrates scoring
type ContestService struct {
	ContestRepo    repo.ContestRepo
	ProblemRepo    repo.ProblemsRepo
	SubmissionRepo repo.SubmissionRepo
	UserRepo       repo.UserRepo
	ScoringService *ContestScoringService
}

// CreateContest creates a new contest
func (cs *ContestService) CreateContest(dto dto.CreateContestDTO) (*domain.Contest, error) {
	// Calculate duration in minutes
	duration := int(dto.EndTime.Sub(dto.StartTime).Minutes())

	contest := &domain.Contest{
		Name:        dto.Title,
		Description: dto.Description,
		StartTime:   dto.StartTime,
		EndTime:     dto.EndTime,
		Duration:    duration,
		IsRated:     dto.IsRated,
		IsActive:    false, // New contests start inactive
	}
	if err := cs.ContestRepo.Create(contest); err != nil {
		return nil, err
	}

	return contest, nil
}

// GetByID retrieves a contest by its ID
func (cs *ContestService) GetByID(contestIDStr string) (*domain.Contest, error) {
	contestID, err := uuid.Parse(contestIDStr)
	if err != nil {
		return nil, err
	}
	contest, err := cs.ContestRepo.GetByID(contestID)
	if err != nil {
		return nil, err
	}
	return contest, nil
}

// add problems to contest
func (cs *ContestService) AddProblemsToContest(contestIDStr string, dto dto.AddProblemToContestDTO) error {
	contestID, err := uuid.Parse(contestIDStr)
	if err != nil {
		return err
	}

	// Get problem by title instead of ID
	problem, err := cs.ProblemRepo.GetProblemByTitle(dto.ProblemTitle)
	if err != nil {
		return errors.New("problem not found with title: " + dto.ProblemTitle)
	}

	if _, err := cs.ContestRepo.GetByID(contestID); err != nil {
		return err
	}

	// Get current problem count to set order index
	existingProblems, err := cs.ContestRepo.GetProblems(contestID)
	if err != nil {
		return err
	}
	orderIndex := len(existingProblems) + 1

	// Use time_penalty_minutes directly, set defaults for partial credit and time multiplier
	return cs.ContestRepo.AddProblem(contestID, problem.ID, orderIndex, dto.MaxPoints, false, 1.0)
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

// check if user is registered for contest
func (cs *ContestService) IsUserRegistered(contestIDStr, userIDStr string) (bool, error) {
	contestID, err := uuid.Parse(contestIDStr)
	if err != nil {
		return false, err
	}
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return false, err
	}

	return cs.ContestRepo.IsUserRegistered(contestID, userID)
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
	// 1. Get contest problem to find max points and settings
	contest, err := cs.ContestRepo.GetByID(contestID)
	if err != nil {
		return err
	}

	var contestProblem *domain.ContestProblem
	for _, cp := range contest.Problems {
		if cp.ProblemID == problemID {
			contestProblem = &cp
			break
		}
	}
	if contestProblem == nil {
		return errors.New("contest problem not found")
	}

	// 2. Get participant record
	var participant *domain.ContestParticipant
	for _, p := range contest.Participants {
		if p.UserID == userID {
			participant = &p
			break
		}
	}
	if participant == nil {
		return errors.New("participant not found")
	}

	// 3. Count previous attempts for this problem
	attempts, err := cs.SubmissionRepo.CountContestProblemAttempts(contestID, userID, problemID)
	if err != nil {
		return err
	}

	// 4. Calculate time since contest start
	timeSinceStart := int(time.Since(contest.StartTime).Minutes())

	// 5. Calculate points using scoring service
	config := DefaultScoringConfig()
	points := cs.ScoringService.CalculateSubmissionPoints(
		contestProblem.MaxPoints,
		testCasesPassed,
		totalTestCases,
		executionTime,
		attempts+1, // current attempt
		timeSinceStart,
		contestProblem.PartialCredit,
		config,
	)

	// 6. Update submission with points earned
	err = cs.SubmissionRepo.UpdateSubmissionPoints(submissionID, points)
	if err != nil {
		return err
	}

	// 7. Track participant activity
	now := time.Now()
	err = cs.ContestRepo.UpdateParticipantActivity(contestID, userID, &now, &now, 1)
	if err != nil {
		return err
	}

	// 8. If status is ACCEPTED, update participant's total points, etc.
	if status == domain.STATUS_ACCEPTED {
		// Calculate penalty time for this solve
		penaltyTime := cs.ScoringService.CalculatePenaltyTime(timeSinceStart, attempts)

		// Update participant
		err = cs.ContestRepo.UpdateParticipantScore(contestID, userID, points, 1, penaltyTime)
		if err != nil {
			return err
		}
	}

	return nil
}

// FinalizeContestRankings calculates final rankings and rating changes
// This should be called when a contest ends
func (cs *ContestService) FinalizeContestRankings(contestID uuid.UUID) error {
	// 1. Get all participants with their scores
	participants, err := cs.ContestRepo.GetParticipants(contestID)
	if err != nil {
		return err
	}

	// 2. Prepare participant scores for ranking
	var participantScores []ParticipantScore
	for _, p := range participants {
		participantScores = append(participantScores, ParticipantScore{
			UserID:           p.UserID,
			TotalPoints:      p.TotalPoints,
			ProblemsSolved:   p.ProblemsSolved,
			PenaltyTime:      p.PenaltyTime,
			LastSubmissionAt: p.LastSubmissionAt,
			CurrentRank:      0,
		})
	}

	// 3. Calculate final rankings using scoring service
	rankedParticipants := cs.ScoringService.CalculateContestRank(participantScores)

	// 4. For each participant, calculate rating change and update records
	for _, rp := range rankedParticipants {
		// Get user to get current rating
		user, err := cs.UserRepo.FindUserById(rp.UserID)
		if err != nil {
			return err
		}

		// Calculate rating change
		ratingChange := cs.ScoringService.CalculateRatingChange(
			user.Rating,
			len(participants), // expected rank (simplified)
			rp.CurrentRank,
			len(participants),
		)

		newRating := user.Rating + float64(ratingChange)

		// Update participant record with final rank and new rating
		// Note: This would require adding methods to update participant rating and rank
		// For now, we'll update the user rating
		err = cs.UserRepo.UpdateUserRating(rp.UserID, newRating)
		if err != nil {
			return err
		}

		// 5. Create leaderboard entries
		err = cs.ContestRepo.UpdateLeaderboardEntry(contestID, rp.UserID, rp.TotalPoints, newRating, rp.CurrentRank)
		if err != nil {
			return err
		}
	}

	// 6. Update global leaderboard if needed
	for _, rp := range rankedParticipants {
		err = cs.UpdateGlobalLeaderboard(rp.UserID)
		if err != nil {
			return err
		}
	}

	return nil
}

// UpdateGlobalLeaderboard updates the global leaderboard after contest
func (cs *ContestService) UpdateGlobalLeaderboard(userID uuid.UUID) error {
	// 1. Get user's latest rating and stats
	user, err := cs.UserRepo.FindUserById(userID)
	if err != nil {
		return err
	}

	// Get solved count (this should be calculated from submissions)
	solvedProblems, err := cs.SubmissionRepo.GetUserSolvedProblems(userID)
	if err != nil {
		return err
	}

	// 2. Update or create global leaderboard entry
	err = cs.ContestRepo.UpdateGlobalLeaderboardEntry(userID, user.Rating, len(solvedProblems))
	if err != nil {
		return err
	}

	// 3. Recalculate global ranks (already done in UpdateGlobalLeaderboardEntry)

	return nil
}
