#!/bin/bash

# Agent Dojo Setup Script - Desktop Mode
set -e

echo "🥋 Agent Dojo Setup (Desktop Mode)"
echo "===================================="

# Create application data directory
DATA_DIR="$HOME/.agent_dojo"
mkdir -p "$DATA_DIR/data" "$DATA_DIR/logs"
echo "✅ Application directory: $DATA_DIR"

# Install Python dependencies
echo "📦 Installing Python dependencies..."
uv sync

# Install Node.js dependencies
echo "📦 Installing frontend dependencies..."
cd frontend && npm install && cd ..

# Initialize SQLite database
echo "🗄️  Initializing SQLite database..."
uv run python scripts/init_db.py

echo ""
echo "🎉 Setup complete!"
echo "📁 Database: $DATA_DIR/data/agent_dojo.db"
echo "🚀 Start: uv run uvicorn agent_dojo.main:app --reload"
