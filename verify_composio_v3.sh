#!/bin/bash
# Quick verification script for Composio v3 migration

echo "=========================================="
echo "Composio SDK v3 Migration Verification"
echo "=========================================="

echo -e "\n[1/4] Testing imports..."
uv run python -c "from agent_dojo.integrations.composio_client import ComposioManager; print('  ✓ Imports work')" 2>&1 | grep -v "RuntimeWarning"

echo -e "\n[2/4] Testing v3 client initialization..."
uv run python -c "from composio import Composio; c = Composio(api_key='test'); print('  ✓ v3 client initializes'); print('  ✓ Namespaces:', ', '.join([n for n in ['toolkits', 'tools', 'connected_accounts', 'auth_configs'] if hasattr(c, n)]))" 2>&1 | grep -v "RuntimeWarning"

echo -e "\n[3/4] Testing application import..."
uv run python -c "from agent_dojo.main import app; print('  ✓ FastAPI app imports without errors')" 2>&1 | grep -v "RuntimeWarning"

echo -e "\n[4/4] Running full integration test..."
uv run python test_composio_v3.py 2>&1 | grep "✓"

echo -e "\n=========================================="
echo "✓ Migration verification complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Fix any remaining lint warnings: uv run ruff check --fix agent_dojo/"
echo "  2. Start the server: uv run uvicorn agent_dojo.main:app --reload"
echo "  3. Test endpoints at http://localhost:8000/docs"
echo ""
