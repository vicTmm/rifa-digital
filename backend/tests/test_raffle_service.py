from datetime import datetime, timedelta
from types import SimpleNamespace

from backend.app.models.order import OrderStatus
from backend.app.services.raffle_service import RaffleService


def test_calculates_best_applicable_discount():
    raffle = SimpleNamespace(
        price_per_number=2.0,
        discount_combos=[
            {"quantity": 10, "discount_percentage": 5},
            {"quantity": 50, "discount_percentage": 15},
        ],
    )

    unit_price, discount, total = RaffleService.calculate_order_price(raffle, 50)

    assert unit_price == 2.0
    assert discount == 15.0
    assert total == 85.0


def test_refuses_to_confirm_expired_order():
    order = SimpleNamespace(
        status=OrderStatus.PENDING.value,
        expires_at=datetime.utcnow() - timedelta(seconds=1),
    )

    success, prizes = RaffleService.confirm_payment(SimpleNamespace(), order)

    assert not success
    assert prizes == []
