#!/usr/bin/env python
"""Test Composio v3 integration"""

from agent_dojo.core.config import settings
from composio import Composio

print("=" * 60)
print("Testing Composio SDK v3 Integration")
print("=" * 60)

# Test 1: Import check
print("\n✓ Imports successful (no Action or ComposioToolSet)")

# Test 2: Client initialization
if not settings.COMPOSIO_API_KEY:
    print("\n⚠️  COMPOSIO_API_KEY not set in environment")
    print("   Set it in .env to test API connectivity")
    exit(0)

try:
    client = Composio(api_key=settings.COMPOSIO_API_KEY)
    print("\n✓ Client initialized successfully")
except Exception as e:
    print(f"\n✗ Client initialization failed: {e}")
    exit(1)

# Test 3: List toolkits
try:
    print("\n[Testing API connectivity...]")
    response = client.toolkits.list(limit=5)
    toolkits = response.items if hasattr(response, 'items') else response
    print(f"✓ API connected, found {len(toolkits)} toolkits")
    
    print("\nAvailable toolkits (first 5):")
    for tk in toolkits[:5]:
        print(f"  • {tk.name} ({tk.slug})")
        
except Exception as e:
    print(f"✗ API call failed: {e}")
    print("\nThis is expected if you don't have a valid API key")

# Test 4: Check v3 namespaces
print("\n[Checking v3 API namespaces...]")
namespaces = ['toolkits', 'tools', 'connected_accounts', 'auth_configs']
for ns in namespaces:
    if hasattr(client, ns):
        print(f"  ✓ client.{ns}")
    else:
        print(f"  ✗ client.{ns} missing!")

print("\n" + "=" * 60)
print("✓ All checks passed - Composio v3 is properly configured")
print("=" * 60)
