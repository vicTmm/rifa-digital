from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.database import Base
from backend.app.models import Tenant, User, UserRole, WithdrawalStatus, FinancialLedgerEntry, LedgerEntryType
from backend.app.routers.admin import process_withdrawal
from backend.app.routers.tenants import request_withdrawal
from backend.app.schemas.financial import WithdrawalCreate, WithdrawalProcess


def make_session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine)()


def create_organizer(db, balance=100.0):
    user = User(
        email="owner@example.com",
        hashed_password="unused",
        full_name="Owner",
        role=UserRole.ORGANIZER.value,
    )
    db.add(user)
    db.flush()
    tenant = Tenant(
        user_id=user.id,
        name="Store",
        slug="store",
        pix_key="owner@example.com",
        pix_key_type="EMAIL",
        available_balance=balance,
    )
    db.add(tenant)
    db.commit()
    db.refresh(user)
    return user


def test_request_reserves_balance_and_rejection_restores_it():
    db = make_session()
    organizer = create_organizer(db)

    withdrawal = request_withdrawal(WithdrawalCreate(amount=40), organizer, db)
    assert withdrawal.status == WithdrawalStatus.PENDING.value
    assert organizer.tenant.available_balance == 60.0
    reserve = db.query(FinancialLedgerEntry).one()
    assert reserve.entry_type == LedgerEntryType.WITHDRAWAL_RESERVE.value
    assert float(reserve.amount) == -40.0

    admin = User(role=UserRole.SUPERADMIN.value)
    result = process_withdrawal(
        withdrawal.id,
        WithdrawalProcess(status=WithdrawalStatus.REJECTED.value, admin_notes="Dados inválidos"),
        admin,
        db,
    )
    db.refresh(organizer.tenant)
    assert result["status"] == WithdrawalStatus.REJECTED.value
    assert organizer.tenant.available_balance == 100.0
    assert db.query(FinancialLedgerEntry).count() == 2


def test_completed_withdrawal_does_not_restore_balance():
    db = make_session()
    organizer = create_organizer(db)
    withdrawal = request_withdrawal(WithdrawalCreate(amount=75), organizer, db)
    admin = User(role=UserRole.SUPERADMIN.value)

    process_withdrawal(
        withdrawal.id,
        WithdrawalProcess(status=WithdrawalStatus.APPROVED.value),
        admin,
        db,
    )
    process_withdrawal(
        withdrawal.id,
        WithdrawalProcess(status=WithdrawalStatus.COMPLETED.value, proof_url="https://example.com/proof"),
        admin,
        db,
    )

    db.refresh(organizer.tenant)
    assert organizer.tenant.available_balance == 25.0
