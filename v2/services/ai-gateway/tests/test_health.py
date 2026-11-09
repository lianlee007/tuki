from __future__ import annotations

from conftest import make_client
from prometheus_client import REGISTRY


async def test_healthz_no_depende_de_groq():
    async with make_client() as client:
        response = await client.get("/healthz")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"
        assert response.headers["x-content-type-options"] == "nosniff"


async def test_readyz_ok_con_clave():
    async with make_client() as client:
        response = await client.get("/readyz")
        assert response.status_code == 200
        assert response.json()["checks"]["groq_api_key"] is True


async def test_readyz_503_sin_clave(settings_factory):
    async with make_client(settings_factory(groq_api_key="")) as client:
        response = await client.get("/readyz")
        assert response.status_code == 503
        assert "GROQ_API_KEY" in " ".join(response.json()["errors"])


async def test_alias_api_healthz():
    async with make_client() as client:
        response = await client.get("/api/healthz")
        assert response.status_code == 200


async def test_request_id_se_conserva():
    async with make_client() as client:
        response = await client.get(
            "/healthz", headers={"X-Request-Id": "prueba-123"}
        )
        assert response.headers["x-request-id"] == "prueba-123"


async def test_request_id_invalido_se_reemplaza():
    async with make_client() as client:
        response = await client.get(
            "/healthz", headers={"X-Request-Id": "x" * 200}
        )
        assert response.headers["x-request-id"] != "x" * 200
        assert len(response.headers["x-request-id"]) == 32


async def test_metrics_expone_contadores():
    async with make_client() as client:
        await client.get("/healthz")
        response = await client.get("/metrics")
        assert response.status_code == 200
        assert "ai_gateway_http_requests_total" in response.text
        assert "ai_gateway_upstream_requests_total" in response.text


async def test_root_no_expone_secretos():
    async with make_client() as client:
        response = await client.get("/")
        assert response.status_code == 200
        body = response.text
        assert "test-key" not in body
        assert "groq" not in body.lower()


def test_registry_tiene_metricas_esperadas():
    names = {metric.name for metric in REGISTRY.collect()}
    assert "ai_gateway_http_requests" in names
