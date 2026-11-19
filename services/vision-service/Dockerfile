# syntax=docker/dockerfile:1.7
# =============================================================================
# Tuki Vision — FastAPI + Ultralytics (inferencia local, sin servicios cloud).
#
# La imagen incluye los pesos entrenados en `modelos/`. Si todavía no existen,
# el contenedor arranca en estado "degraded" y /readyz devuelve 503; el resto
# de la plataforma sigue funcionando.
# =============================================================================

ARG PYTHON_IMAGE=python:3.13-slim
ARG TORCH_VERSION=2.15.0
ARG TORCHVISION_VERSION=0.29.2

# -----------------------------------------------------------------------------
# Dependencias
# -----------------------------------------------------------------------------
# hadolint ignore=DL3006
FROM ${PYTHON_IMAGE} AS builder

ARG TORCH_VERSION
ARG TORCHVISION_VERSION

ENV PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_ROOT_USER_ACTION=ignore

RUN python -m venv /opt/venv

WORKDIR /tmp/build

COPY requirements.txt ./

# En amd64, torch de PyPI arrastra las librerías de CUDA (~2 GB) aunque se use
# CPU. Se instala primero la rueda CPU oficial; ultralytics la da por satisfecha.
# En arm64 los wheels de PyPI ya son CPU y este paso se omite.
RUN --mount=type=cache,target=/root/.cache/pip \
    if [ "$(uname -m)" = "x86_64" ]; then \
        /opt/venv/bin/pip install --retries 10 --timeout 120 \
            --index-url https://download.pytorch.org/whl/cpu \
            "torch==${TORCH_VERSION}" "torchvision==${TORCHVISION_VERSION}"; \
    fi

# Ultralytics instala opencv-python (con interfaz gráfica). En el contenedor
# solo se usa para decodificar: la variante headless evita libGL/libglib y
# reduce la imagen. Los reintentos cubren caídas de red al bajar torch.
RUN --mount=type=cache,target=/root/.cache/pip \
    /opt/venv/bin/pip install --retries 10 --timeout 120 -r requirements.txt \
    && /opt/venv/bin/pip uninstall -y opencv-python \
    && /opt/venv/bin/pip install --retries 10 --timeout 120 opencv-python-headless==5.1.0.95

# -----------------------------------------------------------------------------
# Runtime
# -----------------------------------------------------------------------------
# hadolint ignore=DL3006
FROM ${PYTHON_IMAGE} AS runtime

ARG VERSION=0.0.0-dev
ARG REVISION=unknown

LABEL org.opencontainers.image.title="Tuki Vision" \
      org.opencontainers.image.description="Clasificador local de fotos de platos (comida / no comida)" \
      org.opencontainers.image.vendor="Tuki" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.revision="${REVISION}" \
      org.opencontainers.image.licenses="Propietaria"

ENV PATH=/opt/venv/bin:$PATH \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    YOLO_CONFIG_DIR=/tmp/ultralytics \
    YOLO_OFFLINE=true \
    YOLO_AUTOINSTALL=false \
    MPLCONFIGDIR=/tmp/matplotlib

# libgomp1 lo necesita torch. OpenCV se instala en variante headless, así que
# no hacen falta libGL ni libglib.
# hadolint ignore=DL3008
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libgomp1 \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd --system --gid 10001 app \
    && useradd --system --uid 10001 --gid app --home-dir /app --shell /usr/sbin/nologin app

WORKDIR /app

COPY --from=builder /opt/venv /opt/venv
COPY --chown=10001:10001 app ./app
COPY --chown=10001:10001 modelos ./modelos

USER 10001:10001

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD ["python", "-c", "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/readyz', timeout=3).status == 200 else 1)"]

STOPSIGNAL SIGTERM

CMD ["uvicorn", "app.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--proxy-headers", \
     "--forwarded-allow-ips=*", \
     "--no-access-log"]
