import pytest
from fastapi import HTTPException

from backend.app.config import settings
from backend.app.routers.orders import hash_order_access_token, validate_order_access


class OrderStub:
    access_token_hash = hash_order_access_token("private-token")


def test_order_access_token_accepts_matching_secret():
    previous = settings.REQUIRE_ORDER_ACCESS_TOKEN
    settings.REQUIRE_ORDER_ACCESS_TOKEN = True
    try:
        validate_order_access(OrderStub(), "private-token")
    finally:
        settings.REQUIRE_ORDER_ACCESS_TOKEN = previous


def test_order_access_token_hides_order_for_invalid_secret():
    previous = settings.REQUIRE_ORDER_ACCESS_TOKEN
    settings.REQUIRE_ORDER_ACCESS_TOKEN = True
    try:
        with pytest.raises(HTTPException) as exc:
            validate_order_access(OrderStub(), "wrong-token")
        assert exc.value.status_code == 404
    finally:
        settings.REQUIRE_ORDER_ACCESS_TOKEN = previous
