package service

import (
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"github.com/sudankdk/codearena/internal/domain"
	"github.com/sudankdk/codearena/internal/dto"
)

// ─────────────────────────────────────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────────────────────────────────────

func newRoadmapService(rRepo *MockRoadmapRepo, pRepo *MockProblemsRepo) *RoadmapService {
	return &RoadmapService{
		Repo:         rRepo,
		ProblemsRepo: pRepo,
	}
}

func sampleRoadmap(userID uuid.UUID) *domain.Roadmap {
	return &domain.Roadmap{
		ID:            uuid.New(),
		UserID:        userID,
		Name:          "Go Roadmap",
		Description:   "Learn Go",
		Visibility:    domain.RoadmapVisibilityPrivate,
		Topics:        []string{"arrays", "maps"},
		ProblemIDs:    []uuid.UUID{},
		TotalProblems: 0,
		Progress:      0,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
		User:          domain.User{Username: "alice"},
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// normalizeVisibility (unexported – accessible from same package)
// ─────────────────────────────────────────────────────────────────────────────

func TestNormalizeVisibility(t *testing.T) {
	cases := []struct {
		input    string
		expected string
	}{
		{"public", domain.RoadmapVisibilityPublic},
		{"PUBLIC", domain.RoadmapVisibilityPublic},
		{"Public", domain.RoadmapVisibilityPublic},
		{"  public  ", domain.RoadmapVisibilityPublic},
		{"private", domain.RoadmapVisibilityPrivate},
		{"PRIVATE", domain.RoadmapVisibilityPrivate},
		{"", ""},
		{"unknown", ""},
		{"friend", ""},
	}

	for _, tc := range cases {
		t.Run(tc.input, func(t *testing.T) {
			got := normalizeVisibility(tc.input)
			assert.Equal(t, tc.expected, got)
		})
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// CreateRoadmap
// ─────────────────────────────────────────────────────────────────────────────

func TestCreateRoadmap_Success(t *testing.T) {
	// Arrange
	rRepo := new(MockRoadmapRepo)
	svc := newRoadmapService(rRepo, nil)

	userID := uuid.New()
	req := dto.CreateRoadmapDTO{
		Name:       "My Roadmap",
		Visibility: "public",
		Topics:     []string{"DS", "Algo"},
	}
	rm := sampleRoadmap(userID)
	rm.Name = req.Name
	rm.Visibility = domain.RoadmapVisibilityPublic

	rRepo.On("CreateRoadmap", mock.Anything).Return(nil)
	rRepo.On("GetRoadmapByID", mock.AnythingOfType("uuid.UUID")).Return(rm, nil)

	// Act
	resp, err := svc.CreateRoadmap(userID, req)

	// Assert
	require.NoError(t, err)
	assert.Equal(t, req.Name, resp.Name)
	assert.Equal(t, domain.RoadmapVisibilityPublic, resp.Visibility)
	rRepo.AssertExpectations(t)
}

func TestCreateRoadmap_EmptyName_ReturnsError(t *testing.T) {
	svc := newRoadmapService(new(MockRoadmapRepo), nil)

	_, err := svc.CreateRoadmap(uuid.New(), dto.CreateRoadmapDTO{Name: "   "})

	require.Error(t, err)
	assert.Equal(t, "roadmap name is required", err.Error())
}

func TestCreateRoadmap_NoVisibility_DefaultsToPrivate(t *testing.T) {
	// Arrange
	rRepo := new(MockRoadmapRepo)
	svc := newRoadmapService(rRepo, nil)

	userID := uuid.New()
	req := dto.CreateRoadmapDTO{Name: "Road", Visibility: ""}

	var capturedRoadmap *domain.Roadmap
	rRepo.On("CreateRoadmap", mock.MatchedBy(func(r *domain.Roadmap) bool {
		capturedRoadmap = r
		return true
	})).Return(nil)

	rm := sampleRoadmap(userID)
	rm.Visibility = domain.RoadmapVisibilityPrivate
	rRepo.On("GetRoadmapByID", mock.AnythingOfType("uuid.UUID")).Return(rm, nil)

	// Act
	_, err := svc.CreateRoadmap(userID, req)

	// Assert
	require.NoError(t, err)
	assert.Equal(t, domain.RoadmapVisibilityPrivate, capturedRoadmap.Visibility)
	rRepo.AssertExpectations(t)
}

func TestCreateRoadmap_TotalProblems_InferredFromProblemIDs(t *testing.T) {
	// Arrange: no TotalProblems set → should use len(ProblemIDs)
	rRepo := new(MockRoadmapRepo)
	svc := newRoadmapService(rRepo, nil)

	ids := []uuid.UUID{uuid.New(), uuid.New(), uuid.New()}
	req := dto.CreateRoadmapDTO{
		Name:          "Road",
		ProblemIDs:    ids,
		TotalProblems: 0, // not provided
	}

	var captured *domain.Roadmap
	rRepo.On("CreateRoadmap", mock.MatchedBy(func(r *domain.Roadmap) bool {
		captured = r
		return true
	})).Return(nil)

	rm := sampleRoadmap(uuid.New())
	rRepo.On("GetRoadmapByID", mock.AnythingOfType("uuid.UUID")).Return(rm, nil)

	// Act
	_, err := svc.CreateRoadmap(uuid.New(), req)

	// Assert
	require.NoError(t, err)
	assert.Equal(t, 3, captured.TotalProblems)
	rRepo.AssertExpectations(t)
}

func TestCreateRoadmap_RepoCreateError_ReturnsError(t *testing.T) {
	rRepo := new(MockRoadmapRepo)
	svc := newRoadmapService(rRepo, nil)
	rRepo.On("CreateRoadmap", mock.Anything).Return(errors.New("db error"))

	_, err := svc.CreateRoadmap(uuid.New(), dto.CreateRoadmapDTO{Name: "Road"})

	require.Error(t, err)
	rRepo.AssertExpectations(t)
}

// ─────────────────────────────────────────────────────────────────────────────
// ListRoadmapsByUser
// ─────────────────────────────────────────────────────────────────────────────

func TestListRoadmapsByUser_Success(t *testing.T) {
	rRepo := new(MockRoadmapRepo)
	svc := newRoadmapService(rRepo, nil)

	userID := uuid.New()
	roadmaps := []domain.Roadmap{
		*sampleRoadmap(userID),
		*sampleRoadmap(userID),
	}
	rRepo.On("ListRoadmapsByUser", userID).Return(roadmaps, nil)

	result, err := svc.ListRoadmapsByUser(userID)

	require.NoError(t, err)
	assert.Len(t, result, 2)
	rRepo.AssertExpectations(t)
}

func TestListRoadmapsByUser_RepoError_ReturnsError(t *testing.T) {
	rRepo := new(MockRoadmapRepo)
	svc := newRoadmapService(rRepo, nil)

	userID := uuid.New()
	rRepo.On("ListRoadmapsByUser", userID).Return([]domain.Roadmap{}, errors.New("db error"))

	_, err := svc.ListRoadmapsByUser(userID)

	require.Error(t, err)
	rRepo.AssertExpectations(t)
}

// ─────────────────────────────────────────────────────────────────────────────
// GetRoadmapByID
// ─────────────────────────────────────────────────────────────────────────────

func TestGetRoadmapByID_Success(t *testing.T) {
	rRepo := new(MockRoadmapRepo)
	svc := newRoadmapService(rRepo, nil)

	rm := sampleRoadmap(uuid.New())
	rRepo.On("GetRoadmapByID", rm.ID).Return(rm, nil)

	resp, err := svc.GetRoadmapByID(rm.ID)

	require.NoError(t, err)
	assert.Equal(t, rm.Name, resp.Name)
	rRepo.AssertExpectations(t)
}

func TestGetRoadmapByID_NotFound_ReturnsError(t *testing.T) {
	rRepo := new(MockRoadmapRepo)
	svc := newRoadmapService(rRepo, nil)

	id := uuid.New()
	rRepo.On("GetRoadmapByID", id).Return(nil, errors.New("roadmap not found"))

	_, err := svc.GetRoadmapByID(id)

	require.Error(t, err)
	rRepo.AssertExpectations(t)
}

// ─────────────────────────────────────────────────────────────────────────────
// UpdateRoadmap
// ─────────────────────────────────────────────────────────────────────────────

func TestUpdateRoadmap_NoFields_ReturnsCurrent(t *testing.T) {
	// When no fields are provided, the service should return the current roadmap
	// without calling UpdateRoadmap on the repo.
	rRepo := new(MockRoadmapRepo)
	svc := newRoadmapService(rRepo, nil)

	rm := sampleRoadmap(uuid.New())
	rRepo.On("GetRoadmapByID", rm.ID).Return(rm, nil)

	result, err := svc.UpdateRoadmap(rm.ID, dto.UpdateRoadmapDTO{})

	require.NoError(t, err)
	assert.Equal(t, rm.Name, result.Name)
	// UpdateRoadmap (repo) should NOT have been invoked.
	rRepo.AssertNotCalled(t, "UpdateRoadmap")
	rRepo.AssertExpectations(t)
}

func TestUpdateRoadmap_WithName_UpdatesName(t *testing.T) {
	rRepo := new(MockRoadmapRepo)
	svc := newRoadmapService(rRepo, nil)

	rm := sampleRoadmap(uuid.New())
	newName := "Updated Roadmap"
	updated := *rm
	updated.Name = newName

	rRepo.On("UpdateRoadmap", rm.ID, mock.Anything).Return(nil)
	rRepo.On("GetRoadmapByID", rm.ID).Return(&updated, nil)

	result, err := svc.UpdateRoadmap(rm.ID, dto.UpdateRoadmapDTO{Name: &newName})

	require.NoError(t, err)
	assert.Equal(t, newName, result.Name)
	rRepo.AssertExpectations(t)
}

func TestUpdateRoadmap_WithProblemIDs_AutoSyncsTotalProblems(t *testing.T) {
	// When ProblemIDs is set but TotalProblems is nil, total_problems should
	// be auto-synced to len(ProblemIDs).
	rRepo := new(MockRoadmapRepo)
	svc := newRoadmapService(rRepo, nil)

	rm := sampleRoadmap(uuid.New())
	newProblemIDs := []uuid.UUID{uuid.New(), uuid.New()}

	var capturedUpdates map[string]interface{}
	rRepo.On("UpdateRoadmap", rm.ID, mock.MatchedBy(func(u map[string]interface{}) bool {
		capturedUpdates = u
		return true
	})).Return(nil)
	rRepo.On("GetRoadmapByID", rm.ID).Return(rm, nil)

	_, err := svc.UpdateRoadmap(rm.ID, dto.UpdateRoadmapDTO{ProblemIDs: newProblemIDs})

	require.NoError(t, err)
	assert.Equal(t, 2, capturedUpdates["total_problems"])
	rRepo.AssertExpectations(t)
}

func TestUpdateRoadmap_ExplicitTotalProblems_OverridesAutoSync(t *testing.T) {
	rRepo := new(MockRoadmapRepo)
	svc := newRoadmapService(rRepo, nil)

	rm := sampleRoadmap(uuid.New())
	newProblemIDs := []uuid.UUID{uuid.New()}
	explicitTotal := 99

	var capturedUpdates map[string]interface{}
	rRepo.On("UpdateRoadmap", rm.ID, mock.MatchedBy(func(u map[string]interface{}) bool {
		capturedUpdates = u
		return true
	})).Return(nil)
	rRepo.On("GetRoadmapByID", rm.ID).Return(rm, nil)

	_, err := svc.UpdateRoadmap(rm.ID, dto.UpdateRoadmapDTO{
		ProblemIDs:    newProblemIDs,
		TotalProblems: &explicitTotal,
	})

	require.NoError(t, err)
	assert.Equal(t, 99, capturedUpdates["total_problems"])
	rRepo.AssertExpectations(t)
}

// ─────────────────────────────────────────────────────────────────────────────
// UpdateRoadmapProgress
// ─────────────────────────────────────────────────────────────────────────────

func TestUpdateRoadmapProgress_ValidProgress(t *testing.T) {
	cases := []int{0, 50, 100}
	for _, p := range cases {
		rRepo := new(MockRoadmapRepo)
		svc := newRoadmapService(rRepo, nil)
		rm := sampleRoadmap(uuid.New())

		rRepo.On("UpdateRoadmap", rm.ID, map[string]interface{}{"progress": p}).Return(nil)
		rRepo.On("GetRoadmapByID", rm.ID).Return(rm, nil)

		resp, err := svc.UpdateRoadmapProgress(rm.ID, p)

		require.NoError(t, err, "progress %d should be valid", p)
		assert.NotNil(t, resp)
		rRepo.AssertExpectations(t)
	}
}

func TestUpdateRoadmapProgress_BelowZero_ReturnsError(t *testing.T) {
	svc := newRoadmapService(new(MockRoadmapRepo), nil)

	_, err := svc.UpdateRoadmapProgress(uuid.New(), -1)

	require.Error(t, err)
	assert.Equal(t, "progress must be between 0 and 100", err.Error())
}

func TestUpdateRoadmapProgress_Above100_ReturnsError(t *testing.T) {
	svc := newRoadmapService(new(MockRoadmapRepo), nil)

	_, err := svc.UpdateRoadmapProgress(uuid.New(), 101)

	require.Error(t, err)
	assert.Equal(t, "progress must be between 0 and 100", err.Error())
}

// ─────────────────────────────────────────────────────────────────────────────
// DeleteRoadmap
// ─────────────────────────────────────────────────────────────────────────────

func TestDeleteRoadmap_Success(t *testing.T) {
	rRepo := new(MockRoadmapRepo)
	svc := newRoadmapService(rRepo, nil)

	id := uuid.New()
	rRepo.On("DeleteRoadmap", id).Return(nil)

	err := svc.DeleteRoadmap(id)

	require.NoError(t, err)
	rRepo.AssertExpectations(t)
}

func TestDeleteRoadmap_RepoError_ReturnsError(t *testing.T) {
	rRepo := new(MockRoadmapRepo)
	svc := newRoadmapService(rRepo, nil)

	id := uuid.New()
	rRepo.On("DeleteRoadmap", id).Return(errors.New("not found"))

	err := svc.DeleteRoadmap(id)

	require.Error(t, err)
	rRepo.AssertExpectations(t)
}

// ─────────────────────────────────────────────────────────────────────────────
// toRoadmapResponse
// ─────────────────────────────────────────────────────────────────────────────

func TestToRoadmapResponse_MapsAllFields(t *testing.T) {
	svc := newRoadmapService(new(MockRoadmapRepo), nil)

	userID := uuid.New()
	rm := &domain.Roadmap{
		ID:            uuid.New(),
		UserID:        userID,
		Name:          "Test Roadmap",
		Description:   "A test",
		Visibility:    domain.RoadmapVisibilityPublic,
		Topics:        []string{"go", "concurrency"},
		ProblemIDs:    []uuid.UUID{},
		TotalProblems: 5,
		Progress:      40,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
		User:          domain.User{Username: "bob"},
	}

	resp := svc.toRoadmapResponse(rm)

	assert.Equal(t, rm.ID, resp.ID)
	assert.Equal(t, rm.UserID, resp.UserID)
	assert.Equal(t, "bob", resp.AuthorName)
	assert.Equal(t, rm.Name, resp.Name)
	assert.Equal(t, rm.Description, resp.Description)
	assert.Equal(t, rm.Visibility, resp.Visibility)
	assert.Equal(t, rm.Topics, resp.Topics)
	assert.Equal(t, rm.TotalProblems, resp.TotalProblems)
	assert.Equal(t, rm.Progress, resp.Progress)
}

func TestToRoadmapResponse_NilProblemIDs_ReturnsEmptySlice(t *testing.T) {
	svc := newRoadmapService(new(MockRoadmapRepo), nil)

	rm := &domain.Roadmap{ID: uuid.New(), UserID: uuid.New(), ProblemIDs: nil}
	resp := svc.toRoadmapResponse(rm)

	assert.NotNil(t, resp.ProblemIDs)
	assert.Empty(t, resp.ProblemIDs)
}

func TestToRoadmapResponse_WithProblemsRepo_EnrichesProblems(t *testing.T) {
	// Arrange: provide a problems repo so summaries get populated
	rRepo := new(MockRoadmapRepo)
	pRepo := new(MockProblemsRepo)
	svc := newRoadmapService(rRepo, pRepo)

	pid := uuid.New()
	problem := &domain.Problem{
		ID:          pid,
		Slug:        "two-sum",
		MainHeading: "Two Sum",
		Difficulty:  "easy",
	}
	pRepo.On("GetProblemByID", pid, false).Return(problem, nil)

	rm := &domain.Roadmap{
		ID:         uuid.New(),
		UserID:     uuid.New(),
		ProblemIDs: []uuid.UUID{pid},
	}

	// Act
	resp := svc.toRoadmapResponse(rm)

	// Assert
	require.Len(t, resp.Problems, 1)
	assert.Equal(t, "two-sum", resp.Problems[0].Slug)
	assert.Equal(t, "Two Sum", resp.Problems[0].Title)
	assert.Equal(t, "easy", resp.Problems[0].Difficulty)
	pRepo.AssertExpectations(t)
}
