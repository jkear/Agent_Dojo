-- PostgreSQL Initialization Script for Agent Dojo
-- This script creates necessary databases if they don't exist

-- Create langfuse database for observability platform
SELECT 'CREATE DATABASE langfuse'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'langfuse')\gexec

-- Grant privileges to postgres user
GRANT ALL PRIVILEGES ON DATABASE agent_dojo TO postgres;
GRANT ALL PRIVILEGES ON DATABASE langfuse TO postgres;

-- Create extensions if needed
\c agent_dojo;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

\c langfuse;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
