-- ============================================
-- Glamo Database Initialization Script
-- ============================================

-- Create schemas
CREATE SCHEMA IF NOT EXISTS auth;

-- Log initialization
DO $$
BEGIN
  RAISE NOTICE 'Glamo database initialized successfully!';
END $$;
