"""Contratos públicos de la API del gateway."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class ChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    prompt: str = Field(min_length=1, max_length=8000)
    system: str | None = Field(default=None, max_length=4000)
    temperature: float = Field(default=0.7, ge=0, le=2)
    max_tokens: int = Field(default=1024, ge=1, le=4096)


class Usage(BaseModel):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


class ChatResponse(BaseModel):
    content: str
    model: str
    usage: Usage
    attempts: int
    latency_ms: int
    request_id: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    environment: str
