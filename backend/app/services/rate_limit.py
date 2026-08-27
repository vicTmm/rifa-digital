from fastapi import Request
from slowapi import Limiter

from backend.app.config import settings


def client_address(request: Request) -> str:
    """Use the socket peer address; forwarded headers require trusted-proxy setup."""
    return request.client.host if request.client else "unknown"


limiter = Limiter(
    key_func=client_address,
    storage_uri=settings.RATE_LIMIT_STORAGE_URI,
    headers_enabled=False,
)
