package repo

import (
	"errors"

	"github.com/google/uuid"
	"github.com/sudankdk/codearena/internal/domain"
	"gorm.io/gorm"
)

type ContestRepo interface {
	Create(contest *domain.Contest) error
	GetByID(id uuid.UUID) (*domain.Contest, error)
	Update(contest *domain.Contest) error
	Delete(id uuid.UUID) error
	List() ([]*domain.Contest, error)
	AddProblem(contestID, problemID uuid.UUID, orderIndex int, maxPoints int, partialCredit bool, timeMultiplier float64) error
	RemoveProblem(contestID, problemID uuid.UUID) error
	GetProblems(contestID uuid.UUID) ([]*domain.ContestProblem, error)
	RegisterParticipant(contestID, userID uuid.UUID) error
	UnregisterParticipant(contestID, userID uuid.UUID) error
	GetParticipants(contestID uuid.UUID) ([]*domain.ContestParticipant, error)
	UpdateParticipantScore(contestID, userID uuid.UUID, points int, problemsSolved int, penaltyTime int) error
	GetLeaderboard(contestID uuid.UUID) ([]*domain.ContestLeaderboardEntry, error)
	UpdateLeaderboardEntry(contestID, userID uuid.UUID, score int, rating float64, rank int) error
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
func (c *contestRepoImpl) List() ([]*domain.Contest, error) {
	var contests []*domain.Contest
	if err := c.db.Order("created_at DESC").Find(&contests).Error; err != nil {
		return nil, err
	}
	return contests, nil
}

// RegisterParticipant implements [ContestRepo].
func (c *contestRepoImpl) RegisterParticipant(contestID uuid.UUID, userID uuid.UUID) error {
	// Check if participant already exists
	var existing domain.ContestParticipant
	if err := c.db.Where("contest_id = ? AND user_id = ?", contestID, userID).First(&existing).Error; err == nil {
		return errors.New("participant already registered")
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
			"score": score,

			"rating": rating,
			"rank":   rank,
		}
		if err := c.db.Model(&entry).Where("id = ?", entry.ID).Updates(updates).Error; err != nil {
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

func NewContestRepo(db *gorm.DB) ContestRepo {
	return &contestRepoImpl{db: db}
}
