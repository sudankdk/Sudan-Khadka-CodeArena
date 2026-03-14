package repo

import (
	"fmt"
	"time"

	"github.com/sudankdk/codearena/internal/dto"
	"gorm.io/gorm"
)

type AdminStatsRepo struct {
	db *gorm.DB
}

func NewAdminStatsRepo(db *gorm.DB) *AdminStatsRepo {
	return &AdminStatsRepo{db: db}
}

// GetTotalUsers returns the total number of users
func (r *AdminStatsRepo) GetTotalUsers() (int, error) {
	var count int64
	err := r.db.Table("users").Count(&count).Error
	return int(count), err
}

// GetTotalProblems returns the total number of problems
func (r *AdminStatsRepo) GetTotalProblems() (int, error) {
	var count int64
	err := r.db.Table("problems").Count(&count).Error
	return int(count), err
}

// GetActiveContests returns the number of active contests
func (r *AdminStatsRepo) GetActiveContests() (int, error) {
	var count int64
	now := time.Now()
	err := r.db.Table("contests").
		Where("start_time <= ? AND end_time >= ?", now, now).
		Count(&count).Error
	return int(count), err
}

// GetUserGrowth returns user registration data grouped by period
func (r *AdminStatsRepo) GetUserGrowth(days int) ([]dto.TimeSeriesData, error) {
	results := []dto.TimeSeriesData{}

	query := fmt.Sprintf(`
		SELECT 
			TO_CHAR(created_at, 'YYYY-MM-DD') as period,
			COUNT(*) as count
		FROM users
		WHERE created_at >= NOW() - INTERVAL '%d days'
		GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
		ORDER BY period ASC
	`, days)

	if err := r.db.Raw(query).Scan(&results).Error; err != nil {
		return []dto.TimeSeriesData{}, nil // Return empty array instead of error
	}
	return results, nil
}

// GetSubmissionStats returns submission data grouped by period
func (r *AdminStatsRepo) GetSubmissionStats(days int) ([]dto.TimeSeriesData, error) {
	results := []dto.TimeSeriesData{}

	query := fmt.Sprintf(`
		SELECT 
			TO_CHAR(created_at, 'YYYY-MM-DD') as period,
			COUNT(*) as count
		FROM submissions
		WHERE created_at >= NOW() - INTERVAL '%d days'
		GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
		ORDER BY period ASC
	`, days)

	if err := r.db.Raw(query).Scan(&results).Error; err != nil {
		return []dto.TimeSeriesData{}, nil // Return empty array instead of error
	}
	return results, nil
}

// GetContestParticipation returns contest participation data
func (r *AdminStatsRepo) GetContestParticipation(days int) ([]dto.TimeSeriesData, error) {
	results := []dto.TimeSeriesData{}

	query := fmt.Sprintf(`
		SELECT 
			TO_CHAR(cp.created_at, 'YYYY-MM-DD') as period,
			COUNT(DISTINCT cp.user_id) as count
		FROM contest_participants cp
		WHERE cp.created_at >= NOW() - INTERVAL '%d days'
		GROUP BY TO_CHAR(cp.created_at, 'YYYY-MM-DD')
		ORDER BY period ASC
	`, days)

	if err := r.db.Raw(query).Scan(&results).Error; err != nil {
		return []dto.TimeSeriesData{}, nil // Return empty array instead of error
	}
	return results, nil
}
