-- Add is_rated column to contests table
ALTER TABLE contests ADD COLUMN IF NOT EXISTS is_rated BOOLEAN DEFAULT true;
