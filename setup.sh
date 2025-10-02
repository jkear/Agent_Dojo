#!/bin/bash

# Agent Dojo Setup Script

set -e

echo "🤖 Welcome to Agent Dojo Setup!"
echo "================================"

# Check if Python 3.10+ is installed
if ! python3 --version | grep -q "Python 3.1[0-9]"; then
    echo "❌ Python 3.10+ is required"
    exit 1
fi

# Check if Node.js 18+ is installed
if ! node --version | grep -q "v1[8-9]\|v[2-9][0-9]"; then
    echo "❌ Node.js 18+ is required"
    exit 1
fi

# Check if uv is installed, install if not
if ! command -v uv &> /dev/null; then
    echo "📦 Installing uv (fast Python package manager)..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    source $HOME/.cargo/env
fi

echo "✅ Prerequisites check passed!"

# Create .env file from example
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Created .env file from template"
    echo "   Please update it with your API keys and configuration"
fi

# Install Python dependencies with uv
echo "📦 Installing Python dependencies with uv..."
uv sync

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
cd frontend
npm install
cd ..

# Check if user wants to use Docker for services
read -p "🐳 Use Docker for database services? (y/N): " use_docker
if [[ $use_docker =~ ^[Yy]$ ]]; then
    if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
        echo "🐳 Starting Docker services..."
        docker-compose up -d postgres redis langfuse-server
        
        # Wait for services to be ready
        echo "⏳ Waiting for services to be ready..."
        sleep 10
        
        # Verify PostgreSQL is ready
        echo "� Verifying PostgreSQL connection..."
        RETRIES=5
        until docker exec agent_dojo-postgres-1 pg_isready -U postgres > /dev/null 2>&1 || [ $RETRIES -eq 0 ]; do
            echo "   Waiting for PostgreSQL... ($RETRIES retries left)"
            RETRIES=$((RETRIES-1))
            sleep 3
        done
        
        if [ $RETRIES -eq 0 ]; then
            echo "⚠️  PostgreSQL not ready, skipping migrations"
            echo "   Run 'uv run python scripts/init_db.py' manually when ready"
        else
            echo "✅ PostgreSQL is ready"
            
            # Run database migrations
            echo "🗄️  Running database migrations..."
            if uv run python scripts/init_db.py; then
                echo "✅ Database migrations completed"
            else
                echo "⚠️  Database migration failed (you can run it manually later)"
                echo "   Command: uv run python scripts/init_db.py"
            fi
        fi
        
        SERVICES_NOTE="Docker services running:
  - PostgreSQL: localhost:5433 (mapped from container port 5432)
  - Redis: localhost:6379
  - Langfuse: http://localhost:3001
  
Note: The frontend will auto-detect an available port (typically 3001 if Langfuse is running)"
    else
        echo "⚠️  Docker not available, please install:"
        echo "   - PostgreSQL 14+"
        echo "   - Redis 6+"
        echo "   - Set up Langfuse (optional)"
        
        SERVICES_NOTE="Please ensure these services are running:
  - PostgreSQL: localhost:5432 (or configure custom port in DATABASE_URL in .env)
  - Redis: localhost:6379 (or configure custom port in REDIS_URL in .env)
  - Langfuse: optional observability (configure LANGFUSE_* in .env)"
    fi
else
    echo "📋 Manual service setup required:"
    echo "   Install and configure:"
    echo "   - PostgreSQL 14+ (port 5432)"
    echo "   - Redis 6+ (port 6379)"
    echo "   - Langfuse (optional, port 3001)"
    echo ""
    echo "   Update .env file with connection strings"
    
    SERVICES_NOTE="Manual setup required:
  - PostgreSQL: Configure DATABASE_URL in .env
  - Redis: Configure REDIS_URL in .env
  - Langfuse: Configure LANGFUSE_* in .env (optional)"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "$SERVICES_NOTE"
echo ""
echo "To start the application:"
echo "1. Backend:  uv run uvicorn agent_dojo.main:app --reload"
echo "2. Frontend: cd frontend && npm run dev"
echo ""
echo "Useful commands:"
echo "  • Initialize DB: uv run python scripts/init_db.py"
echo "  • Run tests:     uv run pytest"
echo "  • Lint code:     uv run ruff check agent_dojo/"
echo ""
echo "Access the application at: http://localhost:3000"
echo "API documentation at: http://localhost:8000/docs"