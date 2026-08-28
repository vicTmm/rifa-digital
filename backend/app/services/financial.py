from decimal import Decimal, ROUND_HALF_UP, InvalidOperation

from sqlalchemy.orm import Session

from backend.app.models.financial import FinancialLedgerEntry, LedgerEntryType


def money(value) -> Decimal:
    """Normalize a monetary value without ever doing binary-float arithmetic."""
    if value is None:
        value = 0
    try:
        result = Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    except (InvalidOperation, ValueError, TypeError) as exc:
        raise ValueError("Valor monetário inválido") from exc
    if not result.is_finite():
        raise ValueError("Valor monetário inválido")
    return result


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
            # An idempotency key can only represent the exact same operation.
            # Silently accepting a changed amount would hide financial corruption.
            if (existing.tenant_id != tenant_id or existing.entry_type != entry_type.value
                    or existing.amount != money(amount)):
                raise ValueError("Chave de idempotência já utilizada para outra operação")
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

    @staticmethod
    def validate_ledger_invariants(db: Session, tenant_id: int) -> bool:
        """Verify that the tenant ledger is contiguous and matches each balance."""
        entries = (db.query(FinancialLedgerEntry)
                   .filter(FinancialLedgerEntry.tenant_id == tenant_id)
                   .order_by(FinancialLedgerEntry.created_at.asc(), FinancialLedgerEntry.id.asc())
                   .all())
        previous = Decimal("0.00")
        for entry in entries:
            if money(entry.balance_after) != money(previous + money(entry.amount)):
                return False
            previous = money(entry.balance_after)
        return True
