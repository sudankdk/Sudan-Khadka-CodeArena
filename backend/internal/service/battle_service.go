package service

import (
	"errors"
	"math"
	"time"

	"github.com/google/uuid"
	"github.com/sudankdk/codearena/internal/domain"
	"github.com/sudankdk/codearena/internal/dto"
	"github.com/sudankdk/codearena/internal/logger"
	"github.com/sudankdk/codearena/internal/repo"
	"go.uber.org/zap"
)

// BattleService manages 1v1 battle match logic, ELO calculation, and stats.
type BattleService struct {
	BattleRepo    repo.BattleRepo
	ChallengeRepo repo.FrontendChallengeRepo
	UserRepo      repo.UserRepo
	JudgeService  *JudgeService
}

// GetEloTier maps a rating to a named tier.
func GetEloTier(rating float64) string {
	switch {
	case rating < 1000:
		return "Beginner"
	case rating < 1200:
		return "Bronze"
	case rating < 1400:
		return "Silver"
	case rating < 1600:
		return "Gold"
	case rating < 1800:
		return "Platinum"
	case rating < 2000:
		return "Diamond"
	default:
		return "Master"
	}
}

// getKFactor returns the ELO K-factor based on matches played and rating.
func getKFactor(matchesPlayed int, rating float64) float64 {
	switch {
	case matchesPlayed < 30:
		return 40
	case rating >= 2000:
		return 10
	default:
		return 20
	}
}

// CalculateElo computes new ELO ratings for two players after a 1v1 match.
// outcome: 1.0 = player A wins, 0.0 = player B wins, 0.5 = draw
func CalculateElo(ratingA, ratingB float64, matchesPlayedA, matchesPlayedB int, outcome float64) (changeA, changeB float64) {
	expectedA := 1.0 / (1.0 + math.Pow(10, (ratingB-ratingA)/400.0))
	expectedB := 1.0 - expectedA

	kA := getKFactor(matchesPlayedA, ratingA)
	kB := getKFactor(matchesPlayedB, ratingB)

	changeA = math.Round(kA * (outcome - expectedA))
	changeB = math.Round(kB * ((1.0 - outcome) - expectedB))

	return changeA, changeB
}

// CreateMatch creates a new battle match between two players for a given challenge.
func (bs *BattleService) CreateMatch(playerAID, playerBID uuid.UUID, challenge *domain.FrontendChallenge) (*domain.BattleMatch, error) {
	playerA, err := bs.UserRepo.FindUserById(playerAID)
	if err != nil {
		return nil, errors.New("player A not found")
	}
	playerB, err := bs.UserRepo.FindUserById(playerBID)
	if err != nil {
		return nil, errors.New("player B not found")
	}

	now := time.Now()
	match := &domain.BattleMatch{
		ChallengeID:         challenge.ID,
		PlayerAID:           playerAID,
		PlayerBID:           playerBID,
		Status:              "ongoing",
		Result:              "pending",
		StartTime:           &now,
		TimeLimit:           challenge.TimeLimit,
		PlayerARatingBefore: playerA.Rating,
		PlayerBRatingBefore: playerB.Rating,
	}

	if err := bs.BattleRepo.CreateMatch(match); err != nil {
		return nil, err
	}

	return match, nil
}

// ProcessSubmission records a submission and triggers the visual judge.
func (bs *BattleService) ProcessSubmission(matchID, playerID uuid.UUID, htmlCode, cssCode, jsCode string) (*domain.BattleSubmission, *dto.JudgeResult, error) {
	match, err := bs.BattleRepo.GetMatchByID(matchID)
	if err != nil {
		return nil, nil, errors.New("match not found")
	}

	if match.Status != "ongoing" {
		return nil, nil, errors.New("match is not in progress")
	}

	if match.PlayerAID != playerID && match.PlayerBID != playerID {
		return nil, nil, errors.New("player is not part of this match")
	}

	// Record server-side timestamp
	submission := &domain.BattleSubmission{
		MatchID:     matchID,
		PlayerID:    playerID,
		HTML:        htmlCode,
		CSS:         cssCode,
		JS:          jsCode,
		SubmittedAt: time.Now(),
	}

	if err := bs.BattleRepo.CreateSubmission(submission); err != nil {
		return nil, nil, err
	}

	// Get challenge for judging
	challenge, err := bs.ChallengeRepo.GetByID(match.ChallengeID)
	if err != nil {
		return nil, nil, errors.New("challenge not found")
	}

	// Run visual judge
	result, err := bs.JudgeService.JudgeSubmission(htmlCode, cssCode, jsCode, *challenge)
	if err != nil {
		logger.Error("Judge failed", zap.Error(err), zap.String("submission_id", submission.ID.String()))
		return submission, nil, nil // Return submission without judge result — don't fail the whole submission
	}

	// Update submission with judge result
	now := time.Now()
	updates := map[string]interface{}{
		"diff_ratio":      result.DiffRatio,
		"passed":          result.Passed,
		"screenshot_path": result.ScreenshotPath,
		"judged_at":       now,
	}
	if err := bs.BattleRepo.UpdateSubmission(submission.ID, updates); err != nil {
		logger.Error("Failed to update submission with judge result", zap.Error(err))
	}

	submission.DiffRatio = result.DiffRatio
	submission.Passed = result.Passed
	submission.ScreenshotPath = result.ScreenshotPath
	submission.JudgedAt = &now

	// If passed, end the match with this player as winner
	if result.Passed {
		if err := bs.EndMatchWithWinner(matchID, playerID); err != nil {
			logger.Error("Failed to end match", zap.Error(err))
		}
	}

	return submission, result, nil
}

// EndMatchWithWinner ends the match with the specified player as the winner.
func (bs *BattleService) EndMatchWithWinner(matchID, winnerID uuid.UUID) error {
	match, err := bs.BattleRepo.GetMatchByID(matchID)
	if err != nil {
		return err
	}

	if match.Status == "finished" {
		return nil // Already finished
	}

	now := time.Now()
	result := "player_a_wins"
	if winnerID == match.PlayerBID {
		result = "player_b_wins"
	}

	// Calculate ELO changes
	outcome := 1.0 // A wins
	if winnerID == match.PlayerBID {
		outcome = 0.0 // B wins
	}

	playerA, _ := bs.UserRepo.FindUserById(match.PlayerAID)
	playerB, _ := bs.UserRepo.FindUserById(match.PlayerBID)

	changeA, changeB := CalculateElo(
		match.PlayerARatingBefore, match.PlayerBRatingBefore,
		playerA.MatchesPlayed, playerB.MatchesPlayed,
		outcome,
	)

	updates := map[string]interface{}{
		"status":              "finished",
		"winner_id":           winnerID,
		"result":              result,
		"end_time":            now,
		"player_a_elo_change": changeA,
		"player_b_elo_change": changeB,
	}

	if err := bs.BattleRepo.UpdateMatch(matchID, updates); err != nil {
		return err
	}

	// Update user ratings and match counts
	bs.updateUserAfterMatch(match.PlayerAID, changeA, winnerID == match.PlayerAID)
	bs.updateUserAfterMatch(match.PlayerBID, changeB, winnerID == match.PlayerBID)

	// Record ELO history
	bs.BattleRepo.CreateEloHistory(&domain.BattleEloHistory{
		UserID:       match.PlayerAID,
		MatchID:      matchID,
		RatingBefore: match.PlayerARatingBefore,
		RatingAfter:  match.PlayerARatingBefore + changeA,
	})
	bs.BattleRepo.CreateEloHistory(&domain.BattleEloHistory{
		UserID:       match.PlayerBID,
		MatchID:      matchID,
		RatingBefore: match.PlayerBRatingBefore,
		RatingAfter:  match.PlayerBRatingBefore + changeB,
	})

	return nil
}

// EndMatchAsDraw ends the match as a draw (timeout with no winner).
func (bs *BattleService) EndMatchAsDraw(matchID uuid.UUID) error {
	match, err := bs.BattleRepo.GetMatchByID(matchID)
	if err != nil {
		return err
	}

	if match.Status == "finished" {
		return nil
	}

	// Check if anyone had a passing submission
	passedSubs, _ := bs.BattleRepo.GetPassedSubmissionsForMatch(matchID)
	if len(passedSubs) > 0 {
		// Winner is the first person who passed
		return bs.EndMatchWithWinner(matchID, passedSubs[0].PlayerID)
	}

	// Check all submissions for closest diff ratio
	subs, _ := bs.BattleRepo.GetSubmissionsByMatch(matchID)
	if len(subs) > 0 {
		bestDiff := 1.0
		var bestPlayerID uuid.UUID
		hasBest := false
		for _, sub := range subs {
			if sub.DiffRatio < bestDiff {
				bestDiff = sub.DiffRatio
				bestPlayerID = sub.PlayerID
				hasBest = true
			}
		}
		// If someone got close (within 10%), they win
		if hasBest && bestDiff < 0.10 {
			return bs.EndMatchWithWinner(matchID, bestPlayerID)
		}
	}

	// True draw
	now := time.Now()
	playerA, _ := bs.UserRepo.FindUserById(match.PlayerAID)
	playerB, _ := bs.UserRepo.FindUserById(match.PlayerBID)
	changeA, changeB := CalculateElo(
		match.PlayerARatingBefore, match.PlayerBRatingBefore,
		playerA.MatchesPlayed, playerB.MatchesPlayed,
		0.5,
	)

	updates := map[string]interface{}{
		"status":              "finished",
		"result":              "draw",
		"end_time":            now,
		"player_a_elo_change": changeA,
		"player_b_elo_change": changeB,
	}
	if err := bs.BattleRepo.UpdateMatch(matchID, updates); err != nil {
		return err
	}

	bs.updateUserAfterMatch(match.PlayerAID, changeA, false)
	bs.updateUserAfterMatch(match.PlayerBID, changeB, false)

	bs.BattleRepo.CreateEloHistory(&domain.BattleEloHistory{
		UserID: match.PlayerAID, MatchID: matchID,
		RatingBefore: match.PlayerARatingBefore, RatingAfter: match.PlayerARatingBefore + changeA,
	})
	bs.BattleRepo.CreateEloHistory(&domain.BattleEloHistory{
		UserID: match.PlayerBID, MatchID: matchID,
		RatingBefore: match.PlayerBRatingBefore, RatingAfter: match.PlayerBRatingBefore + changeB,
	})

	return nil
}

// ForfeitMatch handles a player forfeiting/disconnecting.
func (bs *BattleService) ForfeitMatch(matchID, forfeitedByID uuid.UUID) error {
	match, err := bs.BattleRepo.GetMatchByID(matchID)
	if err != nil {
		return err
	}

	if match.Status == "finished" {
		return nil // No-op if already finished
	}

	winnerID := match.PlayerBID
	if forfeitedByID == match.PlayerBID {
		winnerID = match.PlayerAID
	}

	now := time.Now()
	playerA, _ := bs.UserRepo.FindUserById(match.PlayerAID)
	playerB, _ := bs.UserRepo.FindUserById(match.PlayerBID)

	outcome := 1.0
	if winnerID == match.PlayerBID {
		outcome = 0.0
	}
	changeA, changeB := CalculateElo(
		match.PlayerARatingBefore, match.PlayerBRatingBefore,
		playerA.MatchesPlayed, playerB.MatchesPlayed,
		outcome,
	)

	updates := map[string]interface{}{
		"status":              "finished",
		"winner_id":           winnerID,
		"result":              "forfeit",
		"end_time":            now,
		"player_a_elo_change": changeA,
		"player_b_elo_change": changeB,
	}
	if err := bs.BattleRepo.UpdateMatch(matchID, updates); err != nil {
		return err
	}

	bs.updateUserAfterMatch(match.PlayerAID, changeA, winnerID == match.PlayerAID)
	bs.updateUserAfterMatch(match.PlayerBID, changeB, winnerID == match.PlayerBID)

	bs.BattleRepo.CreateEloHistory(&domain.BattleEloHistory{
		UserID: match.PlayerAID, MatchID: matchID,
		RatingBefore: match.PlayerARatingBefore, RatingAfter: match.PlayerARatingBefore + changeA,
	})
	bs.BattleRepo.CreateEloHistory(&domain.BattleEloHistory{
		UserID: match.PlayerBID, MatchID: matchID,
		RatingBefore: match.PlayerBRatingBefore, RatingAfter: match.PlayerBRatingBefore + changeB,
	})

	return nil
}

// updateUserAfterMatch updates user rating and atomically increments match stats.
func (bs *BattleService) updateUserAfterMatch(userID uuid.UUID, ratingChange float64, isWinner bool) {
	user, err := bs.UserRepo.FindUserById(userID)
	if err != nil {
		logger.Error("Failed to find user for rating update", zap.Error(err))
		return
	}

	newRating := user.Rating + ratingChange
	if newRating < 0 {
		newRating = 0
	}

	if err := bs.UserRepo.UpdateUserRating(userID, newRating); err != nil {
		logger.Error("Failed to update user rating", zap.Error(err))
	}

	// Atomically increment matches_played (and matches_won if winner)
	if err := bs.UserRepo.IncrementMatchStats(userID, isWinner); err != nil {
		logger.Error("Failed to update match stats", zap.Error(err))
	}
}

// GetMatchHistory returns paginated match history for a user.
func (bs *BattleService) GetMatchHistory(userID uuid.UUID, page, pageSize int) ([]dto.BattleHistoryDTO, int64, error) {
	matches, total, err := bs.BattleRepo.GetMatchHistory(userID, page, pageSize)
	if err != nil {
		return nil, 0, err
	}

	history := make([]dto.BattleHistoryDTO, 0, len(matches))
	for _, m := range matches {
		opponentID := m.PlayerBID
		opponentName := m.PlayerB.Username
		eloChange := m.PlayerAEloChange
		if m.PlayerAID != userID {
			opponentID = m.PlayerAID
			opponentName = m.PlayerA.Username
			eloChange = m.PlayerBEloChange
		}

		result := "draw"
		if m.WinnerID != nil {
			if *m.WinnerID == userID {
				result = "win"
			} else {
				result = "loss"
			}
		}

		duration := 0
		if m.StartTime != nil && m.EndTime != nil {
			duration = int(m.EndTime.Sub(*m.StartTime).Seconds())
		}

		history = append(history, dto.BattleHistoryDTO{
			MatchID:      m.ID,
			OpponentID:   opponentID,
			OpponentName: opponentName,
			Result:       result,
			EloChange:    eloChange,
			Difficulty:   m.Challenge.Difficulty,
			Duration:     duration,
			CreatedAt:    m.CreatedAt.Format(time.RFC3339),
		})
	}

	return history, total, nil
}

// GetBattleStats returns battle statistics for a user.
func (bs *BattleService) GetBattleStats(userID uuid.UUID) (*dto.BattleStatsDTO, error) {
	user, err := bs.UserRepo.FindUserById(userID)
	if err != nil {
		return nil, err
	}

	wins, losses, draws, err := bs.BattleRepo.GetUserBattleStats(userID)
	if err != nil {
		return nil, err
	}

	total := wins + losses + draws
	var winRate float64
	if total > 0 {
		winRate = float64(wins) / float64(total) * 100
	}

	// Calculate current streak from recent matches
	matches, _, _ := bs.BattleRepo.GetMatchHistory(userID, 1, 50)
	currentStreak := 0
	bestStreak := 0
	streak := 0
	for _, m := range matches {
		if m.WinnerID != nil && *m.WinnerID == userID {
			streak++
			if streak > bestStreak {
				bestStreak = streak
			}
		} else {
			streak = 0
		}
	}
	// Current streak from most recent
	for _, m := range matches {
		if m.WinnerID != nil && *m.WinnerID == userID {
			currentStreak++
		} else {
			break
		}
	}

	return &dto.BattleStatsDTO{
		TotalMatches:  total,
		Wins:          wins,
		Losses:        losses,
		Draws:         draws,
		WinRate:       math.Round(winRate*100) / 100,
		CurrentStreak: currentStreak,
		BestStreak:    bestStreak,
		Rating:        user.Rating,
		Tier:          GetEloTier(user.Rating),
	}, nil
}

// GetBattleLeaderboard returns the battle leaderboard.
func (bs *BattleService) GetBattleLeaderboard(page, pageSize int) ([]dto.BattleLeaderboardEntryDTO, int64, error) {
	users, total, err := bs.BattleRepo.GetBattleLeaderboard(page, pageSize)
	if err != nil {
		return nil, 0, err
	}

	entries := make([]dto.BattleLeaderboardEntryDTO, 0, len(users))
	offset := (page - 1) * pageSize
	for i, u := range users {
		var winRate float64
		if u.MatchesPlayed > 0 {
			winRate = float64(u.MatchesWon) / float64(u.MatchesPlayed) * 100
		}
		entries = append(entries, dto.BattleLeaderboardEntryDTO{
			Rank:          offset + i + 1,
			UserID:        u.ID,
			Username:      u.Username,
			Rating:        u.Rating,
			Tier:          GetEloTier(u.Rating),
			MatchesPlayed: u.MatchesPlayed,
			MatchesWon:    u.MatchesWon,
			WinRate:       math.Round(winRate*100) / 100,
		})
	}

	return entries, total, nil
}

// GetMatchDetail returns detailed match information for replay.
func (bs *BattleService) GetMatchDetail(matchID uuid.UUID) (*dto.BattleMatchDetailDTO, error) {
	match, err := bs.BattleRepo.GetMatchWithDetails(matchID)
	if err != nil {
		return nil, err
	}

	submissions := make([]dto.BattleSubmissionInfoDTO, 0, len(match.Submissions))
	for _, s := range match.Submissions {
		submissions = append(submissions, dto.BattleSubmissionInfoDTO{
			ID:          s.ID,
			PlayerID:    s.PlayerID,
			DiffRatio:   s.DiffRatio,
			Passed:      s.Passed,
			SubmittedAt: s.SubmittedAt.Format(time.RFC3339),
		})
	}

	var startTime, endTime *string
	if match.StartTime != nil {
		s := match.StartTime.Format(time.RFC3339)
		startTime = &s
	}
	if match.EndTime != nil {
		e := match.EndTime.Format(time.RFC3339)
		endTime = &e
	}

	return &dto.BattleMatchDetailDTO{
		MatchID: match.ID,
		Challenge: dto.ChallengeInfoDTO{
			ID:          match.Challenge.ID,
			Title:       match.Challenge.Title,
			Description: match.Challenge.Description,
			Difficulty:  match.Challenge.Difficulty,
		},
		PlayerA: dto.BattlePlayerDTO{
			UserID:       match.PlayerA.ID,
			Username:     match.PlayerA.Username,
			Rating:       match.PlayerA.Rating,
			Tier:         GetEloTier(match.PlayerA.Rating),
			RatingBefore: match.PlayerARatingBefore,
			EloChange:    match.PlayerAEloChange,
		},
		PlayerB: dto.BattlePlayerDTO{
			UserID:       match.PlayerB.ID,
			Username:     match.PlayerB.Username,
			Rating:       match.PlayerB.Rating,
			Tier:         GetEloTier(match.PlayerB.Rating),
			RatingBefore: match.PlayerBRatingBefore,
			EloChange:    match.PlayerBEloChange,
		},
		Status:      match.Status,
		Result:      match.Result,
		WinnerID:    match.WinnerID,
		TimeLimit:   match.TimeLimit,
		StartTime:   startTime,
		EndTime:     endTime,
		Submissions: submissions,
	}, nil
}

// GetEloHistory returns the ELO rating history for a user.
func (bs *BattleService) GetEloHistory(userID uuid.UUID, limit int) ([]domain.BattleEloHistory, error) {
	return bs.BattleRepo.GetEloHistory(userID, limit)
}
