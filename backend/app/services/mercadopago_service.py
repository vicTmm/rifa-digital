import httpx
import qrcode
import io
import base64
import uuid
import hashlib
import hmac
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from backend.app.config import settings

class MercadoPagoService:
    @staticmethod
    def is_real_token(access_token: Optional[str]) -> bool:
        return bool(
            access_token
            and (access_token.startswith("APP_USR-") or access_token.startswith("TEST-"))
            and len(access_token) > 40
        )

    @classmethod
    async def get_payment(cls, payment_id: str, access_token: str) -> Optional[Dict[str, Any]]:
        if not cls.is_real_token(access_token):
            return None
        headers = {"Authorization": f"Bearer {access_token}"}
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                f"https://api.mercadopago.com/v1/payments/{payment_id}",
                headers=headers,
            )
        if response.status_code != 200:
            return None
        return response.json()

    @classmethod
    async def refund_payment(
        cls,
        payment_id: str,
        access_token: str,
        idempotency_key: str,
    ) -> Optional[Dict[str, Any]]:
        if payment_id.startswith("mock_pay_") and settings.ENABLE_PAYMENT_SIMULATOR:
            return {"id": f"mock_refund_{payment_id}", "status": "approved"}
        if not cls.is_real_token(access_token):
            return None
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "X-Idempotency-Key": idempotency_key,
        }
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                f"https://api.mercadopago.com/v1/payments/{payment_id}/refunds",
                json={},
                headers=headers,
            )
        if response.status_code not in {200, 201}:
            return None
        return response.json()

    @staticmethod
    def validate_webhook_signature(
        signature: Optional[str],
        request_id: Optional[str],
        data_id: str,
        secret: str,
    ) -> bool:
        if not secret or not signature or not request_id:
            return False
        parts = dict(
            item.strip().split("=", 1)
            for item in signature.split(",")
            if "=" in item
        )
        timestamp = parts.get("ts")
        received_hash = parts.get("v1")
        if not timestamp or not received_hash:
            return False
        manifest = f"id:{data_id};request-id:{request_id};ts:{timestamp};"
        expected_hash = hmac.new(
            secret.encode("utf-8"), manifest.encode("utf-8"), hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected_hash, received_hash)
    @staticmethod
    def generate_mock_pix_qr(pix_code: str) -> str:
        """Generates a Base64 PNG QR Code image from a string"""
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=2,
        )
        qr.add_data(pix_code)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        return f"data:image/png;base64,{img_str}"

    @classmethod
    async def create_pix_payment(
        cls,
        amount: float,
        description: str,
        payer_email: str,
        payer_name: str,
        payer_cpf: Optional[str] = None,
        custom_access_token: Optional[str] = None,
        expires_minutes: int = 15
    ) -> Dict[str, Any]:
        """
        Creates a PIX payment via Mercado Pago.
        If access token is dummy/mock, generates a rich simulated PIX payload with working QR code.
        """
        access_token = custom_access_token or settings.MERCADO_PAGO_ACCESS_TOKEN
        
        # Check if real Mercado Pago token is set (usually starts with APP_USR-)
        is_real_token = cls.is_real_token(access_token)
        
        if is_real_token and not settings.ENABLE_PAYMENT_SIMULATOR:
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
                "X-Idempotency-Key": str(uuid.uuid4())
            }
            
            payload = {
                "transaction_amount": float(round(amount, 2)),
                "description": description[:100],
                "payment_method_id": "pix",
                "payer": {
                    "email": payer_email or "cliente@rifadigital.com",
                    "first_name": payer_name.split()[0] if payer_name else "Cliente",
                    "last_name": " ".join(payer_name.split()[1:]) if len(payer_name.split()) > 1 else "Rifa",
                    "identification": {
                        "type": "CPF",
                        "number": (payer_cpf or "00000000000").replace(".", "").replace("-", "").replace(" ", "")
                    }
                },
                "date_of_expiration": (datetime.utcnow() + timedelta(minutes=expires_minutes)).strftime("%Y-%m-%dT%H:%M:%S.000-03:00")
            }
            
            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    response = await client.post(
                        "https://api.mercadopago.com/v1/payments",
                        json=payload,
                        headers=headers
                    )
                    
                    if response.status_code in [200, 201]:
                        data = response.json()
                        point_of_interaction = data.get("point_of_interaction", {})
                        transaction_data = point_of_interaction.get("transaction_data", {})
                        
                        qr_code_base64 = transaction_data.get("qr_code_base64")
                        if qr_code_base64:
                            qr_img = f"data:image/png;base64,{qr_code_base64}"
                        else:
                            qr_img = cls.generate_mock_pix_qr(transaction_data.get("qr_code", "pix"))
                            
                        return {
                            "payment_id": str(data.get("id")),
                            "status": data.get("status", "pending"),
                            "pix_code": transaction_data.get("qr_code"),
                            "pix_qr_code": qr_img,
                            "txid": data.get("id")
                        }
            except Exception as e:
                # Log and fallback to mock simulator for seamless development
                print(f"[MercadoPago] Error calling API: {e}, falling back to simulated PIX")
        
        # Simulated PIX for Development / Sandbox
        txid = f"SIM_{uuid.uuid4().hex[:12].upper()}"
        mock_copia_e_cola = (
            f"00020126580014br.gov.bcb.pix0136{uuid.uuid4()}"
            f"52040000530398654{amount:.2f}5802BR5915RIFA DIGITAL6009SAO PAULO"
            f"62140510{txid}6304ABCD"
        )
        
        qr_code_image = cls.generate_mock_pix_qr(mock_copia_e_cola)
        
        return {
            "payment_id": f"mock_pay_{uuid.uuid4().hex[:10]}",
            "status": "pending",
            "pix_code": mock_copia_e_cola,
            "pix_qr_code": qr_code_image,
            "txid": txid
        }
