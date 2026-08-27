import hashlib
import hmac

from backend.app.services.mercadopago_service import MercadoPagoService


def test_validates_mercado_pago_signature():
    secret = "webhook-secret"
    payment_id = "123456"
    request_id = "request-abc"
    timestamp = "1710000000"
    manifest = f"id:{payment_id};request-id:{request_id};ts:{timestamp};"
    digest = hmac.new(
        secret.encode("utf-8"), manifest.encode("utf-8"), hashlib.sha256
    ).hexdigest()

    assert MercadoPagoService.validate_webhook_signature(
        f"ts={timestamp},v1={digest}", request_id, payment_id, secret
    )


def test_rejects_invalid_mercado_pago_signature():
    assert not MercadoPagoService.validate_webhook_signature(
        "ts=1710000000,v1=invalid", "request-abc", "123456", "webhook-secret"
    )


def test_only_recognizes_well_formed_access_tokens():
    assert not MercadoPagoService.is_real_token("TEST-MERCADOPAGO-ACCESS-TOKEN-MOCK")
    assert MercadoPagoService.is_real_token("APP_USR-" + "a" * 50)
