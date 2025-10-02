"""Core exceptions and error handling"""

from typing import Any

from fastapi import HTTPException


class AgentDojoException(Exception):
    """Base exception for Agent Dojo"""

    def __init__(
        self,
        message: str,
        error_code: str | None = None,
        details: dict[str, Any] | None = None,
    ):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        super().__init__(message)


class AgentException(AgentDojoException):
    """Agent-related exceptions"""

    pass


class WorkflowException(AgentDojoException):
    """Workflow-related exceptions"""

    pass


class ToolException(AgentDojoException):
    """Tool-related exceptions"""

    pass


class AuthenticationException(AgentDojoException):
    """Authentication exceptions"""

    pass


class ValidationException(AgentDojoException):
    """Validation exceptions"""

    pass


# HTTP Exception helpers
def http_404(message: str = "Resource not found") -> HTTPException:
    return HTTPException(status_code=404, detail=message)


def http_400(message: str = "Bad request") -> HTTPException:
    return HTTPException(status_code=400, detail=message)


def http_401(message: str = "Unauthorized") -> HTTPException:
    return HTTPException(status_code=401, detail=message)


def http_403(message: str = "Forbidden") -> HTTPException:
    return HTTPException(status_code=403, detail=message)


def http_500(message: str = "Internal server error") -> HTTPException:
    return HTTPException(status_code=500, detail=message)
