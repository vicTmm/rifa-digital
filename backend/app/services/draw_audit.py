import hashlib
import json
import secrets

from fastapi import HTTPException
from sqlalchemy.orm import Session

from backend.app.models.draw import DrawAudit
from backend.app.models.ticket import Ticket


class DrawAuditService:
    ALGORITHM = "SHA256-ENTROPY-MODULO-V1"

    @staticmethod
    def build_snapshot(tickets: list[Ticket]) -> tuple[list[dict], str]:
        snapshot = [
            {"ticket_id": ticket.id, "order_id": ticket.order_id, "number": ticket.number_str}
            for ticket in sorted(tickets, key=lambda item: (item.number_int, item.id))
        ]
        canonical = json.dumps(snapshot, sort_keys=True, separators=(",", ":"))
        return snapshot, hashlib.sha256(canonical.encode("utf-8")).hexdigest()

    @classmethod
    def select_automatic(cls, tickets: list[Ticket], snapshot_hash: str) -> tuple[Ticket, str, str, int]:
        entropy = secrets.token_hex(32)
        selection_hash = hashlib.sha256(f"{snapshot_hash}:{entropy}".encode("utf-8")).hexdigest()
        index = int(selection_hash, 16) % len(tickets)
        ordered = sorted(tickets, key=lambda item: (item.number_int, item.id))
        return ordered[index], entropy, selection_hash, index

    @classmethod
    def create_audit(
        cls,
        db: Session,
        *,
        raffle_id: int,
        draw_type: str,
        tickets: list[Ticket],
        winning_ticket: Ticket | None = None,
        proof_url: str | None = None,
        notes: str | None = None,
    ) -> tuple[DrawAudit, Ticket]:
        if db.query(DrawAudit).filter(DrawAudit.raffle_id == raffle_id).first():
            raise HTTPException(status_code=409, detail="Esta rifa já possui um registro de sorteio.")
        snapshot, snapshot_hash = cls.build_snapshot(tickets)
        entropy = selection_hash = None
        selected_index = None
        if winning_ticket is None:
            winning_ticket, entropy, selection_hash, selected_index = cls.select_automatic(tickets, snapshot_hash)
        audit = DrawAudit(
            raffle_id=raffle_id,
            draw_type=draw_type,
            algorithm=cls.ALGORITHM if entropy else "EXTERNAL-RESULT-V1",
            eligible_count=len(snapshot),
            eligible_snapshot=snapshot,
            snapshot_hash=snapshot_hash,
            entropy=entropy,
            selection_hash=selection_hash,
            selected_index=selected_index,
            winning_ticket_id=winning_ticket.id,
            winning_number=winning_ticket.number_str,
            proof_url=proof_url,
            notes=notes,
        )
        db.add(audit)
        return audit, winning_ticket
