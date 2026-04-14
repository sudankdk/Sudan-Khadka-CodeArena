package service

import (
	"errors"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"github.com/sudankdk/codearena/internal/domain"
)

// ─────────────────────────────────────────────────────────────────────────────
// GetEloTier (pure, exported)
// ─────────────────────────────────────────────────────────────────────────────

func TestGetEloTier(t *testing.T) {
	cases := []struct {
		rating   float64
		expected string
	}{
		{0, "Beginner"},
		{999, "Beginner"},
		{1000, "Bronze"},
		{1199, "Bronze"},
		{1200, "Silver"},
		{1399, "Silver"},
		{1400, "Gold"},
		{1599, "Gold"},
		{1600, "Platinum"},
		{1799, "Platinum"},
		{1800, "Diamond"},
		{1999, "Diamond"},
		{2000, "Master"},
		{9999, "Master"},
	}

	for _, tc := range cases {
		t.Run(tc.expected, func(t *testing.T) {
			got := GetEloTier(tc.rating)
			assert.Equal(t, tc.expected, got, "rating %.0f", tc.rating)
		})
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// getKFactor (unexported – accessible in same package)
// ─────────────────────────────────────────────────────────────────────────────

func TestGetKFactor_NewPlayer_Returns40(t *testing.T) {
	k := getKFactor(0, 1200)
	assert.Equal(t, 40.0, k, "new players (<30 matches) should use K=40")
}

func TestGetKFactor_Experienced_LowRating_Returns20(t *testing.T) {
	k := getKFactor(50, 1500)
	assert.Equal(t, 20.0, k, ">=30 matches, rating<2000 should use K=20")
}

func TestGetKFactor_Experienced_HighRating_Returns10(t *testing.T) {
	k := getKFactor(50, 2100)
	assert.Equal(t, 10.0, k, ">=30 matches, rating>=2000 should use K=10")
}

func TestGetKFactor_ExactlyAt30Matches_UsesRatingBranch(t *testing.T) {
	k := getKFactor(30, 1800)
	assert.Equal(t, 20.0, k)
}

// ─────────────────────────────────────────────────────────────────────────────
// CalculateElo (pure, exported)
// ─────────────────────────────────────────────────────────────────────────────

func TestCalculateElo_PlayerAWins_GainsRating(t *testing.T) {
	// A (1200) beats B (1200) – equal starting point, A gains
	changeA, changeB := CalculateElo(1200, 1200, 50, 50, 1.0)

	assert.Greater(t, changeA, 0.0, "winner should gain rating")
	assert.Less(t, changeB, 0.0, "loser should lose rating")
}

func TestCalculateElo_PlayerBWins_GainsRating(t *testing.T) {
	changeA, changeB := CalculateElo(1200, 1200, 50, 50, 0.0)

	assert.Less(t, changeA, 0.0)
	assert.Greater(t, changeB, 0.0)
}

func TestCalculateElo_Draw_SymmetricWhenEqualRatings(t *testing.T) {
	changeA, changeB := CalculateElo(1200, 1200, 50, 50, 0.5)

	// Equal ratings → expected both equal 0.5 → change should be 0 for both
	assert.Equal(t, 0.0, changeA)
	assert.Equal(t, 0.0, changeB)
}

func TestCalculateElo_Upset_LargerGainForUpset(t *testing.T) {
	// A(800) beats favourite B(1600) – big upset, A should gain a lot
	changeA, _ := CalculateElo(800, 1600, 50, 50, 1.0)

	assert.Greater(t, changeA, 15.0, "upset winner from underdog should gain significantly")
}

func TestCalculateElo_FavouriteWins_SmallGain(t *testing.T) {
	// A(1600) beats B(800) – expected outcome, smaller gain
	changeHigh, _ := CalculateElo(1600, 800, 50, 50, 1.0)
	changeUpset, _ := CalculateElo(800, 1600, 50, 50, 1.0)

	assert.Less(t, changeHigh, changeUpset, "favourite winning should gain less than upset")
}

func TestCalculateElo_ZeroedSumProperty(t *testing.T) {
	// ELO is not strictly zero-sum due to different K-factors, but
	// with equal K-factors the changes should be equal and opposite.
	changeA, changeB := CalculateElo(1200, 1200, 50, 50, 1.0)
	assert.Equal(t, changeA, -changeB, "changes should be equal and opposite for equal K-factors")
}

// ─────────────────────────────────────────────────────────────────────────────
// GetBattleStats (uses mocked repos)
// ─────────────────────────────────────────────────────────────────────────────

func TestGetBattleStats_Success(t *testing.T) {
	// Arrange
	battleRepo := new(MockBattleRepo)
	userRepo := new(MockUserRepo)
	svc := &BattleService{BattleRepo: battleRepo, UserRepo: userRepo}

	userID := uuid.New()
	user := domain.User{ID: userID, Rating: 1400}

	battleRepo.On("GetUserBattleStats", userID).Return(7, 3, 2, nil)
	battleRepo.On("GetMatchHistory", userID, 1, 50).Return([]domain.BattleMatch{}, int64(0), nil)
	userRepo.On("FindUserById", userID).Return(user, nil)

	// Act
	stats, err := svc.GetBattleStats(userID)

	// Assert
	require.NoError(t, err)
	assert.Equal(t, 12, stats.TotalMatches)
	assert.Equal(t, 7, stats.Wins)
	assert.Equal(t, 3, stats.Losses)
	assert.Equal(t, 2, stats.Draws)
	assert.InDelta(t, 58.33, stats.WinRate, 0.01)
	assert.Equal(t, 1400.0, stats.Rating)
	assert.Equal(t, "Gold", stats.Tier)
	battleRepo.AssertExpectations(t)
	userRepo.AssertExpectations(t)
}

func TestGetBattleStats_UserNotFound_ReturnsError(t *testing.T) {
	battleRepo := new(MockBattleRepo)
	userRepo := new(MockUserRepo)
	svc := &BattleService{BattleRepo: battleRepo, UserRepo: userRepo}

	userID := uuid.New()
	userRepo.On("FindUserById", userID).Return(domain.User{}, errors.New("user not found"))

	_, err := svc.GetBattleStats(userID)

	require.Error(t, err)
}

func TestGetBattleStats_ZeroMatches_WinRateIsZero(t *testing.T) {
	battleRepo := new(MockBattleRepo)
	userRepo := new(MockUserRepo)
	svc := &BattleService{BattleRepo: battleRepo, UserRepo: userRepo}

	userID := uuid.New()
	userRepo.On("FindUserById", userID).Return(domain.User{ID: userID, Rating: 1000}, nil)
	battleRepo.On("GetUserBattleStats", userID).Return(0, 0, 0, nil)
	battleRepo.On("GetMatchHistory", userID, 1, 50).Return([]domain.BattleMatch{}, int64(0), nil)

	stats, err := svc.GetBattleStats(userID)

	require.NoError(t, err)
	assert.Equal(t, 0.0, stats.WinRate)
	assert.Equal(t, 0, stats.TotalMatches)
}

// ─────────────────────────────────────────────────────────────────────────────
// GetBattleLeaderboard (uses mocked repos)
// ─────────────────────────────────────────────────────────────────────────────

func TestGetBattleLeaderboard_Success(t *testing.T) {
	battleRepo := new(MockBattleRepo)
	svc := &BattleService{BattleRepo: battleRepo}

	users := []domain.User{
		{ID: uuid.New(), Username: "alice", Rating: 1800, MatchesPlayed: 20, MatchesWon: 15},
		{ID: uuid.New(), Username: "bob", Rating: 1600, MatchesPlayed: 10, MatchesWon: 6},
	}
	battleRepo.On("GetBattleLeaderboard", 1, 10).Return(users, int64(2), nil)

	entries, total, err := svc.GetBattleLeaderboard(1, 10)

	require.NoError(t, err)
	assert.Equal(t, int64(2), total)
	assert.Len(t, entries, 2)
	assert.Equal(t, 1, entries[0].Rank)
	assert.Equal(t, 2, entries[1].Rank)
	assert.Equal(t, "Diamond", entries[0].Tier)
	battleRepo.AssertExpectations(t)
}

// ─────────────────────────────────────────────────────────────────────────────
// EndMatchWithWinner (uses mocked repos)
// ─────────────────────────────────────────────────────────────────────────────

func TestEndMatchWithWinner_AlreadyFinished_NoOp(t *testing.T) {
	battleRepo := new(MockBattleRepo)
	svc := &BattleService{BattleRepo: battleRepo}

	matchID := uuid.New()
	match := &domain.BattleMatch{
		ID:     matchID,
		Status: "finished", // already finished
	}
	battleRepo.On("GetMatchByID", matchID).Return(match, nil)

	err := svc.EndMatchWithWinner(matchID, uuid.New())

	require.NoError(t, err)
	battleRepo.AssertNotCalled(t, "UpdateMatch")
}

func TestEndMatchWithWinner_PlayerAWins_SetsCorrectResult(t *testing.T) {
	battleRepo := new(MockBattleRepo)
	userRepo := new(MockUserRepo)
	svc := &BattleService{BattleRepo: battleRepo, UserRepo: userRepo}

	playerAID := uuid.New()
	playerBID := uuid.New()
	matchID := uuid.New()

	match := &domain.BattleMatch{
		ID:                  matchID,
		Status:              "ongoing",
		PlayerAID:           playerAID,
		PlayerBID:           playerBID,
		PlayerARatingBefore: 1200,
		PlayerBRatingBefore: 1200,
	}

	userA := domain.User{ID: playerAID, Rating: 1200, MatchesPlayed: 10}
	userB := domain.User{ID: playerBID, Rating: 1200, MatchesPlayed: 10}

	battleRepo.On("GetMatchByID", matchID).Return(match, nil)
	battleRepo.On("UpdateMatch", matchID, mock.Anything).Return(nil)
	userRepo.On("FindUserById", playerAID).Return(userA, nil)
	userRepo.On("FindUserById", playerBID).Return(userB, nil)
	userRepo.On("UpdateUserRating", playerAID, mock.Anything).Return(nil)
	userRepo.On("UpdateUserRating", playerBID, mock.Anything).Return(nil)
	userRepo.On("IncrementMatchStats", playerAID, true).Return(nil)
	userRepo.On("IncrementMatchStats", playerBID, false).Return(nil)
	battleRepo.On("CreateEloHistory", mock.Anything).Return(nil)

	// Capture the update call to verify result field
	var capturedUpdates map[string]interface{}
	battleRepo.ExpectedCalls[1].Run(func(args mock.Arguments) {
		capturedUpdates = args.Get(1).(map[string]interface{})
	})

	err := svc.EndMatchWithWinner(matchID, playerAID)

	require.NoError(t, err)
	if capturedUpdates != nil {
		assert.Equal(t, "player_a_wins", capturedUpdates["result"])
		assert.Equal(t, "finished", capturedUpdates["status"])
	}
	battleRepo.AssertExpectations(t)
}

// ─────────────────────────────────────────────────────────────────────────────
// GetEloHistory
// ─────────────────────────────────────────────────────────────────────────────

func TestGetEloHistory_DelegatesCorrectly(t *testing.T) {
	battleRepo := new(MockBattleRepo)
	svc := &BattleService{BattleRepo: battleRepo}

	userID := uuid.New()
	history := []domain.BattleEloHistory{
		{UserID: userID, RatingBefore: 1200, RatingAfter: 1220},
	}
	battleRepo.On("GetEloHistory", userID, 10).Return(history, nil)

	result, err := svc.GetEloHistory(userID, 10)

	require.NoError(t, err)
	assert.Len(t, result, 1)
	assert.Equal(t, 1220.0, result[0].RatingAfter)
	battleRepo.AssertExpectations(t)
}

// ─────────────────────────────────────────────────────────────────────────────
// ForfeitMatch (uses mocked repos)
// ─────────────────────────────────────────────────────────────────────────────

func TestForfeitMatch_AlreadyFinished_NoOp(t *testing.T) {
	battleRepo := new(MockBattleRepo)
	svc := &BattleService{BattleRepo: battleRepo}

	matchID := uuid.New()
	battleRepo.On("GetMatchByID", matchID).Return(&domain.BattleMatch{ID: matchID, Status: "finished"}, nil)

	err := svc.ForfeitMatch(matchID, uuid.New())

	require.NoError(t, err)
	battleRepo.AssertNotCalled(t, "UpdateMatch")
}

// ─────────────────────────────────────────────────────────────────────────────
// GetMatchHistory
// ─────────────────────────────────────────────────────────────────────────────

func TestGetMatchHistory_MapsResultCorrectly(t *testing.T) {
	battleRepo := new(MockBattleRepo)
	svc := &BattleService{BattleRepo: battleRepo}

	userID := uuid.New()
	opponentID := uuid.New()
	wID := userID // user won

	matches := []domain.BattleMatch{
		{
			ID:               uuid.New(),
			PlayerAID:        userID,
			PlayerBID:        opponentID,
			WinnerID:         &wID,
			PlayerAEloChange: 15,
			PlayerA:          domain.User{ID: userID, Username: "me"},
			PlayerB:          domain.User{ID: opponentID, Username: "opponent"},
			Challenge:        domain.FrontendChallenge{Difficulty: "easy"},
		},
	}
	battleRepo.On("GetMatchHistory", userID, 1, 10).Return(matches, int64(1), nil)

	history, total, err := svc.GetMatchHistory(userID, 1, 10)

	require.NoError(t, err)
	assert.Equal(t, int64(1), total)
	require.Len(t, history, 1)
	assert.Equal(t, "win", history[0].Result)
	assert.Equal(t, 15.0, history[0].EloChange)
	assert.Equal(t, opponentID, history[0].OpponentID)
	battleRepo.AssertExpectations(t)
}

func TestGetMatchHistory_Loss_MapsResultCorrectly(t *testing.T) {
	battleRepo := new(MockBattleRepo)
	svc := &BattleService{BattleRepo: battleRepo}

	userID := uuid.New()
	opponentID := uuid.New()
	wID := opponentID // opponent won

	matches := []domain.BattleMatch{
		{
			ID:               uuid.New(),
			PlayerAID:        userID,
			PlayerBID:        opponentID,
			WinnerID:         &wID,
			PlayerAEloChange: -12,
			PlayerA:          domain.User{ID: userID, Username: "me"},
			PlayerB:          domain.User{ID: opponentID, Username: "opponent"},
			Challenge:        domain.FrontendChallenge{Difficulty: "medium"},
		},
	}
	battleRepo.On("GetMatchHistory", userID, 1, 10).Return(matches, int64(1), nil)

	history, _, err := svc.GetMatchHistory(userID, 1, 10)

	require.NoError(t, err)
	assert.Equal(t, "loss", history[0].Result)
}

func TestGetMatchHistory_Draw_MapsResultCorrectly(t *testing.T) {
	battleRepo := new(MockBattleRepo)
	svc := &BattleService{BattleRepo: battleRepo}

	userID := uuid.New()
	opponentID := uuid.New()

	matches := []domain.BattleMatch{
		{
			ID:        uuid.New(),
			PlayerAID: userID,
			PlayerBID: opponentID,
			WinnerID:  nil, // draw: no winner
			PlayerA:   domain.User{ID: userID},
			PlayerB:   domain.User{ID: opponentID},
			Challenge: domain.FrontendChallenge{},
		},
	}
	battleRepo.On("GetMatchHistory", userID, 1, 10).Return(matches, int64(1), nil)

	history, _, err := svc.GetMatchHistory(userID, 1, 10)

	require.NoError(t, err)
	assert.Equal(t, "draw", history[0].Result)
}

// ─────────────────────────────────────────────────────────────────────────────
// EndMatchAsDraw – no submissions → true draw
// ─────────────────────────────────────────────────────────────────────────────

func TestEndMatchAsDraw_TrueDraw_NoSubmissions(t *testing.T) {
	battleRepo := new(MockBattleRepo)
	userRepo := new(MockUserRepo)
	svc := &BattleService{BattleRepo: battleRepo, UserRepo: userRepo}

	playerAID := uuid.New()
	playerBID := uuid.New()
	matchID := uuid.New()

	match := &domain.BattleMatch{
		ID:                  matchID,
		Status:              "ongoing",
		PlayerAID:           playerAID,
		PlayerBID:           playerBID,
		PlayerARatingBefore: 1200,
		PlayerBRatingBefore: 1200,
	}

	battleRepo.On("GetMatchByID", matchID).Return(match, nil)
	battleRepo.On("GetPassedSubmissionsForMatch", matchID).Return([]domain.BattleSubmission{}, nil)
	battleRepo.On("GetSubmissionsByMatch", matchID).Return([]domain.BattleSubmission{}, nil)
	battleRepo.On("UpdateMatch", matchID, mock.Anything).Return(nil)
	userRepo.On("FindUserById", playerAID).Return(domain.User{ID: playerAID, Rating: 1200, MatchesPlayed: 10}, nil)
	userRepo.On("FindUserById", playerBID).Return(domain.User{ID: playerBID, Rating: 1200, MatchesPlayed: 10}, nil)
	userRepo.On("UpdateUserRating", playerAID, mock.Anything).Return(nil)
	userRepo.On("UpdateUserRating", playerBID, mock.Anything).Return(nil)
	userRepo.On("IncrementMatchStats", playerAID, false).Return(nil)
	userRepo.On("IncrementMatchStats", playerBID, false).Return(nil)
	battleRepo.On("CreateEloHistory", mock.Anything).Return(nil)

	err := svc.EndMatchAsDraw(matchID)

	require.NoError(t, err)
	battleRepo.AssertExpectations(t)
}

// ─────────────────────────────────────────────────────────────────────────────
// ProcessSubmission – match not found or not ongoing
// ─────────────────────────────────────────────────────────────────────────────

func TestProcessSubmission_MatchNotFound_ReturnsError(t *testing.T) {
	battleRepo := new(MockBattleRepo)
	svc := &BattleService{BattleRepo: battleRepo}

	matchID := uuid.New()
	battleRepo.On("GetMatchByID", matchID).Return(nil, errors.New("not found"))

	_, _, err := svc.ProcessSubmission(matchID, uuid.New(), "<html/>", "", "")

	require.Error(t, err)
	assert.Equal(t, "match not found", err.Error())
}

func TestProcessSubmission_MatchAlreadyFinished_ReturnsError(t *testing.T) {
	battleRepo := new(MockBattleRepo)
	svc := &BattleService{BattleRepo: battleRepo}

	matchID := uuid.New()
	battleRepo.On("GetMatchByID", matchID).Return(&domain.BattleMatch{
		ID: matchID, Status: "finished",
	}, nil)

	_, _, err := svc.ProcessSubmission(matchID, uuid.New(), "<html/>", "", "")

	require.Error(t, err)
	assert.Equal(t, "match is not in progress", err.Error())
}

func TestProcessSubmission_PlayerNotInMatch_ReturnsError(t *testing.T) {
	battleRepo := new(MockBattleRepo)
	svc := &BattleService{BattleRepo: battleRepo}

	matchID := uuid.New()
	outsider := uuid.New()
	match := &domain.BattleMatch{
		ID:        matchID,
		Status:    "ongoing",
		PlayerAID: uuid.New(),
		PlayerBID: uuid.New(),
	}
	battleRepo.On("GetMatchByID", matchID).Return(match, nil)

	_, _, err := svc.ProcessSubmission(matchID, outsider, "<html/>", "", "")

	require.Error(t, err)
	assert.Equal(t, "player is not part of this match", err.Error())
}

