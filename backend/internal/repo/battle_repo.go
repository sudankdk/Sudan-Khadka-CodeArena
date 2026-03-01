package repo

import (
	"github.com/google/uuid"
	"github.com/sudankdk/codearena/internal/domain"
	"gorm.io/gorm"
)

type BattleRepo interface {
	CreateMatch(match *domain.BattleMatch) error
	GetMatchByID(id uuid.UUID) (*domain.BattleMatch, error)
	GetMatchWithDetails(id uuid.UUID) (*domain.BattleMatch, error)
	UpdateMatch(id uuid.UUID, updates map[string]interface{}) error
	CreateSubmission(submission *domain.BattleSubmission) error
	GetSubmissionByID(id uuid.UUID) (*domain.BattleSubmission, error)
	GetSubmissionsByMatch(matchID uuid.UUID) ([]domain.BattleSubmission, error)
	UpdateSubmission(id uuid.UUID, updates map[string]interface{}) error
	GetActiveMatchForUser(userID uuid.UUID) (*domain.BattleMatch, error)
	GetMatchHistory(userID uuid.UUID, page, pageSize int) ([]domain.BattleMatch, int64, error)
	GetUserBattleStats(userID uuid.UUID) (wins, losses, draws int, err error)
	GetBattleLeaderboard(page, pageSize int) ([]domain.User, int64, error)
	CreateEloHistory(entry *domain.BattleEloHistory) error
	GetEloHistory(userID uuid.UUID, limit int) ([]domain.BattleEloHistory, error)
	GetPassedSubmissionsForMatch(matchID uuid.UUID) ([]domain.BattleSubmission, error)
}

type battleRepo struct {
	db *gorm.DB
}

var _ BattleRepo = (*battleRepo)(nil)

func (r *battleRepo) CreateMatch(match *domain.BattleMatch) error {
	return r.db.Create(match).Error
}

func (r *battleRepo) GetMatchByID(id uuid.UUID) (*domain.BattleMatch, error) {
	var match domain.BattleMatch
	if err := r.db.First(&match, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &match, nil
}

func (r *battleRepo) GetMatchWithDetails(id uuid.UUID) (*domain.BattleMatch, error) {
	var match domain.BattleMatch
	if err := r.db.
		Preload("Challenge").
		Preload("PlayerA").
		Preload("PlayerB").
		Preload("Submissions").
		First(&match, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &match, nil
}

func (r *battleRepo) UpdateMatch(id uuid.UUID, updates map[string]interface{}) error {
	return r.db.Model(&domain.BattleMatch{}).Where("id = ?", id).Updates(updates).Error
}

func (r *battleRepo) CreateSubmission(submission *domain.BattleSubmission) error {
	return r.db.Create(submission).Error
}

func (r *battleRepo) GetSubmissionByID(id uuid.UUID) (*domain.BattleSubmission, error) {
	var sub domain.BattleSubmission
	if err := r.db.First(&sub, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &sub, nil
}

func (r *battleRepo) GetSubmissionsByMatch(matchID uuid.UUID) ([]domain.BattleSubmission, error) {
	var subs []domain.BattleSubmission
	if err := r.db.Where("match_id = ?", matchID).Order("submitted_at ASC").Find(&subs).Error; err != nil {
		return nil, err
	}
	return subs, nil
}

func (r *battleRepo) UpdateSubmission(id uuid.UUID, updates map[string]interface{}) error {
	return r.db.Model(&domain.BattleSubmission{}).Where("id = ?", id).Updates(updates).Error
}

func (r *battleRepo) GetActiveMatchForUser(userID uuid.UUID) (*domain.BattleMatch, error) {
	var match domain.BattleMatch
	if err := r.db.
		Where("(player_a_id = ? OR player_b_id = ?) AND status IN ?", userID, userID, []string{"waiting", "ongoing", "judging"}).
		Preload("Challenge").
		Preload("PlayerA").
		Preload("PlayerB").
		First(&match).Error; err != nil {
		return nil, err
	}
	return &match, nil
}

func (r *battleRepo) GetMatchHistory(userID uuid.UUID, page, pageSize int) ([]domain.BattleMatch, int64, error) {
	var matches []domain.BattleMatch
	var total int64

	query := r.db.Model(&domain.BattleMatch{}).
		Where("(player_a_id = ? OR player_b_id = ?) AND status = ?", userID, userID, "finished")

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	if err := query.
		Preload("PlayerA").
		Preload("PlayerB").
		Preload("Challenge").
		Offset(offset).Limit(pageSize).
		Order("created_at DESC").
		Find(&matches).Error; err != nil {
		return nil, 0, err
	}

	return matches, total, nil
}

func (r *battleRepo) GetUserBattleStats(userID uuid.UUID) (wins, losses, draws int, err error) {
	var w, l, d int64

	if err := r.db.Model(&domain.BattleMatch{}).
		Where("winner_id = ? AND status = ?", userID, "finished").
		Count(&w).Error; err != nil {
		return 0, 0, 0, err
	}

	if err := r.db.Model(&domain.BattleMatch{}).
		Where("(player_a_id = ? OR player_b_id = ?) AND status = ? AND winner_id IS NOT NULL AND winner_id != ?",
			userID, userID, "finished", userID).
		Count(&l).Error; err != nil {
		return 0, 0, 0, err
	}

	if err := r.db.Model(&domain.BattleMatch{}).
		Where("(player_a_id = ? OR player_b_id = ?) AND status = ? AND result = ?",
			userID, userID, "finished", "draw").
		Count(&d).Error; err != nil {
		return 0, 0, 0, err
	}

	return int(w), int(l), int(d), nil
}

func (r *battleRepo) GetBattleLeaderboard(page, pageSize int) ([]domain.User, int64, error) {
	var users []domain.User
	var total int64

	query := r.db.Model(&domain.User{}).Where("matches_played > 0")
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	if err := query.
		Order("rating DESC, matches_won DESC").
		Offset(offset).Limit(pageSize).
		Find(&users).Error; err != nil {
		return nil, 0, err
	}

	return users, total, nil
}

func (r *battleRepo) CreateEloHistory(entry *domain.BattleEloHistory) error {
	return r.db.Create(entry).Error
}

func (r *battleRepo) GetEloHistory(userID uuid.UUID, limit int) ([]domain.BattleEloHistory, error) {
	var history []domain.BattleEloHistory
	if err := r.db.Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).
		Find(&history).Error; err != nil {
		return nil, err
	}
	return history, nil
}

func (r *battleRepo) GetPassedSubmissionsForMatch(matchID uuid.UUID) ([]domain.BattleSubmission, error) {
	var subs []domain.BattleSubmission
	if err := r.db.Where("match_id = ? AND passed = ?", matchID, true).
		Order("submitted_at ASC").
		Find(&subs).Error; err != nil {
		return nil, err
	}
	return subs, nil
}

func NewBattleRepo(db *gorm.DB) BattleRepo {
	return &battleRepo{db: db}
}
