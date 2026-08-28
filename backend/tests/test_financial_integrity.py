from decimal import Decimal
from types import SimpleNamespace

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.database import Base
from backend.app.models.financial import FinancialLedgerEntry, LedgerEntryType
from backend.app.services.financial import FinancialService, money
from backend.app.services.payment_reconciliation import PaymentReconciliationService


def test_money_normalizes_without_float_drift():
    assert money(0.1) + money(0.2) == Decimal("0.30")
    assert money("10.005") == Decimal("10.01")


def test_payment_match_requires_exact_amount_and_currency():
    order = SimpleNamespace(total_amount=Decimal("12.34"))
    assert PaymentReconciliationService.payment_matches_order(
        {"status": "approved", "transaction_amount": "12.34", "currency_id": "BRL"}, order
    )
    assert not PaymentReconciliationService.payment_matches_order(
        {"status": "approved", "transaction_amount": "12.341", "currency_id": "BRL"}, order
    )
    assert not PaymentReconciliationService.payment_matches_order(
        {"status": "approved", "transaction_amount": "12.34", "currency_id": "USD"}, order
    )


def test_ledger_idempotency_rejects_changed_operation_and_validates_balance():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    first = FinancialService.add_ledger_entry(
        db, tenant_id=1, entry_type=LedgerEntryType.SALE_CREDIT, amount="10.00",
        balance_after="10.00", description="sale", idempotency_key="sale-1"
    )
    db.commit()
    assert FinancialService.add_ledger_entry(
        db, tenant_id=1, entry_type=LedgerEntryType.SALE_CREDIT, amount=10,
        balance_after=10, description="same", idempotency_key="sale-1"
    ).id == first.id
    try:
        FinancialService.add_ledger_entry(
            db, tenant_id=1, entry_type=LedgerEntryType.SALE_CREDIT, amount=11,
            balance_after=11, description="changed", idempotency_key="sale-1"
        )
    except ValueError:
        pass
    else:
        raise AssertionError("idempotency key accepted a changed amount")
    assert FinancialService.validate_ledger_invariants(db, 1)
    db.query(FinancialLedgerEntry).update({FinancialLedgerEntry.balance_after: Decimal("9.00")})
    db.commit()
    assert not FinancialService.validate_ledger_invariants(db, 1)
