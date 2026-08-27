from types import SimpleNamespace

from backend.app.services.payment_reconciliation import PaymentReconciliationService


def test_approved_payment_must_match_order_amount():
    order = SimpleNamespace(total_amount=50.0)
    assert PaymentReconciliationService.payment_matches_order(
        {"status": "approved", "transaction_amount": 50.0}, order
    )
    assert not PaymentReconciliationService.payment_matches_order(
        {"status": "approved", "transaction_amount": 49.99}, order
    )
    assert not PaymentReconciliationService.payment_matches_order(
        {"status": "pending", "transaction_amount": 50.0}, order
    )
