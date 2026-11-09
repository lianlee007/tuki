# syntax=docker/dockerfile:1.7
# =============================================================================
# Tuki AI Gateway — FastAPI + uvicorn, sin privilegios.
#
# La imagen base está fijada por digest para que un rebuild no cambie el
# sistema operativo por sorpresa (supply chain, Fase 0).
# =============================================================================

ARG PYTHON_IMAGE=python:3.12-slim@sha256:a0f57064cbdcd6285fa45f51237ab0b35ea8ebaed06a1f5973e89e19dfb86704

# -----------------------------------------------------------------------------
# Dependencias
# -----------------------------------------------------------------------------
# hadolint ignore=DL3006
FROM ${PYTHON_IMAGE} AS builder

ARG WITH_OTEL=false

ENV PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_ROOT_USER_ACTION=ignore

RUN python -m venv /opt/venv

WORKDIR /tmp/build

COPY requirements.txt requirements-otel.txt ./

RUN /opt/venv/bin/pip install --require-hashes -r requirements.txt \
    && if [ "$WITH_OTEL" = "true" ]; then \
         /opt/venv/bin/pip install --require-hashes -r requirements-otel.txt; \
       fi

# -----------------------------------------------------------------------------
# Runtime
# -----------------------------------------------------------------------------
# hadolint ignore=DL3006
FROM ${PYTHON_IMAGE} AS runtime

ARG VERSION=0.0.0-dev
ARG REVISION=unknown

LABEL org.opencontainers.image.title="Tuki AI Gateway" \
      org.opencontainers.image.description="Gateway de IA de Tuki: Groq, auth Supabase, rate limit y métricas" \
      org.opencontainers.image.vendor="Tuki" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.revision="${REVISION}" \
      org.opencontainers.image.licenses="Propietaria"

ENV PATH=/opt/venv/bin:$PATH \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONHASHSEED=random \
    PORT=8000

RUN groupadd --system --gid 10001 app \
    && useradd --system --uid 10001 --gid app --home-dir /app --shell /usr/sbin/nologin app

WORKDIR /app

COPY --from=builder /opt/venv /opt/venv
COPY --chown=10001:10001 app ./app

USER 10001:10001

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD ["python", "-c", "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/healthz', timeout=3).status == 200 else 1)"]

STOPSIGNAL SIGTERM

# `--no-access-log`: el middleware ya emite logs JSON con request-id.
CMD ["uvicorn", "app.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--proxy-headers", \
     "--forwarded-allow-ips=*", \
     "--no-access-log"]
