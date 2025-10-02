"""Langfuse observability client integration"""

import warnings
from collections.abc import Callable
from typing import TYPE_CHECKING, Any, Optional, TypeVar

from agent_dojo.core.config import settings

if TYPE_CHECKING:  # pragma: no cover - imported only for type hints
    from langfuse.callback import CallbackHandler

try:
    from langfuse.callback import CallbackHandler as _CallbackHandler
    from langfuse.client import Langfuse as _Langfuse

    LANGFUSE_AVAILABLE = True
except ImportError:  # pragma: no cover - graceful degradation when Langfuse missing
    _Langfuse = None
    _CallbackHandler = None
    LANGFUSE_AVAILABLE = False

# Try to import decorators (available in langfuse >= 2.0.0)
try:
    from langfuse.decorators import langfuse_context, observe

    DECORATORS_AVAILABLE = True
except ImportError:  # pragma: no cover - decorator module not available in this version
    # Create no-op decorator fallback
    F = TypeVar("F", bound=Callable[..., Any])

    def _noop_observe(*_args: Any, **_kwargs: Any) -> Callable[[F], F]:
        """Fallback decorator that leaves the wrapped function unchanged."""

        def decorator(func: F) -> F:
            return func

        return decorator

    observe = _noop_observe
    langfuse_context = None
    DECORATORS_AVAILABLE = False
    warnings.warn(
        "Langfuse decorators module not available; observability decorators disabled.",
        RuntimeWarning,
        stacklevel=2,
    )

# Global Langfuse client instance
langfuse_client: Any | None = None
langfuse_handler: Any | None = None


def init_langfuse() -> None:
    """Initialize Langfuse client following official documentation pattern"""
    global langfuse_client, langfuse_handler

    if not LANGFUSE_AVAILABLE or _Langfuse is None or _CallbackHandler is None:
        print("Langfuse package not available, observability disabled")
        return

    if not settings.LANGFUSE_PUBLIC_KEY or not settings.LANGFUSE_SECRET_KEY:
        print("Langfuse credentials not provided, observability disabled")
        return

    try:
        # Initialize Langfuse client
        langfuse_client = _Langfuse(
            public_key=settings.LANGFUSE_PUBLIC_KEY,
            secret_key=settings.LANGFUSE_SECRET_KEY,
            host=settings.LANGFUSE_HOST,
        )

        # Initialize CallbackHandler for LangChain integration
        langfuse_handler = _CallbackHandler(
            public_key=settings.LANGFUSE_PUBLIC_KEY,
            secret_key=settings.LANGFUSE_SECRET_KEY,
            host=settings.LANGFUSE_HOST,
        )

        # Test the connection
        if langfuse_handler:
            langfuse_handler.auth_check()
            print("✓ Langfuse observability initialized successfully")
        else:
            print("✓ Langfuse observability initialized (handler unavailable)")

    except Exception as e:
        print(f"Failed to initialize Langfuse: {e}")
        langfuse_client = None
        langfuse_handler = None


def get_langfuse_handler() -> Optional["CallbackHandler"]:
    """Get Langfuse callback handler for LangChain integration"""
    return langfuse_handler


def flush_langfuse() -> None:
    """Flush all pending Langfuse events (call on shutdown)"""
    if langfuse_client:
        langfuse_client.flush()


# Tracing functions using decorators (if available)
# Note: These functions are conditionally defined based on DECORATORS_AVAILABLE
# The type checker may warn about redefinition, but this is intentional
if DECORATORS_AVAILABLE:

    @observe()
    def trace_agent_execution(  # type: ignore[no-redef]
        agent_id: str, task: str, result: Any, metadata: dict | None = None
    ) -> dict[str, Any]:
        """Trace agent execution with Langfuse"""
        return {
            "agent_id": agent_id,
            "task": task,
            "result": result,
            "metadata": metadata or {},
        }

    @observe()
    def trace_workflow_execution(  # type: ignore[no-redef]
        workflow_id: str, execution_id: str, status: str, metadata: dict | None = None
    ) -> dict[str, Any]:
        """Trace workflow execution with Langfuse"""
        return {
            "workflow_id": workflow_id,
            "execution_id": execution_id,
            "status": status,
            "metadata": metadata or {},
        }

    @observe()
    def trace_tool_execution(  # type: ignore[no-redef]
        tool_name: str,
        parameters: dict[str, Any],
        result: Any,
        metadata: dict | None = None,
    ) -> dict[str, Any]:
        """Trace tool execution with Langfuse"""
        return {
            "tool_name": tool_name,
            "parameters": parameters,
            "result": result,
            "metadata": metadata or {},
        }

else:
    # No-op versions when decorators aren't available
    def trace_agent_execution(
        agent_id: str, task: str, result: Any, metadata: dict | None = None
    ) -> None:
        """Trace agent execution (no-op when decorators unavailable)"""
        pass

    def trace_workflow_execution(
        workflow_id: str, execution_id: str, status: str, metadata: dict | None = None
    ) -> None:
        """Trace workflow execution (no-op when decorators unavailable)"""
        pass

    def trace_tool_execution(
        tool_name: str,
        parameters: dict[str, Any],
        result: Any,
        metadata: dict | None = None,
    ) -> None:
        """Trace tool execution (no-op when decorators unavailable)"""
        pass
