import pytest
from pydantic import ValidationError

from backend.app.schemas.raffle import RaffleCreate
from backend.app.schemas.tenant import TenantUpdate
from backend.app.schemas.user import UserRegister


def raffle_payload(**overrides):
    payload = {
        "title": "Valid raffle",
        "price_per_number": 1,
        "total_numbers": 100,
    }
    payload.update(overrides)
    return payload


def test_rejects_invalid_purchase_limits():
    with pytest.raises(ValidationError):
        RaffleCreate(**raffle_payload(min_purchase=20, max_purchase=10))


def test_rejects_duplicate_lucky_numbers():
    with pytest.raises(ValidationError):
        RaffleCreate(**raffle_payload(lucky_numbers=[
            {"number": "10", "prize": "A"},
            {"number": "10", "prize": "B"},
        ]))


def test_rejects_unsafe_tenant_slug():
    with pytest.raises(ValidationError):
        TenantUpdate(slug="Slug Com Espaços")


def test_requires_nontrivial_password():
    with pytest.raises(ValidationError):
        UserRegister(email="user@example.com", full_name="User", password="123")
