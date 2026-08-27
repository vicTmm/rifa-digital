import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from backend.app.config import Settings
from backend.app.main import app


def test_security_headers_are_present():
    with TestClient(app) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"
    assert "default-src 'self'" in response.headers["Content-Security-Policy"]
    assert "Strict-Transport-Security" not in response.headers


def test_simulator_is_not_enabled_in_unauthorized_environment():
    settings = Settings(ENVIRONMENT="staging", ENABLE_PAYMENT_SIMULATOR=True)

    assert settings.payment_simulator_enabled is False


def test_production_rejects_local_cors_and_hosts():
    with pytest.raises(ValidationError):
        Settings(
            ENVIRONMENT="production",
            SECRET_KEY="a" * 64,
            MERCADO_PAGO_WEBHOOK_SECRET="webhook-secret",
            CREDENTIAL_ENCRYPTION_KEY="b" * 64,
            RATE_LIMIT_STORAGE_URI="redis://localhost:6379/0",
            CORS_ORIGINS=["http://localhost:3000"],
            ALLOWED_HOSTS=["api.example.com"],
        )


def test_production_requires_explicit_hosts_and_origins():
    settings = Settings(
        ENVIRONMENT="production",
        SECRET_KEY="a" * 64,
        MERCADO_PAGO_WEBHOOK_SECRET="webhook-secret",
        CREDENTIAL_ENCRYPTION_KEY="b" * 64,
        RATE_LIMIT_STORAGE_URI="redis://localhost:6379/0",
        CORS_ORIGINS=["https://app.example.com"],
        ALLOWED_HOSTS=["api.example.com"],
    )

    assert settings.payment_simulator_enabled is False
