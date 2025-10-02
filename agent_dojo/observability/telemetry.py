"""OpenTelemetry integration for comprehensive observability"""

from opentelemetry import metrics, trace
from opentelemetry.exporter.otlp.proto.http.metric_exporter import OTLPMetricExporter
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

from agent_dojo.core.config import settings


def init_telemetry() -> None:
    """Initialize OpenTelemetry tracing and metrics"""

    # Create resource
    resource = Resource.create(
        {
            "service.name": "agent-dojo",
            "service.version": "0.1.0",
            "deployment.environment": settings.ENVIRONMENT,
        }
    )

    # Initialize tracing
    trace_provider = TracerProvider(resource=resource)

    # Add OTLP exporter if configured
    if settings.LANGFUSE_HOST:
        otlp_exporter = OTLPSpanExporter(
            endpoint=f"{settings.LANGFUSE_HOST}/api/public/ingestion/v1/traces",
        )
        span_processor = BatchSpanProcessor(otlp_exporter)
        trace_provider.add_span_processor(span_processor)

    trace.set_tracer_provider(trace_provider)

    # Initialize metrics
    metric_reader = PeriodicExportingMetricReader(
        OTLPMetricExporter(
            endpoint=(
                f"{settings.LANGFUSE_HOST}/api/public/ingestion/v1/metrics"
                if settings.LANGFUSE_HOST
                else None
            )
        ),
        export_interval_millis=60000,  # 1 minute
    )

    metrics.set_meter_provider(
        MeterProvider(
            resource=resource,
            metric_readers=[metric_reader],
        )
    )

    print("OpenTelemetry telemetry initialized")


def get_tracer(name: str) -> trace.Tracer:
    """Get tracer instance"""
    return trace.get_tracer(name)


def get_meter(name: str) -> metrics.Meter:
    """Get meter instance"""
    return metrics.get_meter(name)
