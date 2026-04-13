package service

import (
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"github.com/sudankdk/codearena/configs"
	"github.com/sudankdk/codearena/internal/domain"
	"github.com/sudankdk/codearena/internal/dto"
	"github.com/sudankdk/codearena/internal/helper"
)

// newTestAuth returns a real Auth helper using a fixed test secret.
// We use the real bcrypt/JWT implementations so the service integration is genuine.
func newTestAuth() helper.Auth {
	return helper.Auth{Secret: "super-secret-test-key-for-unit-tests"}
}

// newUserService wires a UserService with the supplied mock repo.
func newUserService(mockRepo *MockUserRepo) *UserService {
	return &UserService{
		Repo:   mockRepo,
		Auth:   newTestAuth(),
		Config: configs.AppConfigs{},
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// Register
// ─────────────────────────────────────────────────────────────────────────────

func TestRegister_Success(t *testing.T) {
	// Arrange
	mockRepo := new(MockUserRepo)
	svc := newUserService(mockRepo)

	input := dto.UserRegister{
		Email:    "alice@example.com",
		Username: "alice",
		Password: "securePass1",
	}
	returned := domain.User{
		ID:       uuid.New(),
		Email:    input.Email,
		Username: input.Username,
	}
	mockRepo.On("CreateUser", mock.Anything).Return(returned, nil)

	// Act
	user, err := svc.Register(input)

	// Assert
	require.NoError(t, err)
	assert.Equal(t, returned.Email, user.Email)
	assert.Equal(t, returned.Username, user.Username)
	mockRepo.AssertExpectations(t)
}

func TestRegister_RepoError_ReturnsError(t *testing.T) {
	// Arrange
	mockRepo := new(MockUserRepo)
	svc := newUserService(mockRepo)

	input := dto.UserRegister{
		Email:    "bob@example.com",
		Username: "bob",
		Password: "pass",
	}
	mockRepo.On("CreateUser", mock.Anything).Return(domain.User{}, errors.New("db error"))

	// Act
	_, err := svc.Register(input)

	// Assert
	require.Error(t, err)
	assert.Contains(t, err.Error(), "error in creating user")
	mockRepo.AssertExpectations(t)
}

// ─────────────────────────────────────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────────────────────────────────────

func TestLogin_Success(t *testing.T) {
	// Arrange
	auth := newTestAuth()
	mockRepo := new(MockUserRepo)
	svc := &UserService{Repo: mockRepo, Auth: auth, Config: configs.AppConfigs{}}

	plain := "password123"
	hashed, err := auth.CreateHash(plain)
	require.NoError(t, err)

	storedUser := domain.User{
		ID:       uuid.New(),
		Email:    "carol@example.com",
		Username: "carol",
		Password: hashed,
		Role:     domain.REGULAR,
	}
	mockRepo.On("FindUser", storedUser.Email).Return(storedUser, nil)

	// Act
	token, user, err := svc.Login(dto.UserLogin{Email: storedUser.Email, Password: plain})

	// Assert
	require.NoError(t, err)
	assert.NotEmpty(t, token)
	assert.Equal(t, storedUser.Email, user.Email)
	mockRepo.AssertExpectations(t)
}

func TestLogin_EmptyEmail_ReturnsValidationError(t *testing.T) {
	svc := newUserService(new(MockUserRepo))

	_, _, err := svc.Login(dto.UserLogin{Email: "", Password: "pwd"})

	require.Error(t, err)
	assert.Equal(t, "fill all the required fields", err.Error())
}

func TestLogin_EmptyPassword_ReturnsValidationError(t *testing.T) {
	svc := newUserService(new(MockUserRepo))

	_, _, err := svc.Login(dto.UserLogin{Email: "x@x.com", Password: ""})

	require.Error(t, err)
	assert.Equal(t, "fill all the required fields", err.Error())
}

func TestLogin_UserNotFound_ReturnsError(t *testing.T) {
	// Arrange
	mockRepo := new(MockUserRepo)
	svc := newUserService(mockRepo)
	mockRepo.On("FindUser", "no@one.com").Return(domain.User{}, errors.New("user not found"))

	// Act
	_, _, err := svc.Login(dto.UserLogin{Email: "no@one.com", Password: "pwd"})

	// Assert
	require.Error(t, err)
	mockRepo.AssertExpectations(t)
}

func TestLogin_WrongPassword_ReturnsError(t *testing.T) {
	// Arrange
	auth := newTestAuth()
	mockRepo := new(MockUserRepo)
	svc := &UserService{Repo: mockRepo, Auth: auth, Config: configs.AppConfigs{}}

	hashed, _ := auth.CreateHash("correct123")
	storedUser := domain.User{
		ID:       uuid.New(),
		Email:    "dave@example.com",
		Password: hashed,
		Role:     domain.REGULAR,
	}
	mockRepo.On("FindUser", storedUser.Email).Return(storedUser, nil)

	// Act
	_, _, err := svc.Login(dto.UserLogin{Email: storedUser.Email, Password: "wrongpassword"})

	// Assert
	require.Error(t, err)
	assert.Equal(t, "incorrect username or password", err.Error())
	mockRepo.AssertExpectations(t)
}

// ─────────────────────────────────────────────────────────────────────────────
// AdminCreateUser
// ─────────────────────────────────────────────────────────────────────────────

func TestAdminCreateUser_Success_WithExplicitRole(t *testing.T) {
	// Arrange
	mockRepo := new(MockUserRepo)
	svc := newUserService(mockRepo)

	req := dto.AdminCreateUser{
		Email:    "admin@example.com",
		Username: "adminuser",
		Password: "adminPass1",
		Role:     domain.ADMIN,
	}
	returned := domain.User{ID: uuid.New(), Email: req.Email, Username: req.Username, Role: domain.ADMIN}
	mockRepo.On("CreateUser", mock.Anything).Return(returned, nil)

	// Act
	user, err := svc.AdminCreateUser(req)

	// Assert
	require.NoError(t, err)
	assert.Equal(t, domain.ADMIN, user.Role)
	mockRepo.AssertExpectations(t)
}

func TestAdminCreateUser_EmptyRole_DefaultsToRegular(t *testing.T) {
	// Arrange
	mockRepo := new(MockUserRepo)
	svc := newUserService(mockRepo)

	req := dto.AdminCreateUser{
		Email:    "user@example.com",
		Username: "someuser",
		Password: "pass123",
		Role:     "", // intentionally empty
	}
	// Capture the User passed to CreateUser and assert its Role
	var capturedUser domain.User
	mockRepo.On("CreateUser", mock.MatchedBy(func(u domain.User) bool {
		capturedUser = u
		return true
	})).Return(domain.User{ID: uuid.New(), Role: domain.REGULAR}, nil)

	// Act
	_, err := svc.AdminCreateUser(req)

	// Assert
	require.NoError(t, err)
	assert.Equal(t, domain.REGULAR, capturedUser.Role)
	mockRepo.AssertExpectations(t)
}

func TestAdminCreateUser_RepoError_ReturnsError(t *testing.T) {
	mockRepo := new(MockUserRepo)
	svc := newUserService(mockRepo)

	req := dto.AdminCreateUser{Email: "e@e.com", Username: "u", Password: "p", Role: domain.REGULAR}
	mockRepo.On("CreateUser", mock.Anything).Return(domain.User{}, errors.New("db constraint"))

	_, err := svc.AdminCreateUser(req)

	require.Error(t, err)
	mockRepo.AssertExpectations(t)
}

// ─────────────────────────────────────────────────────────────────────────────
// ListUsers
// ─────────────────────────────────────────────────────────────────────────────

func TestListUsers_Success(t *testing.T) {
	mockRepo := new(MockUserRepo)
	svc := newUserService(mockRepo)

	expected := []domain.User{{ID: uuid.New()}, {ID: uuid.New()}}
	mockRepo.On("ListUser").Return(expected, nil)

	users, err := svc.ListUsers()

	require.NoError(t, err)
	assert.Len(t, users, 2)
	mockRepo.AssertExpectations(t)
}

func TestListUsers_RepoError_ReturnsError(t *testing.T) {
	mockRepo := new(MockUserRepo)
	svc := newUserService(mockRepo)
	mockRepo.On("ListUser").Return([]domain.User{}, errors.New("db error"))

	_, err := svc.ListUsers()

	require.Error(t, err)
	assert.Contains(t, err.Error(), "Errors in listing users")
	mockRepo.AssertExpectations(t)
}

// ─────────────────────────────────────────────────────────────────────────────
// UpdateUser
// ─────────────────────────────────────────────────────────────────────────────

func TestUpdateUser_NoFields_ReturnsExistingUser(t *testing.T) {
	// Arrange: both FindUserById and UpdateUser should be called appropriately.
	mockRepo := new(MockUserRepo)
	svc := newUserService(mockRepo)

	id := uuid.New()
	existing := domain.User{ID: id, Username: "old", Email: "old@x.com"}
	mockRepo.On("FindUserById", id).Return(existing, nil)
	// UpdateUser must NOT be called when there are no fields to update.

	// Act
	result, err := svc.UpdateUser(id, dto.UserUpdate{})

	// Assert
	require.NoError(t, err)
	assert.Equal(t, existing.Username, result.Username)
	mockRepo.AssertExpectations(t)
}

func TestUpdateUser_WithUsername_UpdatesCorrectly(t *testing.T) {
	// Arrange
	mockRepo := new(MockUserRepo)
	svc := newUserService(mockRepo)

	id := uuid.New()
	existing := domain.User{ID: id, Username: "old"}
	newName := "newname"
	updated := domain.User{ID: id, Username: newName}

	mockRepo.On("FindUserById", id).Return(existing, nil)
	mockRepo.On("UpdateUser", id, map[string]interface{}{"username": newName}).Return(updated, nil)

	// Act
	result, err := svc.UpdateUser(id, dto.UserUpdate{Username: &newName})

	// Assert
	require.NoError(t, err)
	assert.Equal(t, newName, result.Username)
	mockRepo.AssertExpectations(t)
}

func TestUpdateUser_WithPassword_HashesBeforeUpdate(t *testing.T) {
	// Arrange: ensure the password stored is NOT the plain-text password.
	mockRepo := new(MockUserRepo)
	svc := newUserService(mockRepo)

	id := uuid.New()
	mockRepo.On("FindUserById", id).Return(domain.User{ID: id}, nil)

	var capturedUpdates map[string]interface{}
	mockRepo.On("UpdateUser", id, mock.MatchedBy(func(u map[string]interface{}) bool {
		capturedUpdates = u
		return true
	})).Return(domain.User{ID: id}, nil)

	plain := "newSecret99"

	// Act
	_, err := svc.UpdateUser(id, dto.UserUpdate{Password: &plain})

	// Assert
	require.NoError(t, err)
	hashed, ok := capturedUpdates["password"].(string)
	require.True(t, ok, "password key must be in updates")
	assert.NotEqual(t, plain, hashed, "password must be hashed, not plain-text")
	mockRepo.AssertExpectations(t)
}

func TestUpdateUser_UserNotFound_ReturnsError(t *testing.T) {
	mockRepo := new(MockUserRepo)
	svc := newUserService(mockRepo)

	id := uuid.New()
	mockRepo.On("FindUserById", id).Return(domain.User{}, errors.New("user not found"))

	_, err := svc.UpdateUser(id, dto.UserUpdate{})

	require.Error(t, err)
	mockRepo.AssertExpectations(t)
}

// ─────────────────────────────────────────────────────────────────────────────
// UserStats
// ─────────────────────────────────────────────────────────────────────────────

func TestUserStats_EmptyUserList(t *testing.T) {
	mockRepo := new(MockUserRepo)
	svc := newUserService(mockRepo)
	mockRepo.On("ListUser").Return([]domain.User{}, nil)

	stats, err := svc.UserStats()

	require.NoError(t, err)
	assert.Equal(t, 0, stats.TotalUsers)
	assert.Equal(t, 0.0, stats.AverageRating)
	mockRepo.AssertExpectations(t)
}

func TestUserStats_CountsAdminsAndRegularsCorrectly(t *testing.T) {
	// Arrange
	mockRepo := new(MockUserRepo)
	svc := newUserService(mockRepo)

	now := time.Now()
	users := []domain.User{
		{Role: domain.ADMIN, Rating: 1500, MatchesPlayed: 10, MatchesWon: 5, Solvedcount: 20, CreatedAt: now},
		{Role: domain.REGULAR, Rating: 1000, MatchesPlayed: 8, MatchesWon: 3, Solvedcount: 15, CreatedAt: now},
		{Role: domain.REGULAR, Rating: 1200, MatchesPlayed: 4, MatchesWon: 2, Solvedcount: 10, CreatedAt: now},
	}
	mockRepo.On("ListUser").Return(users, nil)

	// Act
	stats, err := svc.UserStats()

	// Assert
	require.NoError(t, err)
	assert.Equal(t, 3, stats.TotalUsers)
	assert.Equal(t, 1, stats.AdminUsers)
	assert.Equal(t, 2, stats.RegularUsers)
	assert.InDelta(t, (1500.0+1000.0+1200.0)/3.0, stats.AverageRating, 0.01)
	assert.Equal(t, 22, stats.TotalMatches)
	assert.Equal(t, 10, stats.TotalWins)
	assert.Equal(t, 45, stats.TotalSolved)
	assert.Equal(t, 3, stats.ActiveThisMonth, "all users created now should be active this month")
	mockRepo.AssertExpectations(t)
}

func TestUserStats_OldUsers_NotCountedAsActiveThisMonth(t *testing.T) {
	mockRepo := new(MockUserRepo)
	svc := newUserService(mockRepo)

	old := time.Now().AddDate(0, -2, 0) // 2 months ago
	users := []domain.User{
		{Role: domain.REGULAR, Rating: 1000, CreatedAt: old},
	}
	mockRepo.On("ListUser").Return(users, nil)

	stats, err := svc.UserStats()

	require.NoError(t, err)
	assert.Equal(t, 0, stats.ActiveThisMonth)
	mockRepo.AssertExpectations(t)
}

func TestUserStats_RepoError_ReturnsError(t *testing.T) {
	mockRepo := new(MockUserRepo)
	svc := newUserService(mockRepo)
	mockRepo.On("ListUser").Return([]domain.User{}, errors.New("db error"))

	_, err := svc.UserStats()

	require.Error(t, err)
	mockRepo.AssertExpectations(t)
}
