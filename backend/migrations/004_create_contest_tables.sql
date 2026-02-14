-- Create contests table if not exists
CREATE TABLE IF NOT EXISTS contests (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    duration INTEGER NOT NULL,
    max_participants INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT false,
    is_rated BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create contest_problems table if not exists
CREATE TABLE IF NOT EXISTS contest_problems (
    id UUID PRIMARY KEY,
    contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    max_points INTEGER NOT NULL DEFAULT 100,
    partial_credit BOOLEAN DEFAULT false,
    time_multiplier DECIMAL(10,2) DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(contest_id, problem_id)
);

CREATE INDEX IF NOT EXISTS idx_contest_problems_contest_id ON contest_problems(contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_problems_problem_id ON contest_problems(problem_id);

-- Drop and recreate contest_participants table with all columns
DROP TABLE IF EXISTS contest_participants CASCADE;

CREATE TABLE contest_participants (
    id UUID PRIMARY KEY,
    contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    problems_solved INTEGER DEFAULT 0,
    problems_attempted INTEGER DEFAULT 0,
    penalty_time INTEGER DEFAULT 0,
    rank INTEGER DEFAULT 0,
    rating_change INTEGER DEFAULT 0,
    old_rating DECIMAL(10,2) DEFAULT 1000,
    new_rating DECIMAL(10,2) DEFAULT 1000,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    last_submission_at TIMESTAMP,
    finished_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(contest_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_contest_participants_contest_id ON contest_participants(contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_participants_user_id ON contest_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_contest_participants_total_points ON contest_participants(total_points);
CREATE INDEX IF NOT EXISTS idx_contest_participants_rank ON contest_participants(rank);

-- Create contest_leaderboard_entries table if not exists
CREATE TABLE IF NOT EXISTS contest_leaderboard_entries (
    id UUID PRIMARY KEY,
    contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(255) NOT NULL,
    score INTEGER DEFAULT 0,
    problems_solved INTEGER DEFAULT 0,
    penalty_minutes INTEGER DEFAULT 0,
    rank INTEGER DEFAULT 0,
    rating_change INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(contest_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_contest_leaderboard_contest_id ON contest_leaderboard_entries(contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_leaderboard_user_id ON contest_leaderboard_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_contest_leaderboard_rank ON contest_leaderboard_entries(rank);
