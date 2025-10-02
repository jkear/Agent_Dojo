# Agent Dojo

A modern AI agent orchestration framework that combines the power of CrewAI's agent concepts with LangGraph's workflow capabilities, featuring a drag-and-drop canvas interface for creating AI workflows.

## Features

- 🤖 **Agent Orchestration**: Agent system with roles, goals, and backstories
- 🔗 **LangGraph Workflows**: Powerful state-based workflow management
- 🎨 **Canvas Interface**: Drag-and-drop workflow designer with real-time collaboration
- 📊 **Observability**: Integrated Langfuse for comprehensive tracing and analytics
- 🔌 **App Integrations**: Composio-powered authentication and app connections
- 🛠️ **MCP Tools**: Model Context Protocol tool integration
- 🐍 **Python Backend**: FastAPI-based backend with async support
- ⚛️ **React Frontend**: Modern React 18+ with TypeScript and Tailwind CSS

## Architecture

```text
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Canvas UI     │    │   Backend API   │    │   LangGraph     │
│   (React)       │◄──►│   (FastAPI)     │◄──►│   Workflows     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       ▼
         │              ┌─────────────────┐    ┌─────────────────┐
         │              │   Langfuse      │    │   MCP Tools     │
         │              │  Observability  │    │   Integration   │
         │              └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Composio      │    │   PostgreSQL    │    │   Redis         │
│   App Connects  │    │   Database      │    │   Cache/Queue   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- Docker & Docker Compose (recommended)

### Fast Setup

```bash
# Clone the repository
git clone https://github.com/jkear/Agent_Dojo.git
cd Agent_Dojo

# Run automated setup
./setup.sh

# Start development servers
./dev.sh
```

### Access Points

- 🎨 **Frontend UI**: <http://localhost:3001> (or next available port)
- 📚 **API Documentation**: <http://localhost:8000/docs>
- 📊 **Langfuse Observability**: <http://localhost:3001> (when using Docker services)

> **Note**: If Langfuse is running on port 3001, the frontend will automatically use the next available port (typically 3002). Check the terminal output for the exact URL.

### Manual Setup

If you prefer manual setup or Docker is not available:

1. **Install uv (Python package manager)**:

   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

1. **Install Python dependencies**:

   ```bash
   uv sync
   ```

1. **Install frontend dependencies**:

   ```bash
   cd frontend && npm install && cd ..
   ```

1. **Configure environment**:

   ```bash
   cp .env.example .env
   # Edit .env with your API keys and database connections
   ```

1. **Start services** (choose one):

   #### Option A: With Docker

   ```bash
   docker-compose up -d  # Starts PostgreSQL, Redis, and Langfuse
   ```

   #### Option B: Local services

   - Install and run PostgreSQL (port 5432)
   - Install and run Redis (port 6379)
   - Optionally setup Langfuse for observability

1. **Start the application**:

   ```bash
   # Terminal 1 - Backend
   uv run uvicorn agent_dojo.main:app --reload --host 0.0.0.0 --port 8000

   # Terminal 2 - Frontend
   cd frontend && npm run dev
   ```

## Services & Ports

When using Docker Compose, the following services are available:

| Service    | Host Port | Container Port | Description        |
| ---------- | --------- | -------------- | ------------------ |
| Frontend   | 3001*     | 3000           | React UI with Vite |
| Backend    | 8000      | 8000           | FastAPI server     |
| PostgreSQL | 5433      | 5432           | Main database      |
| Redis      | 6379      | 6379           | Cache & queue      |
| Langfuse   | 3001      | 3000           | Observability UI   |

> *Note: Frontend and Langfuse both use port 3001. When running frontend locally with Docker Langfuse, the frontend will auto-select the next available port (typically 3002).

## Components

### Agents

- **Role-based AI agents** with specific responsibilities
- **Dynamic tool assignment** based on agent capabilities
- **Memory and context management** across conversations
- **Collaboration patterns** for multi-agent workflows

### Workflows

- **Visual workflow builder** with drag-and-drop interface
- **State management** through LangGraph
- **Conditional branching** and parallel execution
- **Error handling** and retry mechanisms

### Tools

- **MCP protocol integration** for extensible tooling
- **Composio app connections** with OAuth support
- **Custom tool development** framework
- **Tool marketplace** and discovery

### Observability

- **Complete trace visibility** through Langfuse
- **Performance metrics** and cost tracking
- **Debug tools** for workflow development
- **Analytics dashboard** for insights
- **Graceful fallback**: backend keeps running if the Langfuse SDK or decorators are unavailable

### Setting Up Langfuse

1. Access Langfuse UI at <http://localhost:3001>
2. Create an account (first signup becomes admin)
3. Navigate to Settings → API Keys
4. Copy your Public Key (pk-lf-...) and Secret Key (sk-lf-...)
5. Update `.env` file with your keys:

   ```bash
   LANGFUSE_PUBLIC_KEY=pk-lf-your-key
   LANGFUSE_SECRET_KEY=sk-lf-your-key
   LANGFUSE_HOST=http://langfuse-server:3000
   ```

6. Restart the backend to start sending traces

See `.agent_docs/LANGFUSE_SETUP.md` for detailed configuration and troubleshooting.

## Configuration

### Required API Keys

Edit `.env` file with your API keys:

```bash
# LLM Providers (at least one required)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Integrations
COMPOSIO_API_KEY=...  # For app integrations

# Observability (optional but recommended)
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_HOST=http://langfuse-server:3000
```

### Database Configuration

For local PostgreSQL (non-Docker):

```bash
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/agent_dojo
```

For Docker PostgreSQL:

```bash
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5433/agent_dojo
```

## Development Workflow

```bash
# Start services
docker-compose up -d

# Run migrations
uv run python scripts/init_db.py

# Start backend with hot reload
uv run uvicorn agent_dojo.main:app --reload

# Start frontend (in separate terminal)
cd frontend && npm run dev

# Run tests
uv run pytest

# Lint code
uv run ruff check agent_dojo/
```

## Project Structure

```text
Agent_Dojo/
├── agent_dojo/          # Backend Python package
│   ├── agents/          # Agent implementations
│   ├── api/             # FastAPI routes
│   ├── core/            # Core configuration
│   ├── database/        # Database models
│   ├── integrations/    # External integrations (Composio)
│   ├── observability/   # Langfuse client
│   ├── tools/           # Tool implementations
│   └── workflows/       # LangGraph workflows
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── stores/      # State management
│   │   └── utils/       # Utilities
│   └── public/          # Static assets
├── scripts/             # Utility scripts
├── .agent_docs/         # Additional documentation
└── docker-compose.yml   # Docker services configuration
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.
