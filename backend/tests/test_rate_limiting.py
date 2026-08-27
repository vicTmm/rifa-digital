from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.rate_limit import limiter


def test_login_rate_limit_returns_standard_response():
    limiter.reset()
    try:
        with TestClient(app) as client:
            responses = [
                client.post(
                    "/api/auth/login",
                    json={"email": "missing@example.com", "password": "invalid-password"},
                )
                for _ in range(6)
            ]

        assert [response.status_code for response in responses[:5]] == [401] * 5
        assert responses[5].status_code == 429
        assert responses[5].json() == {
            "detail": "Muitas solicitações. Aguarde antes de tentar novamente."
        }
        assert responses[5].headers["Retry-After"] == "60"
    finally:
        limiter.reset()
