import pytest
import io
from PIL import Image
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.whatsapp_service import WhatsAppService
from backend.app.services.auth import create_access_token
from backend.app.database import SessionLocal
from backend.app.models.user import User

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def auth_headers():
    db = SessionLocal()
    user = db.query(User).filter(User.role == "ORGANIZER").first()
    db.close()
    if not user:
        token = create_access_token(data={"sub": "1", "email": "test@rifas.com", "role": "ORGANIZER"})
    else:
        token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role})
    return {"Authorization": f"Bearer {token}"}

def test_upload_valid_image(client, auth_headers):
    image_buffer = io.BytesIO()
    Image.new("RGB", (1, 1), color="red").save(image_buffer, format="PNG")
    image_buffer.seek(0)
    files = {"file": ("test.png", image_buffer, "image/png")}
    
    response = client.post("/api/uploads", files=files, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert "url" in data
    assert data["url"].startswith("/uploads/")
    assert data["content_type"] == "image/png"

def test_upload_invalid_filetype(client, auth_headers):
    files = {"file": ("test.exe", io.BytesIO(b"binary exe"), "application/x-msdownload")}
    response = client.post("/api/uploads", files=files, headers=auth_headers)
    assert response.status_code == 400

def test_upload_rejects_fake_image_bytes(client, auth_headers):
    files = {"file": ("fake.png", io.BytesIO(b"not-a-real-image"), "image/png")}
    response = client.post("/api/uploads", files=files, headers=auth_headers)
    assert response.status_code == 400

@pytest.mark.anyio
async def test_whatsapp_service_formatting():
    assert WhatsAppService.format_phone("(11) 98765-4321") == "5511987654321"
    assert WhatsAppService.format_phone("5511987654321") == "5511987654321"
    
    # Test sending simulation
    result = await WhatsAppService.notify_order_paid(
        customer_phone="11987654321",
        customer_name="Victor Teste",
        raffle_title="Rifa do iPhone 16 Pro",
        tickets=["00001", "00002"],
        total_amount=50.0,
        order_id=999
    )
    assert result is True
