# Contest Scoring System Documentation

## Overview
This document explains the point calculation and ranking system for CodeArena contests.

## Data Model

### Contest Structure
```
Contest
├── ContestProblem (join table with metadata)
│   ├── MaxPoints: Points available for this problem
│   ├── PartialCredit: Allow points for partial test cases
│   ├── TimeMultiplier: Multiplier for time-based scoring
│   └── OrderIndex: Problem order in contest
│
└── ContestParticipant (join table with scoring data)
    ├── TotalPoints: Cumulative points in contest
    ├── ProblemsSolved: Count of fully solved problems
    ├── ProblemsAttempted: Count of attempted problems
    ├── PenaltyTime: ACM ICPC-style penalty time
    ├── Rank: Current/final rank in contest
    ├── RatingChange: Rating delta from this contest
    └── Timestamps: Registered, Started, Finished
```

### Submission Tracking
```
Submission
├── ContestID: Links to contest (NULL for practice)
├── PointsEarned: Points from this submission
└── Status: accepted, wrong_answer, etc.
```

## Scoring Algorithms

### 1. Submission Point Calculation

**Formula:**
```
Points = (BasePoints × Accuracy) - TimePenalty - AttemptPenalty
```

**Components:**
- **BasePoints**: Configured per problem in `ContestProblem.MaxPoints` (default: 100)
- **Accuracy**: `TestCasesPassed / TotalTestCases`
- **TimePenalty**: `MinutesSinceStart × 0.5` (configurable)
- **AttemptPenalty**: `(AttemptNumber - 1) × 10` points (configurable)

**Example:**
```
Problem: 100 max points, partial credit allowed
Submission: 8/10 test cases passed, 45 minutes in, 2nd attempt

Points = (100 × 0.8) - (45 × 0.5) - (1 × 10)
       = 80 - 22.5 - 10
       = 47.5 ≈ 48 points
```

**Partial Credit Rules:**
- If `PartialCredit = false`: Must pass ALL test cases to earn points
- If `PartialCredit = true`: Minimum 50% test cases required (configurable)

### 2. Contest Ranking

**Ranking Criteria (in order):**
1. **Total Points** (higher is better) - PRIMARY
2. **Problems Solved** (more is better) - TIEBREAKER #1
3. **Penalty Time** (less is better) - TIEBREAKER #2
4. **Last Submission Time** (earlier is better) - TIEBREAKER #3

**Tied Ranks**: Participants with identical scores get the same rank

**Example Leaderboard:**
```
Rank | User    | Points | Solved | Penalty | Last Submit
-----|---------|--------|--------|---------|-------------
  1  | Alice   | 450    | 5      | 120 min | 14:30
  1  | Bob     | 450    | 5      | 120 min | 14:30  (tied)
  3  | Charlie | 450    | 5      | 125 min | 14:45
  4  | David   | 420    | 4      | 100 min | 14:00
```

### 3. Penalty Time Calculation

**ACM ICPC Style:**
```
PenaltyTime = SolveTime + (WrongAttempts × 20 minutes)
```

**Example:**
```
Problem solved at 45 minutes
Had 2 wrong attempts before

PenaltyTime = 45 + (2 × 20) = 85 minutes
```

### 4. Rating Changes (ELO-like System)

**Formula:**
```
RatingChange = K × (ActualPerformance - ExpectedPerformance) × TotalParticipants
```

**K-Factor (volatility):**
- New players (< 1200): K = 48 (faster rating changes)
- Regular players (1200-2000): K = 32
- Experienced players (> 2000): K = 16 (slower changes)

**Performance Calculation:**
```
Performance = 1 - (Rank - 1) / TotalParticipants
```

**Example:**
```
User rating: 1500
Expected rank: 10 (based on rating)
Actual rank: 5
Total participants: 100

ExpectedPerf = 1 - (10-1)/100 = 0.91
ActualPerf = 1 - (5-1)/100 = 0.96

RatingChange = 32 × (0.96 - 0.91) × 100
             = 32 × 0.05 × 100
             = +160 points

New Rating = 1500 + 160 = 1660
```

### 5. Global Rating Update

Uses **weighted average** of recent contest performances:

```
NewGlobalRating = (Σ(ContestRating × Weight) + CurrentRating × 0.3) / (ΣWeight + 0.3)
```

**Weights:** More recent contests have higher weights
- Last contest: 1.0
- 2nd last: 0.8
- 3rd last: 0.6
- etc.

## Implementation Workflow

### When a Submission is Made (During Contest):

```go
1. User submits solution
2. Code is executed and judged
3. Calculate points:
   - Get ContestProblem.MaxPoints
   - Count previous attempts
   - Calculate time since contest start
   - Apply scoring formula
4. Update Submission.PointsEarned
5. If ACCEPTED:
   - Add points to ContestParticipant.TotalPoints
   - Increment ProblemsSolved
   - Update PenaltyTime
   - Update LastSubmissionAt
6. Recalculate rankings (live leaderboard)
```

### When Contest Ends:

```go
1. Finalize all rankings
2. For each participant:
   - Calculate expected rank (from old rating)
   - Get actual rank (from performance)
   - Calculate rating change
   - Update ContestParticipant record
3. Update User.Rating globally
4. Create ContestLeaderboardEntry records
5. Update GlobalLeaderboard
```

### When User Solves Practice Problem:

```go
1. Update User.SolvedCount
2. Update User.SubmissionsCount
3. Small rating boost (+5-10 points per first solve)
4. Update GlobalLeaderboard position
```

## Database Queries

### Get Live Contest Leaderboard:
```sql
SELECT 
    cp.user_id,
    u.username,
    cp.total_points,
    cp.problems_solved,
    cp.penalty_time,
    cp.last_submission_at,
    ROW_NUMBER() OVER (
        ORDER BY 
            cp.total_points DESC,
            cp.problems_solved DESC,
            cp.penalty_time ASC,
            cp.last_submission_at ASC
    ) as rank
FROM contest_participants cp
JOIN users u ON cp.user_id = u.id
WHERE cp.contest_id = ?
ORDER BY rank;
```

### Get User's Contest Submissions:
```sql
SELECT 
    s.*,
    p.main_heading as problem_name,
    p.difficulty
FROM submissions s
JOIN problems p ON s.problem_id = p.id
WHERE s.user_id = ? AND s.contest_id = ?
ORDER BY s.created_at DESC;
```

### Update Global Leaderboard:
```sql
SELECT 
    u.id,
    u.username,
    u.rating,
    u.solved_count,
    COUNT(DISTINCT cp.contest_id) as contests_participated,
    ROW_NUMBER() OVER (ORDER BY u.rating DESC) as rank
FROM users u
LEFT JOIN contest_participants cp ON u.id = cp.user_id
WHERE u.role = 'regular'
GROUP BY u.id
ORDER BY u.rating DESC
LIMIT 100;
```

## Configuration

### Customize Scoring in `ContestProblem`:
```go
ContestProblem{
    MaxPoints: 150,              // Higher for harder problems
    PartialCredit: true,         // Allow partial points
    TimeMultiplier: 0.8,         // Lower = less time penalty
}
```

### Adjust Global Settings:
```go
ScoringConfig{
    BasePoints: 100,
    TimePenaltyPerMin: 0.5,      // Points lost per minute
    WrongAttemptPenalty: 10,     // Points lost per wrong attempt
    PartialCreditMin: 0.5,       // Minimum 50% test cases
}
```

## Best Practices

1. **Set Problem Points by Difficulty:**
   - Easy: 100 points
   - Medium: 150-200 points
   - Hard: 250-300 points

2. **Enable Partial Credit for:**
   - Learning contests
   - Beginner-friendly events
   
3. **Disable Partial Credit for:**
   - Competitive contests
   - Advanced competitions

4. **Penalty Time** works best for:
   - Speed-coding contests
   - Short duration events (2-3 hours)

5. **Rating Changes** stabilize over time:
   - New users: ±100-200 per contest
   - Experienced: ±20-50 per contest

## Future Enhancements

- [ ] Team contests with shared scoring
- [ ] Bonus points for first solve globally
- [ ] Streak bonuses for consecutive participation
- [ ] Dynamic difficulty adjustment
- [ ] Anti-cheating measures (submission similarity)
- [ ] Division-based contests (Div 1, Div 2)
