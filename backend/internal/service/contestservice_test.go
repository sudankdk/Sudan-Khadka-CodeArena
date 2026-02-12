package service

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/sudankdk/codearena/internal/domain"
	"github.com/sudankdk/codearena/internal/dto"
)

type MockContestRepo struct {
	mock.Mock
}

func (m *MockContestRepo) Create(contest *domain.Contest) error {
	args := m.Called(contest)
	return args.Error(0)
}

func (m *MockContestRepo) GetByID(id uuid.UUID) (*domain.Contest, error) {
	args := m.Called(id)
	return args.Get(0).(*domain.Contest), args.Error(1)
}

func (m *MockContestRepo) Update(contest *domain.Contest) error {
	args := m.Called(contest)
	return args.Error(0)
}

func (m *MockContestRepo) Delete(id uuid.UUID) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockContestRepo) List(query dto.ListQuery) ([]*domain.Contest, error) {
	args := m.Called(query)
	return args.Get(0).([]*domain.Contest), args.Error(1)
}

func (m *MockContestRepo) AddProblem(contestID, problemID uuid.UUID, orderIndex int, maxPoints int, partialCredit bool, timeMultiplier float64) error {
	args := m.Called(contestID, problemID, orderIndex, maxPoints, partialCredit, timeMultiplier)
	return args.Error(0)
}

func (m *MockContestRepo) RemoveProblem(contestID, problemID uuid.UUID) error {
	args := m.Called(contestID, problemID)
	return args.Error(0)
}

func (m *MockContestRepo) GetProblems(contestID uuid.UUID) ([]*domain.ContestProblem, error) {
	args := m.Called(contestID)
	return args.Get(0).([]*domain.ContestProblem), args.Error(1)
}

func (m *MockContestRepo) RegisterParticipant(contestID, userID uuid.UUID) error {
	args := m.Called(contestID, userID)
	return args.Error(0)
}

func (m *MockContestRepo) UnregisterParticipant(contestID, userID uuid.UUID) error {
	args := m.Called(contestID, userID)
	return args.Error(0)
}

func (m *MockContestRepo) GetParticipants(contestID uuid.UUID) ([]*domain.ContestParticipant, error) {
	args := m.Called(contestID)
	return args.Get(0).([]*domain.ContestParticipant), args.Error(1)
}

func (m *MockContestRepo) UpdateParticipantScore(contestID, userID uuid.UUID, points int, problemsSolved int, penaltyTime int) error {
	args := m.Called(contestID, userID, points, problemsSolved, penaltyTime)
	return args.Error(0)
}

func (m *MockContestRepo) GetLeaderboard(contestID uuid.UUID) ([]*domain.ContestLeaderboardEntry, error) {
	args := m.Called(contestID)
	return args.Get(0).([]*domain.ContestLeaderboardEntry), args.Error(1)
}

func (m *MockContestRepo) UpdateLeaderboardEntry(contestID, userID uuid.UUID, score int, rating float64, rank int) error {
	args := m.Called(contestID, userID, score, rating, rank)
	return args.Error(0)
}

func TestContestService(t *testing.T) {
	mockRepo := new(MockContestRepo)
	contestService := &ContestService{
		ContestRepo: mockRepo,
	}
	dto := dto.CreateContestDTO{
		Name:      "Test Contest",
		StartTime: time.Now(),
		EndTime:   time.Now().Add(2 * time.Hour),
	}

	mockRepo.On("Create", mock.AnythingOfType("*domain.Contest")).Return(nil)
	contest, err := contestService.CreateContest(dto)

	assert.NoError(t, err)
	assert.NotNil(t, contest)
	assert.Equal(t, dto.Name, contest.Name)
	assert.Equal(t, dto.StartTime, contest.StartTime)
	assert.Equal(t, dto.EndTime, contest.EndTime)

	mockRepo.AssertExpectations(t)
}

func TestContestService_CreateContest_Error(t *testing.T) {
	mockRepo := new(MockContestRepo)
	contestService := &ContestService{
		ContestRepo: mockRepo,
	}
	dto := dto.CreateContestDTO{
		Name:      "Test Contest",
		StartTime: time.Now(),
		EndTime:   time.Now().Add(2 * time.Hour),
	}

	mockRepo.On("Create", mock.AnythingOfType("*domain.Contest")).Return(assert.AnError)
	contest, err := contestService.CreateContest(dto)

	assert.Error(t, err)
	assert.Nil(t, contest)
	mockRepo.AssertExpectations(t)
}

func TestContestService_ListContests(t *testing.T) {
	mockRepo := new(MockContestRepo)
	contestService := &ContestService{
		ContestRepo: mockRepo,
	}
	query := dto.ListQuery{
		Page:     1,
		PageSize: 10,
		SortBy:   "created_at",
		Order:    "desc",
	}

	expectedContests := []*domain.Contest{
		{
			ID:        uuid.New(),
			Name:      "Contest 1",
			StartTime: time.Now(),
			EndTime:   time.Now().Add(2 * time.Hour),
		},
		{
			ID:        uuid.New(),
			Name:      "Contest 2",
			StartTime: time.Now().Add(24 * time.Hour),
			EndTime:   time.Now().Add(26 * time.Hour),
		},
	}

	mockRepo.On("List", query).Return(expectedContests, nil)
	contests, err := contestService.ListContests(query)

	assert.NoError(t, err)
	assert.NotNil(t, contests)
	assert.Len(t, contests, 2)
	assert.Equal(t, "Contest 1", contests[0].Name)
	assert.Equal(t, "Contest 2", contests[1].Name)

	mockRepo.AssertExpectations(t)
}

func TestContestService_ListContests_Error(t *testing.T) {
	mockRepo := new(MockContestRepo)
	contestService := &ContestService{
		ContestRepo: mockRepo,
	}
	query := dto.ListQuery{
		Page:     1,
		PageSize: 10,
	}

	mockRepo.On("List", query).Return([]*domain.Contest(nil), assert.AnError)
	contests, err := contestService.ListContests(query)

	assert.Error(t, err)
	assert.Nil(t, contests)
	mockRepo.AssertExpectations(t)
}
