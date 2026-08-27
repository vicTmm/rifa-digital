from datetime import datetime, timedelta

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.database import Base
from backend.app.models import (
    FinancialLedgerEntry,
    Order,
    OrderStatus,
    Raffle,
    Tenant,
    Ticket,
    TicketStatus,
    User,
    UserRole,
)
from backend.app.services.refunds import RefundService


def make_paid_order():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    user = User(email="refund@example.com", hashed_password="unused", full_name="Owner", role=UserRole.ORGANIZER.value)
    db.add(user)
    db.flush()
    tenant = Tenant(user_id=user.id, name="Store", slug="refund-store", available_balance=90, total_sales_amount=100)
    db.add(tenant)
    db.flush()
    raffle = Raffle(tenant_id=tenant.id, title="Refund raffle", slug="refund-raffle", price_per_number=100, total_numbers=100, sold_count=1)
    db.add(raffle)
    db.flush()
    order = Order(
        raffle_id=raffle.id,
        customer_name="Buyer",
        customer_phone="11999999999",
        quantity=1,
        unit_price=100,
        total_amount=100,
        organizer_net_amount=90,
        platform_fee_amount=10,
        status=OrderStatus.PAID.value,
        mp_payment_id="mock_pay_refund",
        expires_at=datetime.utcnow() + timedelta(minutes=10),
        paid_at=datetime.utcnow(),
    )
    db.add(order)
    db.flush()
    db.add(Ticket(raffle_id=raffle.id, order_id=order.id, number_int=1, number_str="01", customer_name="Buyer", customer_phone="11999999999", status=TicketStatus.PAID.value))
    db.commit()
    return db, order, tenant, raffle


@pytest.mark.anyio
async def test_refund_debits_balance_and_is_idempotent():
    db, order, tenant, raffle = make_paid_order()
    refunded = await RefundService.refund_paid(db, order.id, "Cliente solicitou cancelamento")
    db.refresh(tenant)
    db.refresh(raffle)

    assert refunded.status == OrderStatus.REFUNDED.value
    assert tenant.available_balance == 0
    assert tenant.total_sales_amount == 0
    assert raffle.sold_count == 0
    assert db.query(Ticket).one().status == TicketStatus.REFUNDED.value
    assert db.query(FinancialLedgerEntry).count() == 1

    again = await RefundService.refund_paid(db, order.id, "Tentativa duplicada")
    assert again.status == OrderStatus.REFUNDED.value
    assert db.query(FinancialLedgerEntry).count() == 1


def test_cancel_pending_releases_reserved_tickets():
    db, order, _, raffle = make_paid_order()
    order.status = OrderStatus.PENDING.value
    order.raffle.reserved_count = 1
    order.raffle.sold_count = 0
    db.query(Ticket).one().status = TicketStatus.RESERVED.value
    db.commit()

    RefundService.cancel_pending(db, order)

    assert order.status == OrderStatus.CANCELLED.value
    assert raffle.reserved_count == 0
    assert db.query(Ticket).count() == 0
