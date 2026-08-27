from backend.app.services.security import mask_phone, redact_text

def test_mask_phone_does_not_expose_full_number():
    assert mask_phone("5511987654321") == "55*********21"
    assert "987654321" not in mask_phone("5511987654321")

def test_redact_text_removes_credentials_and_long_pii():
    result = redact_text("token=super-secret phone=5511987654321")
    assert "super-secret" not in result
    assert "5511987654321" not in result
