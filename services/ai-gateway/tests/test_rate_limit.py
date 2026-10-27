from __future__ import annotations

from app.adaptadores.memoria import RateLimiter
from app.dominio.modelos import RateRule


def test_permite_el_burst_y_luego_bloquea():
    limiter = RateLimiter({"anon": RateRule(per_minute=60, burst=2)})
    assert limiter.check("anon", "ip:1", now=100.0).allowed
    assert limiter.check("anon", "ip:1", now=100.0).allowed
    denied = limiter.check("anon", "ip:1", now=100.0)
    assert denied.allowed is False
    assert denied.retry_after == 1.0
    assert denied.remaining == 0


def test_recarga_con_el_tiempo():
    limiter = RateLimiter({"anon": RateRule(per_minute=60, burst=1)})
    assert limiter.check("anon", "ip:1", now=0.0).allowed
    assert not limiter.check("anon", "ip:1", now=0.5).allowed
    assert limiter.check("anon", "ip:1", now=1.0).allowed


def test_las_claves_son_independientes():
    limiter = RateLimiter({"anon": RateRule(per_minute=60, burst=1)})
    assert limiter.check("anon", "ip:1", now=0.0).allowed
    assert limiter.check("anon", "ip:2", now=0.0).allowed
    assert not limiter.check("anon", "ip:1", now=0.0).allowed


def test_cuota_de_usuario_es_independiente_de_la_anonima():
    limiter = RateLimiter(
        {
            "anon": RateRule(per_minute=60, burst=1),
            "user": RateRule(per_minute=60, burst=3),
        }
    )
    assert limiter.check("anon", "ip:1", now=0.0).allowed
    assert limiter.check("user", "user:abc", now=0.0).allowed
    assert limiter.check("user", "user:abc", now=0.0).allowed
    assert limiter.check("user", "user:abc", now=0.0).allowed
    assert not limiter.check("user", "user:abc", now=0.0).allowed


def test_gc_elimina_cubos_inactivos():
    limiter = RateLimiter(
        {"anon": RateRule(per_minute=60, burst=1)},
        stale_seconds=10,
    )
    limiter.check("anon", "ip:viejo", now=0.0)
    limiter.check("anon", "ip:nuevo", now=1000.0)
    assert limiter.size == 1
