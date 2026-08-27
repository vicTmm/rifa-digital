import hashlib
import json
from types import SimpleNamespace

from backend.app.services.draw_audit import DrawAuditService


def tickets():
    return [
        SimpleNamespace(id=3, order_id=2, number_int=20, number_str="020"),
        SimpleNamespace(id=1, order_id=1, number_int=5, number_str="005"),
        SimpleNamespace(id=2, order_id=1, number_int=10, number_str="010"),
    ]


def test_snapshot_is_canonical_and_verifiable():
    snapshot, digest = DrawAuditService.build_snapshot(tickets())
    assert [item["number"] for item in snapshot] == ["005", "010", "020"]
    canonical = json.dumps(snapshot, sort_keys=True, separators=(",", ":"))
    assert hashlib.sha256(canonical.encode()).hexdigest() == digest


def test_selection_proof_points_to_winning_ticket(monkeypatch):
    monkeypatch.setattr("secrets.token_hex", lambda _: "fixed-entropy")
    eligible = tickets()
    _, snapshot_hash = DrawAuditService.build_snapshot(eligible)
    winner, entropy, selection_hash, index = DrawAuditService.select_automatic(eligible, snapshot_hash)

    expected_hash = hashlib.sha256(f"{snapshot_hash}:fixed-entropy".encode()).hexdigest()
    assert entropy == "fixed-entropy"
    assert selection_hash == expected_hash
    assert index == int(expected_hash, 16) % 3
    assert winner == sorted(eligible, key=lambda item: (item.number_int, item.id))[index]
