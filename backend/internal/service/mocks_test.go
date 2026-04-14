// Package service – white-box unit tests, same package so unexported helpers are accessible.
package service

import (
	"github.com/google/uuid"
	"github.com/stretchr/testify/mock"
	"github.com/sudankdk/codearena/internal/domain"
	"github.com/sudankdk/codearena/internal/dto"
)

// ─────────────────────────────────────────────────────────────────────────────
// MockUserRepo
// ─────────────────────────────────────────────────────────────────────────────

type MockUserRepo struct{ mock.Mock }

func (m *MockUserRepo) CreateUser(user domain.User) (domain.User, error) {
	args := m.Called(user)
	return args.Get(0).(domain.User), args.Error(1)
}

func (m *MockUserRepo) FindUser(email string) (domain.User, error) {
	args := m.Called(email)
	return args.Get(0).(domain.User), args.Error(1)
}

func (m *MockUserRepo) FindUserById(id uuid.UUID) (domain.User, error) {
	args := m.Called(id)
	return args.Get(0).(domain.User), args.Error(1)
}

func (m *MockUserRepo) UpdateUser(id uuid.UUID, updates map[string]interface{}) (domain.User, error) {
	args := m.Called(id, updates)
	return args.Get(0).(domain.User), args.Error(1)
}

func (m *MockUserRepo) UpdateUserRating(id uuid.UUID, rating float64) error {
	return m.Called(id, rating).Error(0)
}

func (m *MockUserRepo) UpdateUserSolvedCount(id uuid.UUID, solvedCount int) error {
	return m.Called(id, solvedCount).Error(0)
}

func (m *MockUserRepo) IncrementMatchStats(id uuid.UUID, won bool) error {
	return m.Called(id, won).Error(0)
}

func (m *MockUserRepo) ListUser() ([]domain.User, error) {
	args := m.Called()
	return args.Get(0).([]domain.User), args.Error(1)
}

// ─────────────────────────────────────────────────────────────────────────────
// MockRoadmapRepo
// ─────────────────────────────────────────────────────────────────────────────

type MockRoadmapRepo struct{ mock.Mock }

func (m *MockRoadmapRepo) CreateRoadmap(roadmap *domain.Roadmap) error {
	return m.Called(roadmap).Error(0)
}

func (m *MockRoadmapRepo) GetRoadmapByID(id uuid.UUID) (*domain.Roadmap, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Roadmap), args.Error(1)
}

func (m *MockRoadmapRepo) ListRoadmapsByUser(userID uuid.UUID) ([]domain.Roadmap, error) {
	args := m.Called(userID)
	return args.Get(0).([]domain.Roadmap), args.Error(1)
}

func (m *MockRoadmapRepo) UpdateRoadmap(id uuid.UUID, updates map[string]interface{}) error {
	return m.Called(id, updates).Error(0)
}

func (m *MockRoadmapRepo) DeleteRoadmap(id uuid.UUID) error {
	return m.Called(id).Error(0)
}

// ─────────────────────────────────────────────────────────────────────────────
// MockProblemsRepo
// ─────────────────────────────────────────────────────────────────────────────

type MockProblemsRepo struct{ mock.Mock }

func (m *MockProblemsRepo) CreateProblem(p *domain.Problem) error {
	return m.Called(p).Error(0)
}

func (m *MockProblemsRepo) GetProblemByID(id uuid.UUID, includeTC bool) (*domain.Problem, error) {
	args := m.Called(id, includeTC)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Problem), args.Error(1)
}

func (m *MockProblemsRepo) GetProblemBySlug(slug string, includeTC bool) (*domain.Problem, error) {
	args := m.Called(slug, includeTC)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Problem), args.Error(1)
}

func (m *MockProblemsRepo) GetProblemByTitle(title string) (*domain.Problem, error) {
	args := m.Called(title)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Problem), args.Error(1)
}

func (m *MockProblemsRepo) ListProblems(opts dto.ProblemListQueryDTO) ([]domain.Problem, int64, error) {
	args := m.Called(opts)
	return args.Get(0).([]domain.Problem), args.Get(1).(int64), args.Error(2)
}

func (m *MockProblemsRepo) UpdateProblem(id uuid.UUID, updates map[string]interface{}) error {
	return m.Called(id, updates).Error(0)
}

func (m *MockProblemsRepo) DeleteProblem(id uuid.UUID) error {
	return m.Called(id).Error(0)
}

// ─────────────────────────────────────────────────────────────────────────────
// MockBattleRepo
// ─────────────────────────────────────────────────────────────────────────────

type MockBattleRepo struct{ mock.Mock }

func (m *MockBattleRepo) CreateMatch(match *domain.BattleMatch) error {
	return m.Called(match).Error(0)
}

func (m *MockBattleRepo) GetMatchByID(id uuid.UUID) (*domain.BattleMatch, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.BattleMatch), args.Error(1)
}

func (m *MockBattleRepo) GetMatchWithDetails(id uuid.UUID) (*domain.BattleMatch, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.BattleMatch), args.Error(1)
}

func (m *MockBattleRepo) UpdateMatch(id uuid.UUID, updates map[string]interface{}) error {
	return m.Called(id, updates).Error(0)
}

func (m *MockBattleRepo) CreateSubmission(submission *domain.BattleSubmission) error {
	return m.Called(submission).Error(0)
}

func (m *MockBattleRepo) GetSubmissionByID(id uuid.UUID) (*domain.BattleSubmission, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.BattleSubmission), args.Error(1)
}

func (m *MockBattleRepo) GetSubmissionsByMatch(matchID uuid.UUID) ([]domain.BattleSubmission, error) {
	args := m.Called(matchID)
	return args.Get(0).([]domain.BattleSubmission), args.Error(1)
}

func (m *MockBattleRepo) UpdateSubmission(id uuid.UUID, updates map[string]interface{}) error {
	return m.Called(id, updates).Error(0)
}

func (m *MockBattleRepo) GetActiveMatchForUser(userID uuid.UUID) (*domain.BattleMatch, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.BattleMatch), args.Error(1)
}

func (m *MockBattleRepo) GetMatchHistory(userID uuid.UUID, page, pageSize int) ([]domain.BattleMatch, int64, error) {
	args := m.Called(userID, page, pageSize)
	return args.Get(0).([]domain.BattleMatch), args.Get(1).(int64), args.Error(2)
}

func (m *MockBattleRepo) GetUserBattleStats(userID uuid.UUID) (wins, losses, draws int, err error) {
	args := m.Called(userID)
	return args.Int(0), args.Int(1), args.Int(2), args.Error(3)
}

func (m *MockBattleRepo) GetBattleLeaderboard(page, pageSize int) ([]domain.User, int64, error) {
	args := m.Called(page, pageSize)
	return args.Get(0).([]domain.User), args.Get(1).(int64), args.Error(2)
}

func (m *MockBattleRepo) CreateEloHistory(entry *domain.BattleEloHistory) error {
	return m.Called(entry).Error(0)
}

func (m *MockBattleRepo) GetEloHistory(userID uuid.UUID, limit int) ([]domain.BattleEloHistory, error) {
	args := m.Called(userID, limit)
	return args.Get(0).([]domain.BattleEloHistory), args.Error(1)
}

func (m *MockBattleRepo) GetPassedSubmissionsForMatch(matchID uuid.UUID) ([]domain.BattleSubmission, error) {
	args := m.Called(matchID)
	return args.Get(0).([]domain.BattleSubmission), args.Error(1)
}

// ─────────────────────────────────────────────────────────────────────────────
// MockFrontendChallengeRepo
// ─────────────────────────────────────────────────────────────────────────────

type MockFrontendChallengeRepo struct{ mock.Mock }

func (m *MockFrontendChallengeRepo) Create(challenge *domain.FrontendChallenge) error {
	return m.Called(challenge).Error(0)
}

func (m *MockFrontendChallengeRepo) GetByID(id uuid.UUID) (*domain.FrontendChallenge, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.FrontendChallenge), args.Error(1)
}

func (m *MockFrontendChallengeRepo) List(page, pageSize int, difficulty string) ([]domain.FrontendChallenge, int64, error) {
	args := m.Called(page, pageSize, difficulty)
	return args.Get(0).([]domain.FrontendChallenge), args.Get(1).(int64), args.Error(2)
}

func (m *MockFrontendChallengeRepo) GetRandomByDifficulty(difficulty string) (*domain.FrontendChallenge, error) {
	args := m.Called(difficulty)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.FrontendChallenge), args.Error(1)
}

func (m *MockFrontendChallengeRepo) Update(id uuid.UUID, updates map[string]interface{}) error {
	return m.Called(id, updates).Error(0)
}

func (m *MockFrontendChallengeRepo) Delete(id uuid.UUID) error {
	return m.Called(id).Error(0)
}
