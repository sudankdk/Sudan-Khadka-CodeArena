package service

import (
	"github.com/google/uuid"
	"github.com/sudankdk/codearena/configs"
	"github.com/sudankdk/codearena/internal/domain"
	"github.com/sudankdk/codearena/internal/dto"
	"github.com/sudankdk/codearena/internal/helper"
	"github.com/sudankdk/codearena/internal/repo"
)

type SubmissionService struct {
	Repo     repo.SubmissionRepo
	UserRepo repo.UserRepo
	Auth     helper.Auth
	Config   configs.AppConfigs
}

func (ss *SubmissionService) CreateSubmission(userID uuid.UUID, req dto.CreateSubmissionDTO) (*domain.Submission, error) {
	submission := &domain.Submission{
		UserID:          userID,
		ProblemID:       req.ProblemID,
		ContestID:       req.ContestID, // Will be NULL for practice, UUID for contest
		Language:        req.Language,
		Code:            req.Code,
		Status:          req.Status,
		ExecutionTime:   req.ExecutionTime,
		MemoryUsed:      req.MemoryUsed,
		TestCasesPassed: req.TestCasesPassed,
		TotalTestCases:  req.TotalTestCases,
		ErrorMessage:    req.ErrorMessage,
	}

	if err := ss.Repo.CreateSubmission(submission); err != nil {
		return nil, err
	}

	return submission, nil
}

func (ss *SubmissionService) GetSubmissionByID(id uuid.UUID) (*domain.Submission, error) {
	return ss.Repo.GetSubmissionByID(id)
}

func (ss *SubmissionService) ListSubmissions(opts dto.SubmissionListQueryDTO) ([]dto.SubmissionResponseDTO, int64, error) {
	submissions, total, err := ss.Repo.ListSubmissions(opts)
	if err != nil {
		return nil, 0, err
	}

	response := make([]dto.SubmissionResponseDTO, len(submissions))
	for i, sub := range submissions {
		response[i] = dto.SubmissionResponseDTO{
			ID:              sub.ID,
			UserID:          sub.UserID,
			ProblemID:       sub.ProblemID,
			ContestID:       sub.ContestID,
			ProblemSlug:     sub.Problem.Slug,
			ProblemTitle:    sub.Problem.MainHeading,
			Difficulty:      sub.Problem.Difficulty,
			Language:        sub.Language,
			Status:          sub.Status,
			ExecutionTime:   sub.ExecutionTime,
			MemoryUsed:      sub.MemoryUsed,
			TestCasesPassed: sub.TestCasesPassed,
			TotalTestCases:  sub.TotalTestCases,
			PointsEarned:    sub.PointsEarned,
			CreatedAt:       sub.CreatedAt.Format("2006-01-02 15:04:05"),
		}
	}

	return response, total, nil
}

func (ss *SubmissionService) GetUserStats(userID uuid.UUID) (*dto.UserStatsDTO, error) {
	stats, err := ss.Repo.GetUserStats(userID)
	if err != nil {
		return nil, err
	}

	// Get recent submissions
	recentSubmissions, err := ss.Repo.GetUserRecentSubmissions(userID, 10)
	if err != nil {
		return stats, nil // Return stats even if recent submissions fail
	}

	stats.RecentSubmissions = make([]dto.SubmissionResponseDTO, len(recentSubmissions))
	for i, sub := range recentSubmissions {
		stats.RecentSubmissions[i] = dto.SubmissionResponseDTO{
			ID:              sub.ID,
			UserID:          sub.UserID,
			ProblemID:       sub.ProblemID,
			ContestID:       sub.ContestID,
			ProblemSlug:     sub.Problem.Slug,
			ProblemTitle:    sub.Problem.MainHeading,
			Difficulty:      sub.Problem.Difficulty,
			Language:        sub.Language,
			Status:          sub.Status,
			ExecutionTime:   sub.ExecutionTime,
			MemoryUsed:      sub.MemoryUsed,
			TestCasesPassed: sub.TestCasesPassed,
			TotalTestCases:  sub.TotalTestCases,
			PointsEarned:    sub.PointsEarned,
			CreatedAt:       sub.CreatedAt.Format("2006-01-02 15:04:05"),
		}
	}

	return stats, nil
}

func (ss *SubmissionService) GetProblemStats(problemID uuid.UUID) (*dto.ProblemStatsDTO, error) {
	return ss.Repo.GetProblemStats(problemID)
}

func (ss *SubmissionService) GetUserSolvedProblems(userID uuid.UUID) ([]uuid.UUID, error) {
	return ss.Repo.GetUserSolvedProblems(userID)
}

func (ss *SubmissionService) GetTopicStats() ([]dto.TopicStatsDTO, error) {
	return ss.Repo.GetTopicStats()
}
