package service

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

// ─────────────────────────────────────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────────────────────────────────────

func newScoringService() *ContestScoringService { return &ContestScoringService{} }

// ─────────────────────────────────────────────────────────────────────────────
// DefaultScoringConfig
// ─────────────────────────────────────────────────────────────────────────────

func TestDefaultScoringConfig(t *testing.T) {
	cfg := DefaultScoringConfig()
	assert.Equal(t, 100, cfg.BasePoints)
	assert.Equal(t, 0.5, cfg.TimePenaltyPerMin)
	assert.Equal(t, 10, cfg.WrongAttemptPenalty)
	assert.Equal(t, 0.5, cfg.PartialCreditMin)
}

// ─────────────────────────────────────────────────────────────────────────────
// CalculateSubmissionPoints
// ─────────────────────────────────────────────────────────────────────────────

// Test various scenarios for CalculateSubmissionPoints, covering:
// - No testcases passed → should return 0
// - All testcases passed → should return full points
// - Partial credit allowed but not all passed → should return proportional points
// - Time penalty reduces points correctly
// - Wrong attempt penalty reduces points correctly
func TestCalculateSubmissionPoints_ZeroTestcasesPassed_ReturnsZero(t *testing.T) {
	svc := newScoringService()
	cfg := DefaultScoringConfig()

	pts := svc.CalculateSubmissionPoints(100, 0, 10, 50, 1, 0, true, cfg)

	assert.Equal(t, 0, pts)
}

func TestCalculateSubmissionPoints_AllPassed_NoPartialNeeded(t *testing.T) {
	svc := newScoringService()
	cfg := DefaultScoringConfig()

	// 10/10 cases, first attempt, no time penalty
	pts := svc.CalculateSubmissionPoints(100, 10, 10, 50, 1, 0, false, cfg)

	assert.Equal(t, 100, pts)
}

func TestCalculateSubmissionPoints_PartialNotAllowed_PartialNotAllPassed_ReturnsZero(t *testing.T) {
	svc := newScoringService()
	cfg := DefaultScoringConfig()

	// only 7/10 passed, partial credit NOT allowed
	pts := svc.CalculateSubmissionPoints(100, 7, 10, 50, 1, 0, false, cfg)

	assert.Equal(t, 0, pts)
}

func TestCalculateSubmissionPoints_PartialAllowed_AboveMinThreshold(t *testing.T) {
	svc := newScoringService()
	cfg := DefaultScoringConfig() // PartialCreditMin = 0.5

	// 8/10 = 0.8 ratio, above threshold → should receive 80% of 100 = 80 pts
	pts := svc.CalculateSubmissionPoints(100, 8, 10, 50, 1, 0, true, cfg)

	assert.Equal(t, 80, pts)
}

func TestCalculateSubmissionPoints_PartialAllowed_BelowMinThreshold_ReturnsZero(t *testing.T) {
	svc := newScoringService()
	cfg := DefaultScoringConfig() // PartialCreditMin = 0.5

	// 4/10 = 0.4 ratio, below 0.5 threshold
	pts := svc.CalculateSubmissionPoints(100, 4, 10, 50, 1, 0, true, cfg)

	assert.Equal(t, 0, pts)
}

func TestCalculateSubmissionPoints_TimePenaltyReducesPoints(t *testing.T) {
	svc := newScoringService()
	cfg := DefaultScoringConfig() // 0.5 pts per minute

	// 100 pts base, 20 minutes elapsed → 10 pt penalty → 90 pts
	pts := svc.CalculateSubmissionPoints(100, 10, 10, 50, 1, 20, false, cfg)

	assert.Equal(t, 90, pts)
}

func TestCalculateSubmissionPoints_WrongAttemptPenaltyReducesPoints(t *testing.T) {
	svc := newScoringService()
	cfg := DefaultScoringConfig() // 10 pts per wrong attempt

	// 100 pts, 3rd attempt (2 wrong before), penalty = 2×10 = 20 → 80 pts
	pts := svc.CalculateSubmissionPoints(100, 10, 10, 50, 3, 0, false, cfg)

	assert.Equal(t, 80, pts)
}

func TestCalculateSubmissionPoints_CannotGoBelowZero(t *testing.T) {
	svc := newScoringService()
	cfg := DefaultScoringConfig()

	// Massive time penalty should clamp to 0
	pts := svc.CalculateSubmissionPoints(10, 10, 10, 50, 100, 1000, false, cfg)

	assert.Equal(t, 0, pts)
}

func TestCalculateSubmissionPoints_CombinedPenalties(t *testing.T) {
	svc := newScoringService()
	cfg := DefaultScoringConfig()

	// Base: 100×(8/10)=80, time penalty: 10×0.5=5, attempt penalty: 1×10=10 → 65
	pts := svc.CalculateSubmissionPoints(100, 8, 10, 50, 2, 10, true, cfg)

	assert.Equal(t, 65, pts)
}

// ─────────────────────────────────────────────────────────────────────────────
// CalculateContestRank
// ─────────────────────────────────────────────────────────────────────────────

func TestCalculateContestRank_SortsByTotalPointsDescending(t *testing.T) {
	svc := newScoringService()

	p := []ParticipantScore{
		{UserID: uuid.New(), TotalPoints: 50},
		{UserID: uuid.New(), TotalPoints: 100},
		{UserID: uuid.New(), TotalPoints: 75},
	}

	ranked := svc.CalculateContestRank(p)

	assert.Equal(t, 100, ranked[0].TotalPoints)
	assert.Equal(t, 75, ranked[1].TotalPoints)
	assert.Equal(t, 50, ranked[2].TotalPoints)
}

func TestCalculateContestRank_TieBreaksByProblemsSolvedDescending(t *testing.T) {
	svc := newScoringService()

	p := []ParticipantScore{
		{UserID: uuid.New(), TotalPoints: 100, ProblemsSolved: 2},
		{UserID: uuid.New(), TotalPoints: 100, ProblemsSolved: 5},
	}

	ranked := svc.CalculateContestRank(p)

	assert.Equal(t, 5, ranked[0].ProblemsSolved)
	assert.Equal(t, 2, ranked[1].ProblemsSolved)
}

func TestCalculateContestRank_TieBreaksByPenaltyTimeAscending(t *testing.T) {
	svc := newScoringService()

	p := []ParticipantScore{
		{UserID: uuid.New(), TotalPoints: 100, ProblemsSolved: 3, PenaltyTime: 60},
		{UserID: uuid.New(), TotalPoints: 100, ProblemsSolved: 3, PenaltyTime: 20},
	}

	ranked := svc.CalculateContestRank(p)

	assert.Equal(t, 20, ranked[0].PenaltyTime, "lower penalty should rank first")
}

func TestCalculateContestRank_TieBreaksByLastSubmissionTimeAscending(t *testing.T) {
	svc := newScoringService()

	earlier := time.Now().Add(-30 * time.Minute)
	later := time.Now()

	p := []ParticipantScore{
		{UserID: uuid.New(), TotalPoints: 100, ProblemsSolved: 3, PenaltyTime: 20, LastSubmissionAt: &later},
		{UserID: uuid.New(), TotalPoints: 100, ProblemsSolved: 3, PenaltyTime: 20, LastSubmissionAt: &earlier},
	}

	ranked := svc.CalculateContestRank(p)

	assert.Equal(t, &earlier, ranked[0].LastSubmissionAt, "earlier submission time should rank first")
}

func TestCalculateContestRank_AssignsRanks(t *testing.T) {
	svc := newScoringService()

	p := []ParticipantScore{
		{UserID: uuid.New(), TotalPoints: 200},
		{UserID: uuid.New(), TotalPoints: 100},
		{UserID: uuid.New(), TotalPoints: 50},
	}

	ranked := svc.CalculateContestRank(p)

	assert.Equal(t, 1, ranked[0].CurrentRank)
	assert.Equal(t, 2, ranked[1].CurrentRank)
	assert.Equal(t, 3, ranked[2].CurrentRank)
}

func TestCalculateContestRank_SharedRankForTie(t *testing.T) {
	svc := newScoringService()

	// Both have same points, problems and penalty → tied rank
	p := []ParticipantScore{
		{UserID: uuid.New(), TotalPoints: 100, ProblemsSolved: 3, PenaltyTime: 20},
		{UserID: uuid.New(), TotalPoints: 100, ProblemsSolved: 3, PenaltyTime: 20},
		{UserID: uuid.New(), TotalPoints: 50},
	}

	ranked := svc.CalculateContestRank(p)

	assert.Equal(t, ranked[0].CurrentRank, ranked[1].CurrentRank, "tied participants must share the same rank")
	assert.Equal(t, 3, ranked[2].CurrentRank)
}

func TestCalculateContestRank_EmptySlice(t *testing.T) {
	svc := newScoringService()
	ranked := svc.CalculateContestRank([]ParticipantScore{})
	assert.Empty(t, ranked)
}

// ─────────────────────────────────────────────────────────────────────────────
// CalculateRatingChange
// ─────────────────────────────────────────────────────────────────────────────

func TestCalculateRatingChange_PerformedBetter_PositiveChange(t *testing.T) {
	svc := newScoringService()

	// Expected rank 5, actual rank 1 out of 10 → should gain rating
	change := svc.CalculateRatingChange(1500, 5, 1, 10)

	assert.Greater(t, change, 0)
}

func TestCalculateRatingChange_PerformedWorse_NegativeChange(t *testing.T) {
	svc := newScoringService()

	// Expected rank 1, actual rank 8 out of 10 → should lose rating
	change := svc.CalculateRatingChange(1500, 1, 8, 10)

	assert.Less(t, change, 0)
}

func TestCalculateRatingChange_ExactlyExpected_ZeroChange(t *testing.T) {
	svc := newScoringService()

	// (actualRank == expectedRank) → no change
	change := svc.CalculateRatingChange(1500, 5, 5, 10)

	assert.Equal(t, 0, change)
}

func TestCalculateRatingChange_HighRating_SmallKFactor(t *testing.T) {
	svc := newScoringService()

	// Rating > 2000 uses kFactor=16 (smaller swings)
	changeHigh := svc.CalculateRatingChange(2200, 5, 1, 10)
	changeLow := svc.CalculateRatingChange(1000, 5, 1, 10)

	// High-rated player should gain LESS than low-rated for same performance
	assert.Less(t, changeHigh, changeLow)
}

// ─────────────────────────────────────────────────────────────────────────────
// CalculatePenaltyTime
// ─────────────────────────────────────────────────────────────────────────────

func TestCalculatePenaltyTime_NoWrongAttempts(t *testing.T) {
	svc := newScoringService()
	// Just the solve time, no extra penalty
	penalty := svc.CalculatePenaltyTime(30, 0)
	assert.Equal(t, 30, penalty)
}

func TestCalculatePenaltyTime_WithWrongAttempts(t *testing.T) {
	svc := newScoringService()
	// Solve time: 30 min + 2 wrong × 20 min each = 70
	penalty := svc.CalculatePenaltyTime(30, 2)
	assert.Equal(t, 70, penalty)
}

func TestCalculatePenaltyTime_ZeroTimeWithWrongs(t *testing.T) {
	svc := newScoringService()
	// Solved instantly but had 3 wrong tries
	penalty := svc.CalculatePenaltyTime(0, 3)
	assert.Equal(t, 60, penalty)
}

// ─────────────────────────────────────────────────────────────────────────────
// CalculateGlobalRating
// ─────────────────────────────────────────────────────────────────────────────

func TestCalculateGlobalRating_NoHistory_ReturnsCurrent(t *testing.T) {
	svc := newScoringService()
	current := 1500.0

	result := svc.CalculateGlobalRating(current, nil, nil)

	assert.Equal(t, current, result)
}

func TestCalculateGlobalRating_WithEqualWeightedHistory(t *testing.T) {
	svc := newScoringService()
	// Should be a weighted average of history + 0.3×current
	result := svc.CalculateGlobalRating(1000, []float64{2000, 2000}, nil)

	// History pulls rating up significantly above 1000
	assert.Greater(t, result, 1000.0)
}

func TestCalculateGlobalRating_WithCustomWeights(t *testing.T) {
	svc := newScoringService()

	// Higher weight on recent high performances
	result := svc.CalculateGlobalRating(1000, []float64{1800, 1900}, []float64{0.3, 0.7})

	assert.Greater(t, result, 1500.0, "heavily weighted high-performance history should dominate")
}

// ─────────────────────────────────────────────────────────────────────────────
// DifficultyMultiplier
// ─────────────────────────────────────────────────────────────────────────────

func TestDifficultyMultiplier(t *testing.T) {
	cases := []struct {
		difficulty string
		expected   float64
	}{
		{"easy", 1.0},
		{"medium", 1.5},
		{"hard", 2.0},
		{"unknown", 1.0},
		{"", 1.0},
	}

	for _, tc := range cases {
		t.Run(tc.difficulty, func(t *testing.T) {
			got := DifficultyMultiplier(tc.difficulty)
			assert.Equal(t, tc.expected, got)
		})
	}
}
