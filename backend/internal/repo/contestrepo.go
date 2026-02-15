package repo

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/sudankdk/codearena/internal/domain"
	"github.com/sudankdk/codearena/internal/dto"
	"gorm.io/gorm"
)

type ContestRepo interface {
	Create(contest *domain.Contest) error
	GetByID(id uuid.UUID) (*domain.Contest, error)
	Update(contest *domain.Contest) error
	Delete(id uuid.UUID) error
	List(query dto.ListQuery) ([]*domain.Contest, error)
	AddProblem(contestID, problemID uuid.UUID, orderIndex int, maxPoints int, partialCredit bool, timeMultiplier float64) error
	RemoveProblem(contestID, problemID uuid.UUID) error
	GetProblems(contestID uuid.UUID) ([]*domain.ContestProblem, error)
	RegisterParticipant(contestID, userID uuid.UUID) error
	UnregisterParticipant(contestID, userID uuid.UUID) error
	IsUserRegistered(contestID, userID uuid.UUID) (bool, error)
	GetParticipants(contestID uuid.UUID) ([]*domain.ContestParticipant, error)
	UpdateParticipantScore(contestID, userID uuid.UUID, points int, problemsSolved int, penaltyTime int) error
	UpdateParticipantActivity(contestID, userID uuid.UUID, startedAt, lastSubmissionAt *time.Time, problemsAttempted int) error
	GetLeaderboard(contestID uuid.UUID) ([]*domain.ContestLeaderboardEntry, error)
	UpdateLeaderboardEntry(contestID, userID uuid.UUID, score int, rating float64, rank int) error
	UpdateGlobalLeaderboardEntry(userID uuid.UUID, rating float64, solvedCount int) error
	GetGlobalLeaderboard(limit int) ([]*domain.GlobalLeaderboardEntry, error)
}

type contestRepoImpl struct {
	db *gorm.DB
}

// AddProblem implements [ContestRepo].
func (c *contestRepoImpl) AddProblem(contestID uuid.UUID, problemID uuid.UUID, orderIndex int, maxPoints int, partialCredit bool, timeMultiplier float64) error {
	p := &domain.ContestProblem{
		ContestID:      contestID,
		ProblemID:      problemID,
		OrderIndex:     orderIndex,
		MaxPoints:      maxPoints,
		PartialCredit:  partialCredit,
		TimeMultiplier: timeMultiplier,
	}

	if err := c.db.Create(p).Error; err != nil {
		return err
	}
	return nil
}

// Create implements [ContestRepo].
func (c *contestRepoImpl) Create(contest *domain.Contest) error {
	if err := c.db.Create(contest).Error; err != nil {
		return err
	}
	return nil
}

// Delete implements [ContestRepo].
func (c *contestRepoImpl) Delete(id uuid.UUID) error {
	_, err := c.GetByID(id)
	if err != nil {
		return err
	}

	if err := c.db.Delete(&domain.Contest{}, "id = ?", id).Error; err != nil {
		return err
	}

	return nil
}

// GetByID implements [ContestRepo].
func (c *contestRepoImpl) GetByID(id uuid.UUID) (*domain.Contest, error) {
	db := c.db.Preload("Problems").Preload("Participants").Preload("Leaderboard").First(&domain.Contest{}, "id = ?", id)
	if db.Error != nil {
		return nil, db.Error
	}
	var contest domain.Contest
	if err := db.Scan(&contest).Error; err != nil {
		return nil, err
	}
	return &contest, nil
}

// GetLeaderboard implements [ContestRepo].
func (c *contestRepoImpl) GetLeaderboard(contestID uuid.UUID) ([]*domain.ContestLeaderboardEntry, error) {

	var entries []*domain.ContestLeaderboardEntry
	if err := c.db.Where("contest_id = ?", contestID).Preload("User").Find(&entries).Error; err != nil {
		return nil, err
	}
	return entries, nil
}

// GetParticipants implements [ContestRepo].
func (c *contestRepoImpl) GetParticipants(contestID uuid.UUID) ([]*domain.ContestParticipant, error) {
	var participants []*domain.ContestParticipant
	if err := c.db.Where("contest_id = ?", contestID).Preload("User").Find(&participants).Error; err != nil {
		return nil, err
	}
	return participants, nil
}

// GetProblems implements [ContestRepo].
func (c *contestRepoImpl) GetProblems(contestID uuid.UUID) ([]*domain.ContestProblem, error) {
	var problems []*domain.ContestProblem
	if err := c.db.Where("contest_id = ?", contestID).Preload("Problem").Find(&problems).Error; err != nil {
		return nil, err
	}
	return problems, nil
}

// List implements [ContestRepo].
func (c *contestRepoImpl) List(query dto.ListQuery) ([]*domain.Contest, error) {
	var contests []*domain.Contest
	db := ApplyListQuery[domain.Contest](c.db, query)
	if err := db.Find(&contests).Error; err != nil {
		return nil, err
	}
	return contests, nil
}

// RegisterParticipant implements [ContestRepo].
func (c *contestRepoImpl) RegisterParticipant(contestID uuid.UUID, userID uuid.UUID) error {
	// Check if participant already exists
	var existing domain.ContestParticipant
	if err := c.db.Where("contest_id = ? AND user_id = ?", contestID, userID).First(&existing).Error; err == nil {
		// Already registered - this is idempotent, return success
		return nil
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	participant := &domain.ContestParticipant{
		ContestID: contestID,
		UserID:    userID,
	}

	if err := c.db.Create(participant).Error; err != nil {
		return err
	}

	return nil
}

// IsUserRegistered implements [ContestRepo].
func (c *contestRepoImpl) IsUserRegistered(contestID uuid.UUID, userID uuid.UUID) (bool, error) {
	var count int64
	err := c.db.Model(&domain.ContestParticipant{}).
		Where("contest_id = ? AND user_id = ?", contestID, userID).
		Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// RemoveProblem implements [ContestRepo].
func (c *contestRepoImpl) RemoveProblem(contestID uuid.UUID, problemID uuid.UUID) error {
	if err := c.db.Where("contest_id = ? AND problem_id = ?", contestID, problemID).Delete(&domain.ContestProblem{}).Error; err != nil {
		return err
	}
	return nil
}

// UnregisterParticipant implements [ContestRepo].
func (c *contestRepoImpl) UnregisterParticipant(contestID uuid.UUID, userID uuid.UUID) error {
	if err := c.db.Where("contest_id = ? AND user_id = ?", contestID, userID).Delete(&domain.ContestParticipant{}).Error; err != nil {
		return err
	}
	return nil
}

// Update implements [ContestRepo].
func (c *contestRepoImpl) Update(contest *domain.Contest) error {
	// Only allow updating certain fields (e.g. name, description, start/end time)
	updates := map[string]interface{}{
		"name":        contest.Name,
		"description": contest.Description,
		"start_time":  contest.StartTime,
		"end_time":    contest.EndTime,
		"duration":    contest.Duration,
		"is_active":   contest.IsActive,
	}
	if err := c.db.Model(&domain.Contest{}).Where("id = ?", contest.ID).Updates(updates).Error; err != nil {
		return err
	}
	return nil
}

// UpdateLeaderboardEntry implements [ContestRepo].
func (c *contestRepoImpl) UpdateLeaderboardEntry(contestID uuid.UUID, userID uuid.UUID, score int, rating float64, rank int) error {
	// Check if entry exists
	var entry domain.ContestLeaderboardEntry
	if err := c.db.Where("contest_id = ? AND user_id = ?", contestID, userID).First(&entry).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Create new entry
			newEntry := &domain.ContestLeaderboardEntry{
				ContestID: contestID,
				UserID:    userID,
				Score:     score,
				Rating:    rating,
				Rank:      rank,
			}
			if err := c.db.Create(newEntry).Error; err != nil {
				return err
			}
		} else {
			return err
		}
	} else {
		// Update existing entry
		updates := map[string]interface{}{
			"score":  score,
			"rating": rating,
			"rank":   rank,
		}
		if err := c.db.Model(&entry).Where("id = ?", entry.ID).Updates(updates).Error; err != nil {
			return err
		}
	}
	return nil
}

// UpdateGlobalLeaderboardEntry implements [ContestRepo].
func (c *contestRepoImpl) UpdateGlobalLeaderboardEntry(userID uuid.UUID, rating float64, solvedCount int) error {
	// Get user for username
	var user domain.User
	if err := c.db.First(&user, "id = ?", userID).Error; err != nil {
		return err
	}

	// Check if entry exists
	var entry domain.GlobalLeaderboardEntry
	if err := c.db.Where("user_id = ?", userID).First(&entry).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Create new entry
			newEntry := &domain.GlobalLeaderboardEntry{
				UserID:               userID,
				Username:             user.Username,
				Rating:               rating,
				SolvedCount:          solvedCount,
				ContestsParticipated: 1, // This should be calculated properly
			}
			if err := c.db.Create(newEntry).Error; err != nil {
				return err
			}
		} else {
			return err
		}
	} else {
		// Update existing entry
		updates := map[string]interface{}{
			"rating":       rating,
			"solved_count": solvedCount,
			"updated_at":   time.Now(),
		}
		if err := c.db.Model(&entry).Where("id = ?", entry.ID).Updates(updates).Error; err != nil {
			return err
		}
	}

	// Recalculate global ranks
	return c.recalculateGlobalRanks()
}

func (c *contestRepoImpl) GetGlobalLeaderboard(limit int) ([]*domain.GlobalLeaderboardEntry, error) {
	var entries []*domain.GlobalLeaderboardEntry
	query := c.db.Preload("User").Order("rank ASC")
	if limit > 0 {
		query = query.Limit(limit)
	}
	if err := query.Find(&entries).Error; err != nil {
		return nil, err
	}
	return entries, nil
}

func (c *contestRepoImpl) recalculateGlobalRanks() error {
	var entries []domain.GlobalLeaderboardEntry
	if err := c.db.Order("rating DESC").Find(&entries).Error; err != nil {
		return err
	}

	for i, entry := range entries {
		rank := i + 1
		if err := c.db.Model(&entry).Where("id = ?", entry.ID).Update("rank", rank).Error; err != nil {
			return err
		}
	}
	return nil
}

// UpdateParticipantScore implements [ContestRepo].
func (c *contestRepoImpl) UpdateParticipantScore(contestID uuid.UUID, userID uuid.UUID, points int, problemsSolved int, penaltyTime int) error {
	// Check if participant exists
	var participant domain.ContestParticipant
	if err := c.db.Where("contest_id = ? AND user_id = ?", contestID, userID).First(&participant).Error; err != nil {
		return err
	}
	// Update participant's score and performance metrics
	updates := map[string]interface{}{
		"total_points":    participant.TotalPoints + points,
		"problems_solved": participant.ProblemsSolved + problemsSolved,
		"penalty_time":    participant.PenaltyTime + penaltyTime,
	}
	if err := c.db.Model(&participant).Where("id = ?", participant.ID).Updates(updates).Error; err != nil {
		return err
	}
	return nil
}

// UpdateParticipantActivity updates participant timestamps and attempt count
func (c *contestRepoImpl) UpdateParticipantActivity(contestID uuid.UUID, userID uuid.UUID, startedAt, lastSubmissionAt *time.Time, problemsAttempted int) error {
	var participant domain.ContestParticipant
	if err := c.db.Where("contest_id = ? AND user_id = ?", contestID, userID).First(&participant).Error; err != nil {
		return err
	}

	updates := map[string]interface{}{}

	// Set started_at only if it's null (first time)
	if startedAt != nil && participant.StartedAt == nil {
		updates["started_at"] = startedAt
	}

	// Always update last submission time
	if lastSubmissionAt != nil {
		updates["last_submission_at"] = lastSubmissionAt
	}

	// Increment problems attempted
	if problemsAttempted > 0 {
		updates["problems_attempted"] = participant.ProblemsAttempted + problemsAttempted
	}

	if len(updates) > 0 {
		if err := c.db.Model(&participant).Where("id = ?", participant.ID).Updates(updates).Error; err != nil {
			return err
		}
	}

	return nil
}

func NewContestRepo(db *gorm.DB) ContestRepo {
	return &contestRepoImpl{db: db}
}
