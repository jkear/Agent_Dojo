# Agent Dojo Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites Check

```bash
# Check Python version (need 3.10+)
python3 --version

# Check Node.js version (need 18+)
node --version

# Check Docker (optional but recommended)
docker --version && docker-compose --version
```

### Installation

#### Option 1: Automated Setup (Recommended)

```bash
# Clone repository
git clone https://github.com/jkear/Agent_Dojo.git
cd Agent_Dojo

# Run setup script (installs dependencies, sets up services)
./setup.sh

# Start development servers
./dev.sh
```

The setup script will:

- Install `uv` (Python package manager) if needed
- Install Python and Node.js dependencies
- Optionally start Docker services (PostgreSQL, Redis, Langfuse)
- Create `.env` file from template
- Run database migrations

#### Option 2: Docker Compose (Full Stack)

```bash
# Clone repository
git clone https://github.com/jkear/Agent_Dojo.git
cd Agent_Dojo

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Start all services
docker-compose up -d

# Check services are running
docker-compose ps
```

This starts:

- Backend API (port 8000)
- Frontend UI (port 3000 in container, accessible via port mapping)
- PostgreSQL database (port 5433)
- Redis cache (port 6379)
- Langfuse observability (port 3001)

### Access Your Application

After starting the services, access:

- 🎨 **Frontend UI**: <http://localhost:3001> (or check terminal for actual port)
- 📚 **API Documentation**: <http://localhost:8000/docs>
- 📊 **Langfuse Dashboard**: <http://localhost:3001> (if using Docker services)

> **Port Note**: If Langfuse is running on port 3001, the frontend will use the next available port (typically 3002). Always check the terminal output for the exact URL after starting the dev server.

### What You Get

Once running, you'll have access to:

- ✨ **Visual Workflow Builder**: Drag-and-drop interface for creating AI agent workflows
- 🤖 **AI Agents**: Powered by CrewAI concepts with LangGraph execution engine
- 🔗 **App Integrations**: Connect Gmail, Slack, GitHub, and more via Composio
- 🛠️ **MCP Tools**: File operations, web scraping, data processing tools
- 📊 **Complete Observability**: Trace every agent action with Langfuse

### First Steps

1. **Create Your First Agent**
   - Navigate to the "Agents" tab
   - Click "Create Agent"
   - Define role, goal, and backstory
   - Assign tools and configure settings

2. **Build a Workflow**
   - Go to the "Canvas" tab
   - Drag agents and tools onto the canvas
   - Connect nodes to create your workflow
   - Configure transitions and conditions

3. **Connect External Services**
   - Visit the "Integrations" tab
   - Authenticate with services (Gmail, Slack, etc.)
   - Grant permissions for agent actions

4. **Execute and Monitor**
   - Run your workflow from the canvas
   - Monitor execution in real-time
   - View detailed traces in Langfuse dashboard

### Configuration

#### Environment Variables

Edit `.env` file with your credentials:

```bash
# LLM API Keys
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Integrations
COMPOSIO_API_KEY=your_composio_key

# Observability (get from Langfuse UI)
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_HOST=http://langfuse-server:3000

# Database (auto-configured if using Docker)
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5433/agent_dojo
REDIS_URL=redis://localhost:6379/0
```

#### Getting Langfuse API Keys

1. Access Langfuse at <http://localhost:3001>
2. Sign up for an account
3. Navigate to Settings → API Keys
4. Copy your Public and Secret keys
5. Update `.env` file
6. Restart the backend

### Troubleshooting

#### Port Conflicts

If you see "Port already in use" errors:

```bash
# Check what's using the ports
lsof -i :8000  # Backend
lsof -i :3001  # Frontend/Langfuse

# Kill process or use different ports in configuration
```

#### Database Connection Issues

```bash
# Verify PostgreSQL is running
docker-compose ps postgres

# Check database exists
docker-compose exec postgres psql -U postgres -l

# Recreate database
docker-compose exec postgres psql -U postgres -c "DROP DATABASE IF EXISTS agent_dojo;"
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE agent_dojo;"
uv run python scripts/init_db.py
```

#### Frontend Won't Start

```bash
# Clear node modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

#### Langfuse Sign Up Errors

If you see Prisma database errors:

```bash
# Restart Langfuse to run migrations
docker-compose restart langfuse-server

# Check logs
docker-compose logs langfuse-server
```

See `.agent_docs/LANGFUSE_SETUP.md` for detailed Langfuse troubleshooting.

### Need More Help?

- 📖 **Full Documentation**: See `README.md` for architecture details
- 🔧 **Local Setup Guide**: See `.agent_docs/` for detailed setup guides
- 🐛 **Issues**: Check GitHub issues or create a new one
- 💬 **Community**: Join discussions for support

### Development Commands

```bash
# Backend
uv run uvicorn agent_dojo.main:app --reload    # Start with hot reload
uv run pytest                                   # Run tests
uv run ruff check agent_dojo/                  # Lint code

# Frontend
cd frontend
npm run dev        # Development server
npm run build      # Production build
npm run preview    # Preview production build

# Docker
docker-compose up -d              # Start all services
docker-compose down               # Stop all services
docker-compose logs -f backend    # Follow backend logs
docker-compose restart langfuse-server  # Restart specific service
```

---

## Ready to build your first AI agent workflow? Let's go! 🚀
