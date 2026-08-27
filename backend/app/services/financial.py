from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy.orm import Session

from backend.app.models.financial import FinancialLedgerEntry, LedgerEntryType


def money(value) -> Decimal:
    return Decimal(str(value or 0)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


class FinancialService:
    @staticmethod
    def add_ledger_entry(
        db: Session,
        *,
        tenant_id: int,
        entry_type: LedgerEntryType,
        amount,
        balance_after,
        description: str,
        idempotency_key: str,
        order_id: int | None = None,
        withdrawal_id: int | None = None,
    ) -> FinancialLedgerEntry:
        existing = (
            db.query(FinancialLedgerEntry)
            .filter(FinancialLedgerEntry.idempotency_key == idempotency_key)
            .first()
        )
        if existing:
            return existing
        entry = FinancialLedgerEntry(
            tenant_id=tenant_id,
            order_id=order_id,
            withdrawal_id=withdrawal_id,
            entry_type=entry_type.value,
            amount=money(amount),
            balance_after=money(balance_after),
            description=description,
            idempotency_key=idempotency_key,
        )
        db.add(entry)
        return entry
