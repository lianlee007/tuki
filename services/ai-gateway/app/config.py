"""Configuración del AI Gateway, validada al arrancar.

Todas las variables usan el prefijo ``AI_`` salvo las credenciales de Supabase,
que se leen con su nombre estándar para integrarse con los secretos de
Docker/Kubernetes. El proveedor de IA es Ollama, que corre en la misma máquina:
no hay claves de terceros ni llamadas a Groq.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import AliasChoices, Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="AI_",
        env_file=None,
        extra="ignore",
        populate_by_name=True,
        case_sensitive=False,
    )

    app_name: str = "tuki-ai-gateway"
    version: str = "1.0.0"
    environment: str = "development"
    log_level: str = "INFO"

    # --- Autenticación -----------------------------------------------------
    auth_mode: Literal["disabled", "supabase", "local"] = "supabase"
    # La corrección de barrio del carrito la usa un cliente anónimo. Si se
    # desactiva, toda llamada exige un JWT válido.
    allow_anon: bool = True
    supabase_url: str = Field(
        "",
        validation_alias=AliasChoices("SUPABASE_URL", "AI_SUPABASE_URL"),
    )
    supabase_jwks_url: str = ""
    supabase_audience: str = "authenticated"
    supabase_issuer: str = ""
    jwt_algorithms: str = "RS256,ES256,EdDSA,HS256"
    jwks_cache_seconds: int = 600
    trust_proxy_headers: bool = True
    # Los proyectos antiguos de Supabase firman los JWT con HS256 y su endpoint
    # JWKS no publica claves, así que la firma no se puede comprobar en local.
    # En ese caso el token se valida contra GoTrue con la clave pública `anon`.
    supabase_anon_key: SecretStr = Field(
        default=SecretStr(""),
        validation_alias=AliasChoices("SUPABASE_ANON_KEY", "AI_SUPABASE_ANON_KEY"),
    )
    supabase_userinfo_url: str = ""
    legacy_token_cache_seconds: int = 60

    # --- JWT propio (identidad-service) ------------------------------------
    # En modo local el gateway valida el token que emite identidad-service.
    jwt_secreto: SecretStr = Field(
        default=SecretStr(""),
        validation_alias=AliasChoices("JWT_SECRETO", "AI_JWT_SECRETO"),
    )
    jwt_emisor: str = Field(
        "tuki-identidad",
        validation_alias=AliasChoices("JWT_EMISOR", "AI_JWT_EMISOR"),
    )
    jwt_audiencia: str = Field(
        "tuki",
        validation_alias=AliasChoices("JWT_AUDIENCIA", "AI_JWT_AUDIENCIA"),
    )

    # --- Ollama (modelo local) --------------------------------------------
    # El chat y los embeddings viven en el mismo Ollama. El modelo de chat se
    # crea con el Modelfile del repositorio (`ollama create tuki-chef ...`).
    ollama_url: str = "http://localhost:11434"
    ollama_modelo_chat: str = "tuki-chef"
    # Si `tuki-chef` aún no se ha creado, el gateway usa el modelo base. Así el
    # chat funciona desde el primer arranque y el Modelfile es una mejora, no
    # un requisito para levantar el servicio.
    ollama_modelo_respaldo: str = "qwen2.5:1.5b-instruct"
    ollama_modelo_embeddings: str = "nomic-embed-text"
    ollama_timeout_seconds: float = 120.0
    ollama_total_timeout_seconds: float = 180.0
    ollama_max_attempts: int = 2
    ollama_backoff_seconds: float = 0.5
    ollama_max_backoff_seconds: float = 4.0
    ollama_keep_alive: str = "15m"
    ollama_num_ctx: int = 3072

    # --- RAG ---------------------------------------------------------------
    # El gateway no consulta PostgreSQL: pide el catálogo al servicio de
    # restaurantes, que es el dueño de esas tablas.
    restaurantes_url: str = "http://localhost:3002"
    resenas_url: str = "http://localhost:3005"
    conocimiento_ttl_seconds: int = 300
    conocimiento_max_restaurantes: int = 200
    conocimiento_directorio: str = ""
    rag_chunk_tokens: int = 220
    rag_chunk_overlap: int = 40
    rag_candidatos: int = 20
    rag_top_k: int = 6
    rag_contexto_max_tokens: int = 1100
    rag_mmr_lambda: float = 0.72
    rag_umbral_semantico: float = 0.22

    # --- Límites de la API -------------------------------------------------
    request_max_chars: int = 4000
    max_output_tokens: int = 1024
    rate_limit_anon_per_minute: int = 10
    rate_limit_anon_burst: int = 4
    rate_limit_auth_per_minute: int = 30
    rate_limit_auth_burst: int = 8

    # --- Observabilidad / CORS --------------------------------------------
    cors_origins: str = ""
    otel_enabled: bool = False
    otel_service_name: str = "tuki-ai-gateway"
    otel_endpoint: str = ""

    @field_validator(
        "ollama_url",
        "restaurantes_url",
        "resenas_url",
        "supabase_url",
    )
    @classmethod
    def _strip_trailing_slash(cls, value: str) -> str:
        return value.strip().rstrip("/")

    @field_validator("log_level")
    @classmethod
    def _upper_level(cls, value: str) -> str:
        return value.strip().upper()

    @model_validator(mode="after")
    def _derive_supabase_urls(self) -> Settings:
        if self.supabase_url and not self.supabase_jwks_url:
            self.supabase_jwks_url = (
                f"{self.supabase_url}/auth/v1/.well-known/jwks.json"
            )
        if self.supabase_url and not self.supabase_userinfo_url:
            self.supabase_userinfo_url = f"{self.supabase_url}/auth/v1/user"
        if self.supabase_url and not self.supabase_issuer:
            self.supabase_issuer = f"{self.supabase_url}/auth/v1"
        return self

    @property
    def models(self) -> list[str]:
        modelo = self.ollama_modelo_chat.strip()
        return [modelo] if modelo else []

    @property
    def modelo_chat(self) -> str:
        return self.ollama_modelo_chat.strip()

    @property
    def modelo_embeddings(self) -> str:
        return self.ollama_modelo_embeddings.strip()

    @property
    def algorithms(self) -> list[str]:
        return [item.strip() for item in self.jwt_algorithms.split(",") if item.strip()]

    @property
    def cors_origin_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]

    @property
    def supabase_anon_configured(self) -> bool:
        return bool(self.supabase_anon_key.get_secret_value().strip())

    def validate_or_raise(self) -> None:
        """Falla rápido ante errores que no se pueden corregir en caliente."""
        errors: list[str] = []
        if self.auth_mode == "supabase" and not self.supabase_url:
            errors.append("SUPABASE_URL es obligatoria con AI_AUTH_MODE=supabase")
        if self.auth_mode == "supabase" and "TU_PROYECTO" in self.supabase_url.upper():
            errors.append("SUPABASE_URL sigue siendo el placeholder de ejemplo")
        if self.auth_mode == "local" and not self.jwt_secreto.get_secret_value().strip():
            errors.append("JWT_SECRETO es obligatorio con AI_AUTH_MODE=local")
        if self.auth_mode == "disabled" and self.environment.lower() == "production":
            errors.append("AI_AUTH_MODE=disabled no se permite en producción")
        for name in (
            "rate_limit_anon_per_minute",
            "rate_limit_anon_burst",
            "rate_limit_auth_per_minute",
            "rate_limit_auth_burst",
            "request_max_chars",
            "max_output_tokens",
            "conocimiento_ttl_seconds",
            "conocimiento_max_restaurantes",
            "rag_chunk_tokens",
            "rag_candidatos",
            "rag_top_k",
            "rag_contexto_max_tokens",
        ):
            if getattr(self, name) < 1:
                errors.append(f"{name} debe ser mayor que cero")
        if self.rag_chunk_overlap < 0:
            errors.append("rag_chunk_overlap no puede ser negativo")
        if self.rag_chunk_overlap >= self.rag_chunk_tokens:
            errors.append("rag_chunk_overlap debe ser menor que rag_chunk_tokens")
        if not 0.0 <= self.rag_mmr_lambda <= 1.0:
            errors.append("rag_mmr_lambda debe estar entre 0 y 1")
        if not self.modelo_chat:
            errors.append("AI_OLLAMA_MODELO_CHAT no puede estar vacío")
        if not self.modelo_embeddings:
            errors.append("AI_OLLAMA_MODELO_EMBEDDINGS no puede estar vacío")
        if not self.ollama_url:
            errors.append("AI_OLLAMA_URL no puede estar vacío")
        if not self.restaurantes_url:
            errors.append("AI_RESTAURANTES_URL no puede estar vacío")
        if errors:
            raise RuntimeError("Configuración inválida: " + "; ".join(errors))

    def readiness_errors(self) -> list[str]:
        """Comprobaciones que no deben tumbar el proceso, solo quitar readiness."""
        errors: list[str] = []
        if self.auth_mode == "supabase" and not self.supabase_jwks_url:
            errors.append("JWKS de Supabase no configurado")
        if self.auth_mode == "local" and not self.jwt_secreto.get_secret_value().strip():
            errors.append("JWT_SECRETO no configurado")
        return errors


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
