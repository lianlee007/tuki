from __future__ import annotations

from contextlib import asynccontextmanager

import httpx
import pytest
from asgi_lifespan import LifespanManager

from app.config import Settings
from app.main import create_app


def build_settings(**overrides) -> Settings:
    base = {
        "auth_mode": "disabled",
        "environment": "test",
        "log_level": "WARNING",
        "groq_api_key": "test-key",
        "groq_backoff_seconds": 0.0,
        "groq_max_backoff_seconds": 0.0,
        "rate_limit_anon_per_minute": 1000,
        "rate_limit_anon_burst": 1000,
        "rate_limit_auth_per_minute": 1000,
        "rate_limit_auth_burst": 1000,
    }
    base.update(overrides)
    return Settings(**base)


@asynccontextmanager
async def make_client(settings: Settings | None = None):
    app = create_app(settings or build_settings())
    async with LifespanManager(app):
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(
            transport=transport,
            base_url="http://gateway.test",
            headers={"X-Real-IP": "203.0.113.10"},
        ) as client:
            yield client


@pytest.fixture
def settings_factory():
    return build_settings


@pytest.fixture
def client_factory():
    return make_client
