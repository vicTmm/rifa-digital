from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from backend.app.database import get_db
from backend.app.models.tenant import Tenant
from backend.app.models.raffle import Raffle, RaffleStatus
from backend.app.models.order import Order, OrderStatus
from backend.app.models.user import User
from backend.app.schemas.tenant import TenantUpdate, TenantResponse, TenantPublic
from backend.app.schemas.raffle import RafflePublicItem
from backend.app.services.auth import get_current_organizer

router = APIRouter(prefix="/tenants", tags=["Organizadores / Lojas"])

@router.get("/{slug}", response_model=TenantPublic)
def get_tenant_by_slug(slug: str, db: Session = Depends(get_db)):
    tenant = db.query(Tenant).filter(Tenant.slug == slug, Tenant.is_active == True).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organizador não encontrado."
        )
    active_count = db.query(Raffle).filter(Raffle.tenant_id == tenant.id, Raffle.status == RaffleStatus.ACTIVE.value).count()
    return {
        "id": tenant.id,
        "name": tenant.name,
        "slug": tenant.slug,
        "bio": tenant.bio,
        "logo_url": tenant.logo_url,
        "banner_url": tenant.banner_url,
        "whatsapp": tenant.whatsapp,
        "instagram": tenant.instagram,
        "is_verified": tenant.is_verified,
        "total_active_raffles": active_count
    }

@router.get("/{slug}/raffles", response_model=List[RafflePublicItem])
def get_tenant_raffles(slug: str, db: Session = Depends(get_db)):
    tenant = db.query(Tenant).filter(Tenant.slug == slug, Tenant.is_active == True).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Organizador não encontrado.")
        
    raffles = db.query(Raffle).filter(
        Raffle.tenant_id == tenant.id,
        Raffle.status.in_([RaffleStatus.ACTIVE.value, RaffleStatus.DRAWN.value])
    ).order_by(Raffle.created_at.desc()).all()
    
    result = []
    for r in raffles:
        sold = r.sold_count or 0
        total = r.total_numbers or 1
        progress = round((sold / total) * 100, 1)
        result.append({
            "id": r.id,
            "tenant_id": tenant.id,
            "tenant_name": tenant.name,
            "tenant_slug": tenant.slug,
            "tenant_verified": tenant.is_verified,
            "title": r.title,
            "slug": r.slug,
            "category": r.category,
            "images": r.images or [],
            "price_per_number": r.price_per_number,
            "total_numbers": r.total_numbers,
            "sold_count": sold,
            "progress_percentage": progress,
            "status": r.status,
            "draw_date": r.draw_date,
            "draw_type": r.draw_type,
            "badge_text": r.badge_text,
            "is_featured": r.is_featured,
            "created_at": r.created_at
        })
    return result

@router.get("/me/dashboard")
def get_organizer_dashboard(current_user: User = Depends(get_current_organizer), db: Session = Depends(get_db)):
    tenant = current_user.tenant
    if not tenant:
        raise HTTPException(status_code=404, detail="Perfil de organizador não configurado.")
        
    # Aggregate sales metrics
    total_raffles = db.query(Raffle).filter(Raffle.tenant_id == tenant.id).count()
    active_raffles = db.query(Raffle).filter(Raffle.tenant_id == tenant.id, Raffle.status == RaffleStatus.ACTIVE.value).count()
    
    # Calculate total revenue from paid orders
    paid_orders = (
        db.query(
            func.count(Order.id).label("orders_count"),
            func.sum(Order.quantity).label("total_tickets"),
            func.sum(Order.total_amount).label("gross_revenue"),
            func.sum(Order.organizer_net_amount).label("net_revenue")
        )
        .join(Raffle, Order.raffle_id == Raffle.id)
        .filter(Raffle.tenant_id == tenant.id, Order.status == OrderStatus.PAID.value)
        .first()
    )
    
    # Recent orders
    recent_orders = (
        db.query(Order)
        .join(Raffle, Order.raffle_id == Raffle.id)
        .filter(Raffle.tenant_id == tenant.id)
        .order_by(Order.created_at.desc())
        .limit(10)
        .all()
    )
    
    recent_orders_list = []
    for o in recent_orders:
        recent_orders_list.append({
            "id": o.id,
            "raffle_title": o.raffle.title if o.raffle else "",
            "customer_name": o.customer_name,
            "customer_phone": o.customer_phone,
            "quantity": o.quantity,
            "total_amount": o.total_amount,
            "status": o.status,
            "created_at": o.created_at
        })
        
    return {
        "tenant": {
            "id": tenant.id,
            "name": tenant.name,
            "slug": tenant.slug,
            "available_balance": tenant.available_balance or 0.0,
            "total_sales_amount": tenant.total_sales_amount or 0.0,
            "is_verified": tenant.is_verified,
            "pix_key": tenant.pix_key,
            "has_custom_mercadopago": bool(tenant.mp_access_token)
        },
        "stats": {
            "total_raffles": total_raffles,
            "active_raffles": active_raffles,
            "total_orders_paid": paid_orders.orders_count or 0 if paid_orders else 0,
            "total_tickets_sold": int(paid_orders.total_tickets or 0) if paid_orders else 0,
            "gross_revenue": float(paid_orders.gross_revenue or 0.0) if paid_orders else 0.0,
            "net_revenue": float(paid_orders.net_revenue or 0.0) if paid_orders else 0.0,
        },
        "recent_orders": recent_orders_list
    }

@router.put("/me/profile", response_model=TenantResponse)
def update_organizer_profile(
    payload: TenantUpdate,
    current_user: User = Depends(get_current_organizer),
    db: Session = Depends(get_db)
):
    tenant = current_user.tenant
    if not tenant:
        raise HTTPException(status_code=404, detail="Organizador não encontrado.")
        
    if payload.name is not None:
        tenant.name = payload.name
    if payload.slug is not None and payload.slug != tenant.slug:
        existing = db.query(Tenant).filter(Tenant.slug == payload.slug, Tenant.id != tenant.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Este link de organizador (slug) já está em uso.")
        tenant.slug = payload.slug
    if payload.bio is not None:
        tenant.bio = payload.bio
    if payload.logo_url is not None:
        tenant.logo_url = payload.logo_url
    if payload.banner_url is not None:
        tenant.banner_url = payload.banner_url
    if payload.whatsapp is not None:
        tenant.whatsapp = payload.whatsapp
    if payload.instagram is not None:
        tenant.instagram = payload.instagram
    if payload.pix_key is not None:
        tenant.pix_key = payload.pix_key
    if payload.pix_key_type is not None:
        tenant.pix_key_type = payload.pix_key_type
    if payload.mp_access_token is not None:
        tenant.mp_access_token = payload.mp_access_token
    if payload.mp_public_key is not None:
        tenant.mp_public_key = payload.mp_public_key
        
    db.commit()
    db.refresh(tenant)
    return tenant
