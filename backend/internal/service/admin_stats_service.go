package service

import (
	"time"

	"github.com/sudankdk/codearena/internal/dto"
	"github.com/sudankdk/codearena/internal/repo"
	"go.uber.org/zap"
)

// AdminStatsService handles admin statistics
type AdminStatsService struct {
	repo   *repo.AdminStatsRepo
	logger *zap.Logger
}

func NewAdminStatsService(repo *repo.AdminStatsRepo, logger *zap.Logger) *AdminStatsService {
	return &AdminStatsService{
		repo:   repo,
		logger: logger,
	}
}

// GetStats retrieves all admin statistics
func (s *AdminStatsService) GetStats(days int) (*dto.AdminStats, error) {
	s.logger.Debug("Fetching admin stats", zap.Int("days", days))

	totalUsers, err := s.repo.GetTotalUsers()
	if err != nil {
		s.logger.Error("Failed to get total users", zap.Error(err))
		return nil, err
	}

	totalProblems, err := s.repo.GetTotalProblems()
	if err != nil {
		s.logger.Error("Failed to get total problems", zap.Error(err))
		return nil, err
	}

	activeContests, err := s.repo.GetActiveContests()
	if err != nil {
		s.logger.Error("Failed to get active contests", zap.Error(err))
		return nil, err
	}

	userGrowth, err := s.repo.GetUserGrowth(days)
	if err != nil {
		s.logger.Warn("Failed to get user growth, using empty data", zap.Error(err))
		userGrowth = []dto.TimeSeriesData{}
	}

	submissionStats, err := s.repo.GetSubmissionStats(days)
	if err != nil {
		s.logger.Warn("Failed to get submission stats, using empty data", zap.Error(err))
		submissionStats = []dto.TimeSeriesData{}
	}

	contestParticipation, err := s.repo.GetContestParticipation(days)
	if err != nil {
		s.logger.Warn("Failed to get contest participation, using empty data", zap.Error(err))
		contestParticipation = []dto.TimeSeriesData{}
	}

	return &dto.AdminStats{
		TotalUsers:           totalUsers,
		TotalProblems:        totalProblems,
		ActiveContests:       activeContests,
		UserGrowth:           userGrowth,
		SubmissionStats:      submissionStats,
		ContestParticipation: contestParticipation,
		LastUpdated:          time.Now(),
	}, nil
}
