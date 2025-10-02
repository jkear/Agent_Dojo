#!/usr/bin/env python3
"""Database initialization script"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))


async def main():
    """Initialize database with tables"""
    try:
        from agent_dojo.database.connection import init_db

        print("🗄️  Initializing database...")
        await init_db()
        print("✅ Database initialized successfully")
        return 0
    except ImportError as e:
        print(f"❌ Import error: {e}", file=sys.stderr)
        print("   Make sure dependencies are installed: uv sync", file=sys.stderr)
        return 1
    except Exception as e:
        print(f"❌ Database initialization failed: {e}", file=sys.stderr)
        print("", file=sys.stderr)
        print("Troubleshooting:", file=sys.stderr)
        print("  1. Check if database service is running", file=sys.stderr)
        print("  2. Verify DATABASE_URL in .env file", file=sys.stderr)
        print("  3. Ensure database user has CREATE privileges", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
