package repo

import (
	"errors" "github.com/google/uuid"
	"github.com/sudankdk/codearena/internal/domain"
	"github.com/sudankdk/codearena/internal/dto"
	"gorm.io/gorm"
)

type SubmissionRepo interface {
	CreateSubmission(submission *domain.Submission) error
	GetSubmissionByID(id uuid.UUID) (*domain.Submission, error)
	ListSubmissions(opts dto.SubmissionListQueryDTO) ([]domain.Submission, int64, error)
	GetUserStats(userID uuid.UUID) (*dto.UserStatsDTO, error)
	GetProblemStats(problemID uuid.UUID) (*dto.ProblemStatsDTO, error)
	GetUserRecentSubmissions(userID uuid.UUID, limit int) ([]domain.Submission, error)
	GetUserSolvedProblems(userID uuid.UUID) ([]uuid.UUID, error)
	HasUserSolvedProblem(userID, problemID uuid.UUID) (bool, error)
	GetTopicStats() ([]dto.TopicStatsDTO, error)
}

type submissionRepo struct {
	db *gorm.DB
}

var _ SubmissionRepo = (*submissionRepo)(nil)

func (sr *submissionRepo) CreateSubmission(submission *domain.Submission) error {
	if err := sr.db.Create(submission).Error; err != nil {
		return errors.New("error creating submission")
	}
	return nil
}

func (sr *submissionRepo) GetSubmissionByID(id uuid.UUID) (*domain.Submission, error) {
	var submission domain.Submission
	if err := sr.db.Preload("Problem").Preload("User").First(&submission, "id = ?", id).Error; err != nil {
		return nil, errors.New("submission not found")
	}
	return &submission, nil
}

func (sr *submissionRepo) ListSubmissions(opts dto.SubmissionListQueryDTO) ([]domain.Submission, int64, error) {
	var submissions []domain.Submission
	var total int64

	query := sr.db.Model(&domain.Submission{})

	// Apply filters
	if opts.UserID != nil {
		query = query.Where("user_id = ?", *opts.UserID)
	}
	if opts.ProblemID != nil {
		query = query.Where("problem_id = ?", *opts.ProblemID)
	}
	if opts.Status != "" {
		query = query.Where("status = ?", opts.Status)
	}
	if opts.Language != "" {
		query = query.Where("language = ?", opts.Language)
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination and preload
	query = query.Preload("Problem").Preload("User").
		Order("created_at DESC")

	if opts.Limit > 0 {
		query = query.Limit(opts.Limit)
	}
	if opts.Offset > 0 {
		query = query.Offset(opts.Offset)
	}

	if err := query.Find(&submissions).Error; err != nil {
		return nil, 0, err
	}

	return submissions, total, nil
}

func (sr *submissionRepo) GetUserStats(userID uuid.UUID) (*dto.UserStatsDTO, error) {
	var stats dto.UserStatsDTO

	// Get total submissions
	var totalSubmissions int64
	sr.db.Model(&domain.Submission{}).
		Where("user_id = ?", userID).
		Count(&totalSubmissions)
	stats.TotalSubmissions = int(totalSubmissions)

	// Get accepted count
	var acceptedCount int64
	sr.db.Model(&domain.Submission{}).
		Where("user_id = ? AND status = ?", userID, domain.STATUS_ACCEPTED).
		Count(&acceptedCount)
	stats.AcceptedCount = int(acceptedCount)

	// Calculate acceptance rate
	if stats.TotalSubmissions > 0 {
		stats.AcceptanceRate = float64(stats.AcceptedCount) / float64(stats.TotalSubmissions) * 100
	}

	// Get solved problems by difficulty
	type DifficultyCount struct {
		Difficulty string
		Count      int64
	}

	var difficultyCounts []DifficultyCount
	sr.db.Model(&domain.Submission{}).
		Select("problems.difficulty, COUNT(DISTINCT submissions.problem_id) as count").
		Joins("JOIN problems ON problems.id = submissions.problem_id").
		Where("submissions.user_id = ? AND submissions.status = ?", userID, domain.STATUS_ACCEPTED).
		Group("problems.difficulty").
		Scan(&difficultyCounts)

	for _, dc := range difficultyCounts {
		switch dc.Difficulty {
		case domain.EASY:
			stats.EasySolved = int(dc.Count)
		case domain.MEDIUM:
			stats.MediumSolved = int(dc.Count)
		case domain.HARD:
			stats.HardSolved = int(dc.Count)
		}
	}

	stats.TotalSolved = stats.EasySolved + stats.MediumSolved + stats.HardSolved

	return &stats, nil
}

func (sr *submissionRepo) GetProblemStats(problemID uuid.UUID) (*dto.ProblemStatsDTO, error) {
	var stats dto.ProblemStatsDTO
	stats.ProblemID = problemID

	// Get total submissions
	var totalSubmissions int64
	sr.db.Model(&domain.Submission{}).
		Where("problem_id = ?", problemID).
		Count(&totalSubmissions)
	stats.TotalSubmissions = int(totalSubmissions)

	// Get accepted count
	var acceptedCount int64
	sr.db.Model(&domain.Submission{}).
		Where("problem_id = ? AND status = ?", problemID, domain.STATUS_ACCEPTED).
		Count(&acceptedCount)
	stats.AcceptedCount = int(acceptedCount)

	// Calculate acceptance rate
	if stats.TotalSubmissions > 0 {
		stats.AcceptanceRate = float64(stats.AcceptedCount) / float64(stats.TotalSubmissions) * 100
	}

	return &stats, nil
}

func (sr *submissionRepo) GetUserRecentSubmissions(userID uuid.UUID, limit int) ([]domain.Submission, error) {
	var submissions []domain.Submission
	err := sr.db.Where("user_id = ?", userID).
		Preload("Problem").
		Order("created_at DESC").
		Limit(limit).
		Find(&submissions).Error

	if err != nil {
		return nil, err
	}
	return submissions, nil
}

func (sr *submissionRepo) GetUserSolvedProblems(userID uuid.UUID) ([]uuid.UUID, error) {
	var problemIDs []uuid.UUID
	err := sr.db.Model(&domain.Submission{}).
		Where("user_id = ? AND status = ?", userID, domain.STATUS_ACCEPTED).
		Distinct("problem_id").
		Pluck("problem_id", &problemIDs).Error

	if err != nil {
		return nil, err
	}
	return problemIDs, nil
}

func (sr *submissionRepo) HasUserSolvedProblem(userID, problemID uuid.UUID) (bool, error) {
	var count int64
	err := sr.db.Model(&domain.Submission{}).
		Where("user_id = ? AND problem_id = ? AND status = ?",
			userID, problemID, domain.STATUS_ACCEPTED).
		Count(&count).Error

	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (sr *submissionRepo) GetTopicStats() ([]dto.TopicStatsDTO, error) {
	var stats []dto.TopicStatsDTO
	
	err := sr.db.Model(&domain.Problem{}).
		Select("tag, COUNT(*) as count").
		Group("tag").
		Order("count DESC").
		Scan(&stats).Error
	
	if err != nil {
		return nil, err
	}
	return stats, nil
}

func NewSubmissionRepo(db *gorm.DB) SubmissionRepo {
	return &submissionRepo{db: db}
}
