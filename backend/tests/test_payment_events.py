from backend.app.services.payment_events import PaymentEventService


def test_event_key_is_stable_without_request_id():
    left = PaymentEventService.event_key({"type": "payment", "data": {"id": 123}}, None)
    right = PaymentEventService.event_key({"data": {"id": 123}, "type": "payment"}, None)
    assert left == right


def test_request_id_has_priority_for_idempotency():
    assert PaymentEventService.event_key({"anything": True}, "req-123") == "mercadopago:req-123"
