-- Setup PostgreSQL Extensions for Glamo Platform

-- Create required schemas
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE SCHEMA IF NOT EXISTS auth;

-- Drop extensions if they exist in extensions schema
DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;
DROP EXTENSION IF EXISTS "pgcrypto" CASCADE;

-- Create extensions in PUBLIC schema so they're available without prefix
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA public;

-- Set search path to include extensions
ALTER DATABASE glamo_dev SET search_path TO public, extensions, auth;

-- Verify extensions
SELECT extname, extnamespace::regnamespace as schema FROM pg_extension;

-- Test uuid generation
SELECT uuid_generate_v4() as test_uuid;
