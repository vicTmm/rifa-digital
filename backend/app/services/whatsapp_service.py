import logging
import re
from typing import List, Dict, Any, Optional
import httpx
from backend.app.config import settings

logger = logging.getLogger("whatsapp_service")

class WhatsAppService:
    @staticmethod
    def format_phone(phone: str) -> str:
        """Sanitizes phone number and prepends country code 55 (Brazil) if missing"""
        clean = re.sub(r"\D", "", phone or "")
        if not clean:
            return ""
        if len(clean) in (10, 11) and not clean.startswith("55"):
            clean = f"55{clean}"
        return clean

    @classmethod
    async def send_message(cls, phone: str, message: str) -> bool:
        """
        Sends a WhatsApp message via Evolution API / Z-API / Webhook.
        In development / if no API is configured, logs the formatted message to stdout/log.
        """
        if not settings.WHATSAPP_ENABLED:
            return False

        formatted_phone = cls.format_phone(phone)
        if not formatted_phone:
            logger.warning("WhatsApp send skipped: invalid phone number.")
            return False

        # If live WhatsApp API credentials are configured
        if settings.WHATSAPP_API_URL and settings.WHATSAPP_API_KEY:
            try:
                headers = {
                    "apikey": settings.WHATSAPP_API_KEY,
                    "Content-Type": "application/json",
                }
                payload = {
                    "number": formatted_phone,
                    "textMessage": {"text": message},
                    "options": {"delay": 1200, "presence": "composing"}
                }
                async with httpx.AsyncClient(timeout=10.0) as client:
                    url = f"{settings.WHATSAPP_API_URL.rstrip('/')}/message/sendText/{settings.WHATSAPP_INSTANCE_NAME}"
                    response = await client.post(url, json=payload, headers=headers)
                    if response.status_code in (200, 201):
                        logger.info(f"WhatsApp message sent successfully to {formatted_phone}")
                        return True
                    else:
                        logger.error(f"WhatsApp API error ({response.status_code}): {response.text}")
            except Exception as e:
                logger.error(f"Failed to connect to WhatsApp API: {str(e)}")
        else:
            # Development / Mock Notification Log
            logger.info(
                f"\n{'='*55}\n"
                f"📲 [WHATSAPP DISPATCH SIMULATOR] Destinatário: +{formatted_phone}\n"
                f"{'-'*55}\n"
                f"{message}\n"
                f"{'='*55}"
            )
            return True

        return False

    @classmethod
    async def notify_order_paid(
        cls,
        customer_phone: str,
        customer_name: str,
        raffle_title: str,
        tickets: List[str],
        total_amount: float,
        order_id: int
    ) -> bool:
        """Notification sent automatically when PIX is confirmed"""
        first_name = customer_name.split()[0] if customer_name else "Participante"
        num_preview = ", ".join(tickets[:12])
        if len(tickets) > 12:
            num_preview += f" e mais {len(tickets) - 12} cotas"

        message = (
            f"🎟️ *PAGAMENTO CONFIRMADO - RIFA DIGITAL*\n\n"
            f"Olá, *{first_name}*! Seu pagamento de *R$ {total_amount:.2f}* (Pedido #{order_id}) foi compensado com sucesso.\n\n"
            f"🏆 *Campanha:* {raffle_title}\n"
            f"🔢 *Seus Números da Sorte ({len(tickets)} cotas):*\n"
            f"👉 {num_preview}\n\n"
            f"✅ Seus bilhetes já estão participando do sorteio oficial pela Loteria Federal!\n"
            f"Boa sorte! 🍀"
        )
        return await cls.send_message(customer_phone, message)

    @classmethod
    async def notify_lucky_prize(
        cls,
        customer_phone: str,
        customer_name: str,
        raffle_title: str,
        lucky_prizes: List[Dict[str, Any]]
    ) -> bool:
        """Instant notification when a buyer hits an instant lucky number (Cota Premiada)"""
        first_name = customer_name.split()[0] if customer_name else "Participante"
        prizes_text = "\n".join([f"⭐ Cota *{p.get('number')}*: {p.get('prize')}" for p in lucky_prizes])

        message = (
            f"🎉 *VOCÊ ACHOU UMA COTA PREMIADA!* 🎉\n\n"
            f"Parabéns, *{first_name}*! Na sua compra da ação *{raffle_title}*, você foi contemplado com prêmio instantâneo:\n\n"
            f"{prizes_text}\n\n"
            f"O organizador fará a transferência via PIX no seu número cadastrado. Parabéns! 💰"
        )
        return await cls.send_message(customer_phone, message)

    @classmethod
    async def notify_draw_winner(
        cls,
        winner_phone: str,
        winner_name: str,
        raffle_title: str,
        winning_number: str
    ) -> bool:
        """Notification sent to the Grand Prize Winner"""
        message = (
            f"🏆 *PARABÉNS! VOCÊ É O GANHADOR OFICIAL!* 🏆\n\n"
            f"Olá, *{winner_name}*!\n"
            f"Seu número *{winning_number}* foi o grande sorteado na campanha:\n"
            f"🌟 *{raffle_title}*\n\n"
            f"O sorteio auditado foi concluído e a equipe organizadora entrará em contato para a entrega do seu prêmio!\n"
            f"Parabéns por essa grande conquista! 🚗✨"
        )
        return await cls.send_message(winner_phone, message)
