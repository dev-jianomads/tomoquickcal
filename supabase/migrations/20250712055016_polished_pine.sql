/*
  # Create user logs table

  1. New Tables
    - `user_logs`
      - `id` (bigserial, primary key)
      - `created_at` (timestamptz, default now)
      - `user_id` (text, references users.id)
      - `user_email` (text)
      - `event_type` (text, not null)
      - `event_data` (jsonb)
      - `success` (boolean, default true)
      - `error_message` (text)
      - `session_id` (text)
      - `ip_address` (inet)
      - `user_agent` (text)

  2. Indexes
    - Performance indexes on user_id, email, event_type, created_at, session_id

  3. Security
    - RLS disabled as requested
*/

CREATE TABLE IF NOT EXISTS user_logs (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id TEXT,
  user_email TEXT,
  event_type TEXT NOT NULL,
  event_data JSONB,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  session_id TEXT,
  ip_address INET,
  user_agent TEXT
);

-- Add foreign key constraint to users table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    ALTER TABLE user_logs ADD CONSTRAINT fk_user_logs_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_logs_user_id ON user_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_logs_email ON user_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_user_logs_event_type ON user_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_user_logs_created_at ON user_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_logs_session ON user_logs(session_id);