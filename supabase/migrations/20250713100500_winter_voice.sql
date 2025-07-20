/*
  # Add phone_number column to users table

  1. Schema Changes
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
    
    -- Add index for phone number lookups
    CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);
    
    -- Add comment
    COMMENT ON COLUMN users.phone_number IS 'User phone number for Signal integration';
  END IF;
END $$;