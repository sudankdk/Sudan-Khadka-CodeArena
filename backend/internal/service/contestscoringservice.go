package service

import (
	"math"
	"time"

	"github.com/google/uuid"
)

// ContestScoringService handles all scoring and ranking calculations
type ContestScoringService struct {
	// Add repository dependencies here
}

// ScoringConfig holds configuration for point calculation
type ScoringConfig struct {
	BasePoints          int     // Base points for solving a problem (default: 100)
	TimePenaltyPerMin   float64 // Points deducted per minute (default: 0.5)
	WrongAttemptPenalty int     // Penalty per wrong submission (default: 10 points or 5 minutes)
	PartialCreditMin    float64 // Minimum percentage for partial credit (default: 0.5 = 50%)
}

// DefaultScoringConfig returns default scoring configuration
func DefaultScoringConfig() ScoringConfig {
	return ScoringConfig{
		BasePoints:          100,
		TimePenaltyPerMin:   0.5,
		WrongAttemptPenalty: 10,
		PartialCreditMin:    0.5,
	}
}

// CalculateSubmissionPoints calculates points for a single submission
// Formula: BasePoints * (TestCasesPassed/TotalTestCases) - TimePenalty - AttemptPenalty
func (s *ContestScoringService) CalculateSubmissionPoints(
	maxPoints int,
	testCasesPassed int,
	totalTestCases int,
	executionTime int, // milliseconds
	attemptNumber int, // which attempt this is (1st, 2nd, etc.)
	timeSinceStart int, // minutes since contest/problem start
	allowPartialCredit bool,
	config ScoringConfig,
) int {
	// If no test cases passed, no points
	if testCasesPassed == 0 {
		return 0
	}

	// Calculate accuracy ratio
	accuracyRatio := float64(testCasesPassed) / float64(totalTestCases)

	// If partial credit not allowed, must pass all test cases
	if !allowPartialCredit && accuracyRatio < 1.0 {
		return 0
	}

	// If partial credit allowed but below minimum threshold
	if allowPartialCredit && accuracyRatio < config.PartialCreditMin {
		return 0
	}

	// Calculate base points with accuracy multiplier
	basePoints := float64(maxPoints) * accuracyRatio

	// Time penalty (encourages faster solutions)
	timePenalty := float64(timeSinceStart) * config.TimePenaltyPerMin

	// Wrong attempt penalty (only for attempts after first)
	attemptPenalty := float64((attemptNumber - 1) * config.WrongAttemptPenalty)

	// Calculate final points (can't go below 0)
	finalPoints := math.Max(0, basePoints-timePenalty-attemptPenalty)

	return int(math.Round(finalPoints))
}

// CalculateContestRank calculates ranks for all participants based on:
// 1. Total points (descending)
// 2. Problems solved (descending) - tiebreaker
// 3. Penalty time (ascending) - tiebreaker
// 4. Last submission time (ascending) - final tiebreaker
type ParticipantScore struct {
	UserID           uuid.UUID
	TotalPoints      int
	ProblemsSolved   int
	PenaltyTime      int // in minutes
	LastSubmissionAt *time.Time
	CurrentRank      int
}

func (s *ContestScoringService) CalculateContestRank(participants []ParticipantScore) []ParticipantScore {
	// Sort participants for ranking
	// Using a simple bubble sort approach for clarity (use more efficient sort in production)
	for i := 0; i < len(participants); i++ {
		for j := i + 1; j < len(participants); j++ {
			// Compare based on criteria
			shouldSwap := false

			// Primary: Total points (higher is better)
			if participants[i].TotalPoints < participants[j].TotalPoints {
				shouldSwap = true
			} else if participants[i].TotalPoints == participants[j].TotalPoints {
				// Tiebreaker 1: Problems solved (more is better)
				if participants[i].ProblemsSolved < participants[j].ProblemsSolved {
					shouldSwap = true
				} else if participants[i].ProblemsSolved == participants[j].ProblemsSolved {
					// Tiebreaker 2: Penalty time (less is better)
					if participants[i].PenaltyTime > participants[j].PenaltyTime {
						shouldSwap = true
					} else if participants[i].PenaltyTime == participants[j].PenaltyTime {
						// Tiebreaker 3: Last submission time (earlier is better)
						if participants[i].LastSubmissionAt != nil &&
							participants[j].LastSubmissionAt != nil &&
							participants[i].LastSubmissionAt.After(*participants[j].LastSubmissionAt) {
							shouldSwap = true
						}
					}
				}
			}

			if shouldSwap {
				participants[i], participants[j] = participants[j], participants[i]
			}
		}
	}

	// Assign ranks (handle tied ranks)
	currentRank := 1
	for i := 0; i < len(participants); i++ {
		if i > 0 {
			// Check if this participant has same score as previous
			prev := participants[i-1]
			curr := participants[i]

			if prev.TotalPoints == curr.TotalPoints &&
				prev.ProblemsSolved == curr.ProblemsSolved &&
				prev.PenaltyTime == curr.PenaltyTime {
				// Same rank as previous
				participants[i].CurrentRank = participants[i-1].CurrentRank
			} else {
				// New rank
				currentRank = i + 1
				participants[i].CurrentRank = currentRank
			}
		} else {
			participants[i].CurrentRank = currentRank
		}
	}

	return participants
}

// CalculateRatingChange calculates ELO-like rating change after a contest
// Based on expected vs actual performance
func (s *ContestScoringService) CalculateRatingChange(
	oldRating float64,
	expectedRank int,
	actualRank int,
	totalParticipants int,
) int {
	// K-factor: determines maximum rating change (higher for newer players)
	kFactor := 32.0
	if oldRating > 2000 {
		kFactor = 16.0 // Experienced players change slower
	} else if oldRating < 1200 {
		kFactor = 48.0 // New players change faster
	}

	// Calculate expected performance (0 to 1, where 1 is best)
	expectedPerformance := 1.0 - (float64(expectedRank-1) / float64(totalParticipants))

	// Calculate actual performance (0 to 1, where 1 is best)
	actualPerformance := 1.0 - (float64(actualRank-1) / float64(totalParticipants))

	// Rating change = K * (Actual - Expected)
	ratingChange := kFactor * (actualPerformance - expectedPerformance) * float64(totalParticipants)

	return int(math.Round(ratingChange))
}

// CalculatePenaltyTime calculates penalty time for a participant
// Based on ACM ICPC rules: time to solve + 20 minutes per wrong attempt
func (s *ContestScoringService) CalculatePenaltyTime(
	solveTimeMinutes int, // time from contest start to AC submission
	wrongAttempts int, // number of wrong submissions before AC
) int {
	penaltyPerWrongAttempt := 20 // minutes
	return solveTimeMinutes + (wrongAttempts * penaltyPerWrongAttempt)
}

// CalculateGlobalRating updates user's global rating based on recent performance
// Uses weighted average of recent contests
func (s *ContestScoringService) CalculateGlobalRating(
	currentRating float64,
	recentContestRatings []float64, // ratings from last N contests
	weights []float64, // weights for each contest (more recent = higher weight)
) float64 {
	if len(recentContestRatings) == 0 {
		return currentRating
	}

	// If no weights provided, use equal weights
	if len(weights) == 0 {
		weights = make([]float64, len(recentContestRatings))
		for i := range weights {
			weights[i] = 1.0
		}
	}

	// Calculate weighted average
	var weightedSum float64
	var totalWeight float64

	for i, rating := range recentContestRatings {
		weight := 1.0
		if i < len(weights) {
			weight = weights[i]
		}
		weightedSum += rating * weight
		totalWeight += weight
	}

	// Include current rating with lower weight
	weightedSum += currentRating * 0.3
	totalWeight += 0.3

	return weightedSum / totalWeight
}

// DifficultyMultiplier returns point multiplier based on problem difficulty
func DifficultyMultiplier(difficulty string) float64 {
	switch difficulty {
	case "easy":
		return 1.0
	case "medium":
		return 1.5
	case "hard":
		return 2.0
	default:
		return 1.0
	}
}
