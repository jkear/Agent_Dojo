Copilot Instructions
This project is Agent Dojo, a modern AI agent orchestration framework being transformed into a comprehensive GUI for Composio and LangChain integration. The application provides a visual workflow builder for creating AI agents with access to 150+ external app integrations via Composio's toolkit system.
Project Architecture

Backend: FastAPI (Python 3.10+) with async/await patterns
Frontend: React 18+ with TypeScript and Tailwind CSS
Agent Framework: LangChain + LangGraph for workflow orchestration
App Integrations: Composio SDK v3 with LangChain provider
Observability: Langfuse for tracing and analytics
Database: PostgreSQL (production) / SQLite (development) with SQLAlchemy
State Management: Redis for caching and queues

Critical Implementation Requirements
Composio Integration Standards

ALWAYS use composio_langchain.LangchainProvider for tool integration
NEVER use direct Composio client without the LangChain provider wrapper
All tool retrieval must use user_id parameter for multi-tenant support
Raw tool definitions must expose input_parameters, output_parameters, and scopes
OAuth flows must follow Composio's connection initiation → callback → verification pattern

Backend Coding Standards (Python)

Use async/await for all I/O operations (database, API calls, external services)
Type hints are MANDATORY for all function signatures using Python 3.10+ syntax
Use Pydantic models for all API request/response schemas
Follow FastAPI dependency injection patterns for shared resources (DB sessions, clients)
Error handling: Use AgentDojoException custom exceptions with appropriate HTTP status codes
Naming: snake_case for functions/variables, PascalCase for classes
Line length: 88 characters (Black formatter standard)
Import order: stdlib → third-party → local (sorted alphabetically within groups)

Frontend Coding Standards (TypeScript/React)

Use camelCase for variable and function names
Use PascalCase for component names and TypeScript interfaces/types
Use single quotes for strings (except JSX attributes which use double quotes)
Use 2 spaces for indentation
Use arrow functions for component definitions and callbacks
Use async/await for asynchronous operations
Use const for constants and let for variables that will be reassigned
Use destructuring for props, objects, and arrays
Use template literals for strings containing variables
Use TypeScript strict mode - all components must have proper type definitions
Use TanStack Query (React Query) for all API data fetching
Use Tailwind CSS utility classes for styling (no custom CSS unless absolutely necessary)

Component Architecture Patterns

Smart/Container components: Handle data fetching, state management, business logic
Presentational components: Receive data via props, focus on UI rendering
Custom hooks: Extract reusable logic (prefix with use, e.g., useComposioTools)
API client layer: Centralize all API calls in frontend/src/api/ directory

Composio-Specific Frontend Patterns
typescript// Tool fetching pattern
const { data: tools, isLoading } = useQuery({
  queryKey: ['toolkit-tools', toolkitSlug, userId],
  queryFn: () => fetchToolkitTools(toolkitSlug, userId),
  enabled: !!toolkitSlug && !!userId
});

// OAuth flow handling pattern
const initiateMutation = useMutation({
  mutationFn: (toolkit: string) => initiateConnection(toolkit, userId),
  onSuccess: (data) => {
    // Open OAuth popup
    const popup = window.open(data.auth_url, 'OAuth', 'width=600,height=700');
    // Poll for completion
    const interval = setInterval(async () => {
      const status = await checkConnectionStatus(data.connection_id);
      if (status === 'ACTIVE') {
        clearInterval(interval);
        popup?.close();
        refetch();
      }
    }, 2000);
  }
});
---
Below is a list of Composio documentation. Use your web and fetch capabilities to read the documentation you need.
[Composio Documentation](https://docs.composio.dev)

- [Quickstart](https://docs.composio.dev/docs/quickstart.mdx): Add authenticated tool-calling to any LLM agent in three steps.
- [Configuration](https://docs.composio.dev/docs/configuration.mdx)
- [Providers](https://docs.composio.dev/docs/providers.mdx)
- [Executing Tools](https://docs.composio.dev/docs/executing-tools.mdx): Learn how to execute Composio's tools with different providers and frameworks
- [Authenticating Tools](https://docs.composio.dev/docs/authenticating-tools.mdx): Learn how to authenticate tools
- [Fetching and Filtering Tools](https://docs.composio.dev/docs/fetching-tools.mdx): Learn how to fetch and filter Composio's tools and toolkits
- [Modifying tool schemas](https://docs.composio.dev/docs/modifying-tool-schemas): Learn how to use schema modifiers to transform tool schemas before they are seen by agents.
- [Modifying tool inputs](https://docs.composio.dev/docs/modifying-tool-inputs): Learn how to use before execution modifiers to modify tool arguments before execution.
- [Modifying tool outputs](https://docs.composio.dev/docs/modifying-tool-outputs): Learn how to use after execution modifiers to transform tool results after execution.
- [Creating custom tools](https://docs.composio.dev/docs/custom-tools.mdx): Learn how to extend Composio's toolkits with your own tools
- [Custom Auth Configs](https://docs.composio.dev/docs/custom-auth-configs.mdx): Guide to using customizing auth configs for a toolkit
- [Programmatic Auth Configs](https://docs.composio.dev/docs/programmatic-auth-configs.mdx): Guide to creating auth configs programmatically
- [Custom Auth Parameters](https://docs.composio.dev/docs/custom-auth-params.mdx): Guide to injecting custom credentials in headers or parameters for a toolkit
- [Using Triggers](https://docs.composio.dev/docs/using-triggers.mdx): Send payloads to your system based on external events
- [OpenAI Providers](https://docs.composio.dev/providers/openai.mdx)
- [Anthropic Provider](https://docs.composio.dev/providers/anthropic.mdx)
- [LangGraph Provider](https://docs.composio.dev/providers/langgraph.mdx)
- [CrewAI Provider](https://docs.composio.dev/providers/crewai.mdx)
- [Vercel AI SDK Provider](https://docs.composio.dev/providers/vercel.mdx)
- [Google ADK Provider](https://docs.composio.dev/providers/google-adk.mdx)
- [OpenAI Agents Provider](https://docs.composio.dev/providers/openai-agents.mdx)
- [Mastra Provider](https://docs.composio.dev/providers/mastra.mdx)
- [Custom Providers](https://docs.composio.dev/toolsets/custom.mdx)
