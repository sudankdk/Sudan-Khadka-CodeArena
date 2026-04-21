package repo

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/sudankdk/codearena/internal/domain"
	"gorm.io/gorm"
)

type PasswordResetRepo interface {
	Create(reset *domain.PasswordReset) error
	FindValidByTokenHash(tokenHash string, now time.Time) (*domain.PasswordReset, error)
	MarkUsed(id uuid.UUID) error
	InvalidateForUser(userID uuid.UUID) error
}

type passwordResetRepo struct {
	db *gorm.DB
}

var _ PasswordResetRepo = (*passwordResetRepo)(nil)

func NewPasswordResetRepo(db *gorm.DB) PasswordResetRepo {
	return &passwordResetRepo{db: db}
}

func (p *passwordResetRepo) Create(reset *domain.PasswordReset) error {
	if err := p.db.Create(reset).Error; err != nil {
		return errors.New("failed to create password reset")
	}
	return nil
}

func (p *passwordResetRepo) FindValidByTokenHash(tokenHash string, now time.Time) (*domain.PasswordReset, error) {
	var reset domain.PasswordReset
	if err := p.db.Where("token_hash = ? AND used_at IS NULL AND expires_at > ?", tokenHash, now).First(&reset).Error; err != nil {
		return nil, errors.New("reset token not found")
	}
	return &reset, nil
}

func (p *passwordResetRepo) MarkUsed(id uuid.UUID) error {
	now := time.Now()
	if err := p.db.Model(&domain.PasswordReset{}).Where("id = ?", id).Update("used_at", &now).Error; err != nil {
		return errors.New("failed to mark reset used")
	}
	return nil
}

func (p *passwordResetRepo) InvalidateForUser(userID uuid.UUID) error {
	now := time.Now()
	if err := p.db.Model(&domain.PasswordReset{}).
		Where("user_id = ? AND used_at IS NULL", userID).
		Update("used_at", &now).Error; err != nil {
		return errors.New("failed to invalidate resets")
	}
	return nil
}
