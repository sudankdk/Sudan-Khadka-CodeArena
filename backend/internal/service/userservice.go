package service

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"net/url"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/sudankdk/codearena/configs"
	"github.com/sudankdk/codearena/internal/domain"
	"github.com/sudankdk/codearena/internal/dto"
	"github.com/sudankdk/codearena/internal/helper"
	"github.com/sudankdk/codearena/internal/repo"
)

type UserService struct {
	Repo      repo.UserRepo
	ResetRepo repo.PasswordResetRepo
	Auth      helper.Auth
	Config    configs.AppConfigs
	Mailer    helper.Mailer
}

func (u *UserService) Register(dto dto.UserRegister) (domain.User, error) {

	hashedPassword, err := u.Auth.CreateHash(dto.Password)
	if err != nil {
		return domain.User{}, fmt.Errorf("error in creating hash: %d", err)
	}
	user := domain.User{
		Email:    dto.Email,
		Username: dto.Username,
		Password: hashedPassword,
	}
	newUser, err := u.Repo.CreateUser(user)
	if err != nil {
		return domain.User{}, fmt.Errorf("error in creating user")
	}

	return newUser, nil
}

func (u *UserService) AdminCreateUser(req dto.AdminCreateUser) (domain.User, error) {

	hashedPassword, err := u.Auth.CreateHash(req.Password)
	if err != nil {
		return domain.User{}, fmt.Errorf("error in creating hash: %v", err)
	}

	role := req.Role
	if role == "" {
		role = domain.REGULAR
	}

	user := domain.User{
		Email:    req.Email,
		Username: req.Username,
		Password: hashedPassword,
		Role:     role,
	}

	created, err := u.Repo.CreateUser(user)
	if err != nil {
		return domain.User{}, fmt.Errorf("error in creating user")
	}

	return created, nil
}

func (u *UserService) Login(dto dto.UserLogin) (string, domain.User, error) {
	if dto.Email == "" || dto.Password == "" {
		return "", domain.User{}, errors.New("fill all the required fields")
	}
	user, err := u.Repo.FindUser(dto.Email)
	if err != nil {
		return "", domain.User{}, err
	}
	if !u.Auth.VerifyHash(dto.Password, user.Password) {
		return "", domain.User{}, errors.New("incorrect username or password")
	}
	token, err := u.Auth.GenerateToken(user.ID, user.Email, user.Role)
	if err != nil {
		return "", domain.User{}, err
	}

	return token, user, nil
}

func (u *UserService) VerifyCode(code string, id uint) error {
	return nil
}

func (u *UserService) ListUsers() ([]domain.User, error) {

	users, err := u.Repo.ListUser()
	if err != nil {
		return []domain.User{}, errors.New("Errors in listing users")
	}
	return users, nil

}

func (u *UserService) UpdateUser(id uuid.UUID, req dto.UserUpdate) (domain.User, error) {
	existing, err := u.Repo.FindUserById(id)
	if err != nil {
		return domain.User{}, err
	}

	updates := make(map[string]interface{})

	if req.Username != nil {
		updates["username"] = *req.Username
	}
	if req.Email != nil {
		updates["email"] = *req.Email
	}
	if req.Role != nil {
		updates["role"] = *req.Role
	}
	if req.Rating != nil {
		updates["rating"] = *req.Rating
	}
	if req.MatchesPlayed != nil {
		updates["matches_played"] = *req.MatchesPlayed
	}
	if req.MatchesWon != nil {
		updates["matches_won"] = *req.MatchesWon
	}
	if req.SubmissionsCount != nil {
		updates["submissions_count"] = *req.SubmissionsCount
	}
	if req.SolvedCount != nil {
		updates["solved_count"] = *req.SolvedCount
	}
	if req.Bio != nil {
		updates["bio"] = *req.Bio
	}
	if req.LanguagePreference != nil {
		updates["language_preference"] = *req.LanguagePreference
	}
	if req.ProfileImage != nil {
		updates["profile_image"] = *req.ProfileImage
	}
	if req.Password != nil && *req.Password != "" {
		hashed, err := u.Auth.CreateHash(*req.Password)
		if err != nil {
			return domain.User{}, fmt.Errorf("error hashing password: %v", err)
		}
		updates["password"] = hashed
	}

	if len(updates) == 0 {
		return existing, nil
	}

	updated, err := u.Repo.UpdateUser(id, updates)
	if err != nil {
		return domain.User{}, err
	}

	return updated, nil
}

func (u *UserService) UserStats() (dto.UserStats, error) {
	users, err := u.Repo.ListUser()
	if err != nil {
		return dto.UserStats{}, err
	}

	var stats dto.UserStats
	stats.TotalUsers = len(users)

	now := time.Now()
	for _, user := range users {
		if user.Role == domain.ADMIN {
			stats.AdminUsers++
		} else {
			stats.RegularUsers++
		}
		stats.AverageRating += user.Rating
		stats.TotalMatches += user.MatchesPlayed
		stats.TotalWins += user.MatchesWon
		stats.TotalSolved += user.Solvedcount
		if user.CreatedAt.After(now.AddDate(0, -1, 0)) {
			stats.ActiveThisMonth++
		}
	}

	if stats.TotalUsers > 0 {
		stats.AverageRating = stats.AverageRating / float64(stats.TotalUsers)
	}

	return stats, nil
}

func (u *UserService) RequestPasswordReset(email string) error {
	if strings.TrimSpace(email) == "" {
		return errors.New("email is required")
	}
	if u.ResetRepo == nil || u.Mailer == nil {
		return errors.New("password reset not configured")
	}

	user, err := u.Repo.FindUser(email)
	if err != nil {
		// Avoid leaking whether the account exists.
		return nil
	}

	_ = u.ResetRepo.InvalidateForUser(user.ID)

	token, tokenHash, err := generateResetToken()
	if err != nil {
		return err
	}

	reset := domain.PasswordReset{
		UserID:    user.ID,
		TokenHash: tokenHash,
		ExpiresAt: time.Now().Add(u.passwordResetTTL()),
	}
	if err := u.ResetRepo.Create(&reset); err != nil {
		return err
	}

	resetLink := u.passwordResetLink(token)
	body := fmt.Sprintf(
		"Hi %s,\n\nWe received a request to reset your Code Arena password.\n\nReset link: %s\n\nThis link expires in %d minutes. If you did not request this, you can ignore this email.",
		user.Username,
		resetLink,
		int(u.passwordResetTTL().Minutes()),
	)

	return u.Mailer.Send(user.Email, "Reset your Code Arena password", body)
}

func (u *UserService) ResetPassword(token, newPassword string) error {
	if strings.TrimSpace(token) == "" {
		return errors.New("reset token is required")
	}
	if strings.TrimSpace(newPassword) == "" {
		return errors.New("password is required")
	}
	if len(newPassword) < 6 {
		return errors.New("password must be at least 6 characters")
	}
	if u.ResetRepo == nil {
		return errors.New("password reset not configured")
	}

	reset, err := u.ResetRepo.FindValidByTokenHash(hashResetToken(token), time.Now())
	if err != nil {
		return errors.New("invalid or expired reset token")
	}

	hashed, err := u.Auth.CreateHash(newPassword)
	if err != nil {
		return fmt.Errorf("error hashing password: %v", err)
	}

	if _, err := u.Repo.UpdateUser(reset.UserID, map[string]interface{}{"password": hashed}); err != nil {
		return err
	}

	if err := u.ResetRepo.MarkUsed(reset.ID); err != nil {
		return err
	}

	_ = u.ResetRepo.InvalidateForUser(reset.UserID)
	return nil
}

func (u *UserService) passwordResetTTL() time.Duration {
	if u.Config.PasswordResetTTL > 0 {
		return time.Duration(u.Config.PasswordResetTTL) * time.Minute
	}
	return 30 * time.Minute
}

func (u *UserService) passwordResetLink(token string) string {
	base := strings.TrimRight(strings.TrimSpace(u.Config.FRONTENDURL), "/")
	if base == "" {
		base = "http://localhost:5173"
	}
	return fmt.Sprintf("%s/reset-password?token=%s", base, url.QueryEscape(token))
}

func generateResetToken() (string, string, error) {
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		return "", "", err
	}

	token := base64.RawURLEncoding.EncodeToString(buf)
	return token, hashResetToken(token), nil
}

func hashResetToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return fmt.Sprintf("%x", sum[:])
}
