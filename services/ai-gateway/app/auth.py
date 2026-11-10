"""Compatibilidad: la autenticación con Supabase vive en
``app.adaptadores.supabase``. El código nuevo debe importar desde ahí.
"""

from app.adaptadores.supabase import (
    AuthError,
    Identity,
    clear_jwk_cache,
    client_ip,
    get_jwk_client,
    resolve_identity,
    verify_supabase_jwt,
)

__all__ = [
    "AuthError",
    "Identity",
    "clear_jwk_cache",
    "client_ip",
    "get_jwk_client",
    "resolve_identity",
    "verify_supabase_jwt",
]
