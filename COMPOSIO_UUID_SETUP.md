# Composio UUID Setup Guide

## What is the Composio UUID?

The Composio UUID (also called `entity_id`) is a unique identifier that represents an end-user in your application. It's used to manage connections and tool executions on a per-user basis in the Composio platform.

## Why You Need It

When you watched the Composio video, you learned that:

1. Each user in your app needs their own `entity_id` (UUID)
2. This UUID links all of that user's OAuth connections and tool permissions
3. It enables multi-tenant architecture where each user has isolated app connections

## How to Get/Create a UUID

### Option 1: Use User's Existing ID from Your System

```python
# If you already have user IDs in your database
user_id = "user_123"  # From your auth system
entity_id = user_id   # Use it directly as entity_id
```

### Option 2: Generate a UUID

```python
import uuid

# Generate a new UUID for each user
entity_id = str(uuid.uuid4())  # e.g., "550e8400-e29b-41d4-a716-446655440000"
```

### Option 3: Use Composio's Entity Management

```python
from composio import Composio

client = Composio(api_key="your_api_key")

# Create or get an entity (user)
entity = client.entities.create(
    id="user_123",  # Your user ID
    metadata={
        "email": "user@example.com",
        "name": "John Doe"
    }
)

entity_id = entity.id
```

## Current Implementation in Agent Dojo

### Backend Usage

In `agent_dojo/integrations/composio_client.py`, we use `user_id` parameter:

```python
def get_tools_for_app(self, app_type: AppType, user_id: str) -> list[Any]:
    """Get available tools for a toolkit and user (v3: uses user_id not connection_id)"""
    tools = self.client.tools.get(user_id=user_id, toolkits=[app_type.value])
    return tools

def execute_tool(self, tool_slug: str, user_id: str, parameters: dict[str, Any]):
    """Execute a tool action with Langfuse tracing"""
    result = self.client.tools.execute(
        slug=tool_slug,
        user_id=user_id,  # This is the entity_id/UUID
        arguments=parameters
    )
```

### API Endpoints

In `agent_dojo/api/routes/composio.py`:

```python
@router.post("/connections/initiate")
async def initiate_connection(request: ConnectionRequest):
    """Initiate OAuth connection for a toolkit"""
    # request.user_id is the entity_id/UUID
    connection = manager.initiate_connection(
        app_type=request.toolkit_slug,
        user_id=request.user_id  # Pass UUID here
    )
```

## Implementation Steps

### 1. Add User Authentication (if not already present)

Your app needs a way to identify users. This could be:

- Session-based auth
- JWT tokens
- OAuth (Google, GitHub, etc.)

### 2. Store User UUID Mapping

When a user signs up or logs in:

```python
# Example with SQLAlchemy
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True)
    composio_entity_id = Column(String, unique=True)  # Store UUID here
    created_at = Column(DateTime, default=datetime.utcnow)

# On user creation:
def create_user(email: str) -> User:
    user = User(
        email=email,
        composio_entity_id=str(uuid.uuid4())  # Generate UUID
    )
    db.add(user)
    db.commit()
    return user
```

### 3. Pass UUID to Composio Operations

Whenever you call Composio APIs:

```python
# In your API routes
@router.post("/agent/execute")
async def execute_agent(
    request: AgentExecutionRequest,
    current_user: User = Depends(get_current_user)  # From auth
):
    # Use the current user's Composio entity ID
    tools = composio_manager.get_tools_for_app(
        app_type=request.app_type,
        user_id=current_user.composio_entity_id  # User's UUID
    )
```

## Environment Variable Setup

Update your `.env` file:

```bash
# Composio Configuration
COMPOSIO_API_KEY=your_composio_api_key_here

# Optional: Default entity ID for development/testing
COMPOSIO_DEFAULT_ENTITY_ID=dev_user_001
```

## Testing with a Test UUID

For development, you can use a hardcoded test UUID:

```python
# In agent_dojo/core/config.py
class Settings(BaseSettings):
    COMPOSIO_API_KEY: str
    COMPOSIO_TEST_ENTITY_ID: str = "test_user_123"  # For dev/testing
```

Then in your routes during development:

```python
# For testing without auth
test_user_id = settings.COMPOSIO_TEST_ENTITY_ID

# Once you have auth:
user_id = current_user.composio_entity_id
```

## Verifying Your Setup

Test that your UUID works with Composio:

```python
from composio import Composio

client = Composio(api_key=settings.COMPOSIO_API_KEY)

# Test connection
try:
    entity = client.entities.get(id="your_test_uuid")
    print(f"✓ Entity found: {entity.id}")
except:
    # Create entity if it doesn't exist
    entity = client.entities.create(id="your_test_uuid")
    print(f"✓ Entity created: {entity.id}")

# List connections for this entity
connections = client.connected_accounts.list(entity_id="your_test_uuid")
print(f"✓ Found {len(connections)} connections")
```

## Next Steps

1. **Add User Authentication**: Implement login/signup if not present
2. **Store UUIDs**: Add `composio_entity_id` field to User model
3. **Update API Routes**: Pass `user_id` from authenticated user to all Composio calls
4. **Test OAuth Flow**: Try connecting an app (Gmail, Slack, etc.) with a test UUID
5. **Verify Multi-tenancy**: Ensure different users see only their own connections

## Key Composio Concepts

- **Entity**: A user in your system (identified by UUID)
- **Connected Account**: An OAuth connection between an entity and an app
- **Tool**: An action that can be performed on a connected account
- **Integration**: The app itself (GitHub, Gmail, Slack, etc.)

## Resources

- [Composio Entities Documentation](https://docs.composio.dev/patterns/auth/entities)
- [Composio Multi-tenant Architecture](https://docs.composio.dev/patterns/multi-tenant)
- [Composio Python SDK - Entities](https://docs.composio.dev/sdk/python/entities)

---

## Current Agent Dojo Status

✅ **Completed**: Composio/LangChain integration with `user_id` parameter throughout
✅ **Ready**: Backend API routes accept `user_id` in requests
✅ **Ready**: Frontend components pass `userId` prop to API calls
⏳ **TODO**: Implement user authentication system
⏳ **TODO**: Store and manage user UUIDs in database
⏳ **TODO**: Connect auth system to Composio `user_id` parameter

Once you implement authentication, the Composio integration will automatically work with proper user isolation!
