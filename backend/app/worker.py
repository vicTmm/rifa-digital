"""Dedicated scheduler/worker for periodic jobs outside web replicas."""
import asyncio
import logging

from backend.app.config import settings
from backend.app.database import SessionLocal
from backend.app.services.payment_reconciliation import PaymentReconciliationService
from backend.app.services.raffle_service import RaffleService

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("rifa.worker")


async def run() -> None:
    while True:
        db = SessionLocal()
        try:
            RaffleService.cleanup_expired_orders(db)
            await PaymentReconciliationService.reconcile_pending(db)
        except Exception:
            db.rollback()
            log.exception("periodic worker iteration failed")
        finally:
            db.close()
        await asyncio.sleep(min(settings.EXPIRED_ORDER_CLEANUP_INTERVAL_SECONDS,
                                settings.PAYMENT_RECONCILIATION_INTERVAL_SECONDS))


if __name__ == "__main__":
    asyncio.run(run())
