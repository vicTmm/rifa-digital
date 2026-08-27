from types import SimpleNamespace

from backend.app.models.financial import LedgerEntryType
from backend.app.services.financial import FinancialService, money


class FakeQuery:
    def filter(self, *_):
        return self

    def first(self):
        return None


class FakeSession:
    def __init__(self):
        self.added = []

    def query(self, *_):
        return FakeQuery()

    def add(self, value):
        self.added.append(value)


def test_money_rounds_financial_values_to_cents():
    assert str(money("10.235")) == "10.24"


def test_creates_ledger_entry_without_committing_transaction():
    db = FakeSession()
    entry = FinancialService.add_ledger_entry(
        db,
        tenant_id=1,
        entry_type=LedgerEntryType.SALE_CREDIT,
        amount="12.345",
        balance_after="112.345",
        description="Sale",
        idempotency_key="sale:1",
        order_id=1,
    )

    assert db.added == [entry]
    assert entry.amount == money("12.345")
    assert entry.balance_after == money("112.345")
