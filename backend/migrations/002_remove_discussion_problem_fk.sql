-- Remove foreign key constraint and problem_id column from discussions table
-- This makes discussions independent from problems

-- Drop the foreign key constraint
ALTER TABLE discussions DROP CONSTRAINT IF EXISTS fk_discussions_problem;

-- Drop the problem_id column
ALTER TABLE discussions DROP COLUMN IF EXISTS problem_id;
