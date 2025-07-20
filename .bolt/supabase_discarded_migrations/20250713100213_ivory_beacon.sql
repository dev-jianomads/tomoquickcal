/*
  # Add phone_number column to users table

  1. Schema Update
    - Add `phone_number` column to `users` table if it doesn't exist
    - Ensure proper indexing for phone number lookups

  2. Data Integrity
    - Column allows NULL values (optional field)
    - Add index for performance on phone number queries
*/

-- Add phone_number column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE users ADD COLUMN phone_number TEXT;
    PRINT 'Added phone_number column to users table';
  ELSE
    PRINT 'phone_number column already exists in users table';
  END IF;
END $$;

-- Add index for phone number lookups if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);

-- Verify the column exists and show current schema
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'phone_number'
  ) INTO column_exists;
  
  IF column_exists THEN
    RAISE NOTICE 'SUCCESS: phone_number column exists in users table';
  ELSE
    RAISE NOTICE 'ERROR: phone_number column missing from users table';
  END IF;
END $$;