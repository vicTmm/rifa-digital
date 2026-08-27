from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
from backend.app.database import get_db
from backend.app.models.user import User, UserRole
from backend.app.models.tenant import Tenant
from backend.app.models.raffle import Raffle, RaffleStatus
from backend.app.models.order import Order, OrderStatus
from backend.app.models.financial import WithdrawalRequest, WithdrawalStatus
from backend.app.schemas.financial import AdminStatsResponse, WithdrawalResponse, WithdrawalProcess
from backend.app.services.auth import get_current_admin

router = APIRouter(prefix="/admin", tags=["Super Administrador"])

@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_stats(current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    total_organizers = db.query(Tenant).count()
    total_raffles = db.query(Raffle).count()
    active_raffles = db.query(Raffle).filter(Raffle.status == RaffleStatus.ACTIVE.value).count()
    
    financials = (
        db.query(
            func.sum(Order.total_amount).label("total_volume"),
            func.sum(Order.platform_fee_amount).label("platform_revenue"),
            func.sum(Order.quantity).label("tickets_sold")
        )
        .filter(Order.status == OrderStatus.PAID.value)
        .first()
    )
    
    pending_withdrawals = db.query(WithdrawalRequest).filter(WithdrawalRequest.status == WithdrawalStatus.PENDING.value).count()
    
    return {
        "total_users": total_users,
        "total_organizers": total_organizers,
        "total_raffles": total_raffles,
        "active_raffles": active_raffles,
        "total_sales_volume": float(financials.total_volume or 0.0) if financials else 0.0,
        "total_platform_revenue": float(financials.platform_revenue or 0.0) if financials else 0.0,
        "total_tickets_sold": int(financials.tickets_sold or 0) if financials else 0,
        "pending_withdrawals_count": pending_withdrawals
    }

@router.get("/tenants")
def list_tenants(current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    tenants = db.query(Tenant).order_by(Tenant.created_at.desc()).all()
    results = []
    for t in tenants:
        active_raffles = db.query(Raffle).filter(Raffle.tenant_id == t.id, Raffle.status == RaffleStatus.ACTIVE.value).count()
        results.append({
            "id": t.id,
            "user_id": t.user_id,
            "owner_email": t.owner.email if t.owner else None,
            "name": t.name,
            "slug": t.slug,
            "whatsapp": t.whatsapp,
            "is_verified": t.is_verified,
            "is_active": t.is_active,
            "custom_fee_percent": t.custom_fee_percent,
            "available_balance": t.available_balance or 0.0,
            "total_sales_amount": t.total_sales_amount or 0.0,
            "active_raffles": active_raffles,
            "created_at": t.created_at
        })
    return results

@router.put("/tenants/{tenant_id}/verify")
def toggle_verify_tenant(
    tenant_id: int,
    verified: bool,
    custom_fee_percent: Optional[float] = None,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Organizador não encontrado.")
        
    tenant.is_verified = verified
    if custom_fee_percent is not None:
        tenant.custom_fee_percent = custom_fee_percent
        
    db.commit()
    return {"message": "Organizador atualizado com sucesso", "is_verified": tenant.is_verified, "custom_fee_percent": tenant.custom_fee_percent}

@router.get("/withdrawals", response_model=List[WithdrawalResponse])
def list_withdrawals(current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    withdrawals = db.query(WithdrawalRequest).order_by(WithdrawalRequest.requested_at.desc()).all()
    return [
        {
            **{column.name: getattr(item, column.name) for column in WithdrawalRequest.__table__.columns},
            "tenant_name": item.tenant.name if item.tenant else None,
        }
        for item in withdrawals
    ]

@router.put("/withdrawals/{withdrawal_id}", response_model=WithdrawalResponse)
def process_withdrawal(
    withdrawal_id: int,
    payload: WithdrawalProcess,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    allowed_statuses = {
        WithdrawalStatus.APPROVED.value,
        WithdrawalStatus.COMPLETED.value,
        WithdrawalStatus.REJECTED.value,
    }
    if payload.status not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Status de saque inválido.")

    withdrawal = (
        db.query(WithdrawalRequest)
        .filter(WithdrawalRequest.id == withdrawal_id)
        .with_for_update()
        .first()
    )
    if not withdrawal:
        raise HTTPException(status_code=404, detail="Solicitação de saque não encontrada.")

    transitions = {
        WithdrawalStatus.PENDING.value: {WithdrawalStatus.APPROVED.value, WithdrawalStatus.REJECTED.value},
        WithdrawalStatus.APPROVED.value: {WithdrawalStatus.COMPLETED.value, WithdrawalStatus.REJECTED.value},
    }
    if payload.status not in transitions.get(withdrawal.status, set()):
        raise HTTPException(status_code=409, detail="Transição de status não permitida.")

    if payload.status == WithdrawalStatus.REJECTED.value:
        tenant = db.query(Tenant).filter(Tenant.id == withdrawal.tenant_id).with_for_update().first()
        tenant.available_balance = round((tenant.available_balance or 0.0) + withdrawal.amount, 2)

    withdrawal.status = payload.status
    withdrawal.admin_notes = payload.admin_notes
    withdrawal.proof_url = payload.proof_url
    if payload.status in {WithdrawalStatus.COMPLETED.value, WithdrawalStatus.REJECTED.value}:
        withdrawal.processed_at = datetime.utcnow()
    db.commit()
    db.refresh(withdrawal)
    return {
        **{column.name: getattr(withdrawal, column.name) for column in WithdrawalRequest.__table__.columns},
        "tenant_name": withdrawal.tenant.name if withdrawal.tenant else None,
    }
