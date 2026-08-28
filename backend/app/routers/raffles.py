from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
import random
import re
from datetime import datetime
from backend.app.database import get_db
from backend.app.models.raffle import Raffle, RaffleStatus, DrawType
from backend.app.models.tenant import Tenant
from backend.app.models.order import Order, OrderStatus
from backend.app.models.ticket import Ticket, TicketStatus
from backend.app.models.user import User
from backend.app.schemas.raffle import (
    RaffleCreate,
    RaffleUpdate,
    RafflePublicItem,
    RaffleDetail,
    RaffleDrawExecute
)
from backend.app.services.auth import get_current_organizer
from backend.app.services.raffle_service import RaffleService
from backend.app.services.whatsapp_service import WhatsAppService
from backend.app.services.draw_audit import DrawAuditService
from backend.app.models.draw import DrawAudit

router = APIRouter(prefix="/raffles", tags=["Campanhas de Rifas"])

ALLOWED_RAFFLE_TRANSITIONS = {
    RaffleStatus.DRAFT.value: {RaffleStatus.ACTIVE.value, RaffleStatus.CANCELLED.value},
    RaffleStatus.ACTIVE.value: {RaffleStatus.PAUSED.value, RaffleStatus.DRAWING.value, RaffleStatus.CANCELLED.value},
    RaffleStatus.PAUSED.value: {RaffleStatus.ACTIVE.value, RaffleStatus.CANCELLED.value},
    RaffleStatus.DRAWING.value: {RaffleStatus.DRAWN.value, RaffleStatus.CANCELLED.value},
    RaffleStatus.DRAWN.value: set(),
    RaffleStatus.CANCELLED.value: set(),
}

def generate_raffle_slug(title: str) -> str:
    slug = title.lower().strip()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[\s_-]+', '-', slug)
    slug = re.sub(r'^-+|-+$', '', slug)
    return slug

@router.get("", response_model=List[RafflePublicItem])
def list_public_raffles(
    category: Optional[str] = None,
    search: Optional[str] = None,
    tenant_slug: Optional[str] = None,
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Raffle).join(Tenant, Raffle.tenant_id == Tenant.id).filter(
        Raffle.status.in_([RaffleStatus.ACTIVE.value, RaffleStatus.DRAWN.value]),
        Tenant.is_active == True
    )
    
    if category and category != "Todos":
        query = query.filter(Raffle.category == category)
        
    if search:
        query = query.filter(Raffle.title.ilike(f"%{search}%"))
        
    if tenant_slug:
        query = query.filter(Tenant.slug == tenant_slug)
        
    raffles = query.order_by(Raffle.is_featured.desc(), Raffle.created_at.desc()).offset(offset).limit(limit).all()
    
    results = []
    for r in raffles:
        sold = r.sold_count or 0
        total = r.total_numbers or 1
        progress = round((sold / total) * 100, 1)
        results.append({
            "id": r.id,
            "tenant_id": r.tenant.id,
            "tenant_name": r.tenant.name,
            "tenant_slug": r.tenant.slug,
            "tenant_verified": r.tenant.is_verified,
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
    return results

@router.get("/my-raffles", response_model=List[RafflePublicItem])
def list_my_raffles(
    offset: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_organizer), db: Session = Depends(get_db)
):
    tenant = current_user.tenant
    if not tenant:
        raise HTTPException(status_code=404, detail="Perfil de organizador não encontrado.")
        
    raffles = (db.query(Raffle).filter(Raffle.tenant_id == tenant.id)
               .order_by(Raffle.created_at.desc()).offset(offset).limit(limit).all())
    results = []
    for r in raffles:
        sold = r.sold_count or 0
        total = r.total_numbers or 1
        progress = round((sold / total) * 100, 1)
        results.append({
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
    return results

@router.get("/{slug}", response_model=RaffleDetail)
def get_raffle_by_slug(slug: str, db: Session = Depends(get_db)):
    RaffleService.cleanup_expired_orders(db)
    
    raffle = db.query(Raffle).join(Tenant).filter(Raffle.slug == slug).first()
    if not raffle:
        raise HTTPException(status_code=404, detail="Campanha de rifa não encontrada.")
        
    sold = raffle.sold_count or 0
    total = raffle.total_numbers or 1
    progress = round((sold / total) * 100, 1)
    
    # Calculate top buyers
    top_buyers = RaffleService.get_top_buyers(db, raffle.id, limit=5)
    
    return {
        "id": raffle.id,
        "tenant_id": raffle.tenant.id,
        "tenant_name": raffle.tenant.name,
        "tenant_slug": raffle.tenant.slug,
        "tenant_verified": raffle.tenant.is_verified,
        "title": raffle.title,
        "slug": raffle.slug,
        "description": raffle.description,
        "category": raffle.category,
        "images": raffle.images or [],
        "price_per_number": raffle.price_per_number,
        "total_numbers": raffle.total_numbers,
        "sold_count": sold,
        "progress_percentage": progress,
        "min_purchase": raffle.min_purchase,
        "max_purchase": raffle.max_purchase,
        "status": raffle.status,
        "draw_date": raffle.draw_date,
        "draw_type": raffle.draw_type,
        "discount_combos": raffle.discount_combos or [],
        "lucky_numbers": raffle.lucky_numbers or [],
        "ranking_prizes": raffle.ranking_prizes or [],
        "top_buyers": top_buyers,
        "winner_number": raffle.winner_number,
        "winner_name": raffle.winner_name,
        "drawn_at": raffle.drawn_at,
        "draw_proof_url": raffle.draw_proof_url,
        "draw_notes": raffle.draw_notes,
        "badge_text": raffle.badge_text,
        "is_featured": raffle.is_featured,
        "created_at": raffle.created_at,
        "tenant": {
            "id": raffle.tenant.id,
            "name": raffle.tenant.name,
            "slug": raffle.tenant.slug,
            "bio": raffle.tenant.bio,
            "logo_url": raffle.tenant.logo_url,
            "banner_url": raffle.tenant.banner_url,
            "whatsapp": raffle.tenant.whatsapp,
            "instagram": raffle.tenant.instagram,
            "is_verified": raffle.tenant.is_verified
        }
    }

@router.post("", response_model=RaffleDetail)
def create_raffle(
    payload: RaffleCreate,
    current_user: User = Depends(get_current_organizer),
    db: Session = Depends(get_db)
):
    tenant = current_user.tenant
    if not tenant:
        raise HTTPException(status_code=400, detail="Perfil de organizador não configurado.")
        
    base_slug = generate_raffle_slug(payload.title) or f"rifa-{random.randint(1000, 9999)}"
    slug = base_slug
    counter = 1
    while db.query(Raffle).filter(Raffle.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1
        
    new_raffle = Raffle(
        tenant_id=tenant.id,
        title=payload.title,
        slug=slug,
        description=payload.description,
        category=payload.category or "Geral",
        images=payload.images or [],
        price_per_number=payload.price_per_number,
        total_numbers=payload.total_numbers,
        min_purchase=payload.min_purchase,
        max_purchase=payload.max_purchase,
        draw_date=payload.draw_date,
        draw_type=payload.draw_type,
        discount_combos=[c.dict() for c in payload.discount_combos] if payload.discount_combos else [],
        lucky_numbers=[l.dict() for l in payload.lucky_numbers] if payload.lucky_numbers else [],
        ranking_prizes=[r.dict() for r in payload.ranking_prizes] if payload.ranking_prizes else [],
        badge_text=payload.badge_text,
        is_featured=payload.is_featured,
        status=RaffleStatus.ACTIVE.value
    )
    db.add(new_raffle)
    db.commit()
    db.refresh(new_raffle)
    
    return get_raffle_by_slug(new_raffle.slug, db)

@router.put("/{raffle_id}")
def update_raffle(
    raffle_id: int,
    payload: RaffleUpdate,
    current_user: User = Depends(get_current_organizer),
    db: Session = Depends(get_db)
):
    tenant = current_user.tenant
    raffle = db.query(Raffle).filter(Raffle.id == raffle_id, Raffle.tenant_id == tenant.id).first()
    if not raffle:
        raise HTTPException(status_code=404, detail="Rifa não encontrada.")
        
    if payload.title is not None:
        raffle.title = payload.title
    if payload.description is not None:
        raffle.description = payload.description
    if payload.category is not None:
        raffle.category = payload.category
    if payload.images is not None:
        raffle.images = payload.images
    if payload.status is not None:
        if payload.status != raffle.status and payload.status not in ALLOWED_RAFFLE_TRANSITIONS.get(raffle.status, set()):
            raise HTTPException(status_code=409, detail="Transição de estado da rifa não permitida.")
        raffle.status = payload.status
    if payload.draw_date is not None:
        raffle.draw_date = payload.draw_date
    if payload.draw_type is not None:
        raffle.draw_type = payload.draw_type
    if payload.discount_combos is not None:
        raffle.discount_combos = [c.dict() for c in payload.discount_combos]
    if payload.lucky_numbers is not None:
        raffle.lucky_numbers = [l.dict() for l in payload.lucky_numbers]
    if payload.ranking_prizes is not None:
        raffle.ranking_prizes = [r.dict() for r in payload.ranking_prizes]
    if payload.badge_text is not None:
        raffle.badge_text = payload.badge_text
    if payload.is_featured is not None:
        raffle.is_featured = payload.is_featured
        
    db.commit()
    db.refresh(raffle)
    return {"message": "Rifa atualizada com sucesso", "slug": raffle.slug}

@router.post("/{raffle_id}/draw")
def execute_draw(
    raffle_id: int,
    payload: RaffleDrawExecute,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_organizer),
    db: Session = Depends(get_db)
):
    tenant = current_user.tenant
    raffle = db.query(Raffle).filter(Raffle.id == raffle_id, Raffle.tenant_id == tenant.id).first()
    if not raffle:
        raise HTTPException(status_code=404, detail="Rifa não encontrada.")
        
    if raffle.status == RaffleStatus.DRAWN.value:
        raise HTTPException(status_code=400, detail="Esta rifa já foi sorteada.")
        
    # Get all paid tickets
    paid_tickets = db.query(Ticket).filter(Ticket.raffle_id == raffle.id, Ticket.status == TicketStatus.PAID.value).all()
    if not paid_tickets:
        raise HTTPException(status_code=400, detail="Nenhuma cota paga encontrada para realizar o sorteio.")
        
    winning_ticket = None

    if not payload.winning_number and raffle.draw_type != DrawType.AUTOMATIC.value:
        raise HTTPException(
            status_code=400,
            detail="Informe o número vencedor para sorteios manuais ou pela Loteria Federal.",
        )
    
    if payload.winning_number:
        # Match specified number (e.g. from Federal Lottery)
        formatted_input = payload.winning_number.strip().zfill(RaffleService.get_number_padding(raffle.total_numbers))
        winning_ticket = next((t for t in paid_tickets if t.number_str == formatted_input), None)
        if not winning_ticket:
            raise HTTPException(
                status_code=400,
                detail=f"O número {formatted_input} não foi comprado ou pago por nenhum participante."
            )
    audit, winning_ticket = DrawAuditService.create_audit(
        db,
        raffle_id=raffle.id,
        draw_type=raffle.draw_type,
        tickets=paid_tickets,
        winning_ticket=winning_ticket,
        proof_url=payload.draw_proof_url,
        notes=payload.draw_notes,
    )
        
    raffle.status = RaffleStatus.DRAWN.value
    raffle.winner_number = winning_ticket.number_str
    raffle.winner_name = winning_ticket.customer_name
    raffle.winner_phone = winning_ticket.customer_phone[:4] + "****" + winning_ticket.customer_phone[-2:] if winning_ticket.customer_phone else ""
    raffle.winner_order_id = winning_ticket.order_id
    raffle.drawn_at = datetime.utcnow()
    raffle.draw_proof_url = payload.draw_proof_url
    raffle.draw_notes = payload.draw_notes
    
    db.commit()

    # Dispatch WhatsApp winner notification
    if winning_ticket.customer_phone:
        background_tasks.add_task(
            WhatsAppService.notify_draw_winner,
            winner_phone=winning_ticket.customer_phone,
            winner_name=winning_ticket.customer_name,
            raffle_title=raffle.title,
            winning_number=raffle.winner_number
        )

    return {
        "message": "Sorteio realizado com sucesso!",
        "winner_number": raffle.winner_number,
        "winner_name": raffle.winner_name,
        "drawn_at": raffle.drawn_at,
        "audit": {
            "snapshot_hash": audit.snapshot_hash,
            "algorithm": audit.algorithm,
            "entropy": audit.entropy,
            "selection_hash": audit.selection_hash,
            "eligible_count": audit.eligible_count,
        },
    }

@router.get("/{slug}/draw-audit")
def get_draw_audit(slug: str, db: Session = Depends(get_db)):
    raffle = db.query(Raffle).filter(Raffle.slug == slug).first()
    if not raffle:
        raise HTTPException(status_code=404, detail="Rifa não encontrada.")
    audit = db.query(DrawAudit).filter(DrawAudit.raffle_id == raffle.id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Sorteio ainda não realizado.")
    return {
        "raffle_id": raffle.id,
        "draw_type": audit.draw_type,
        "algorithm": audit.algorithm,
        "eligible_count": audit.eligible_count,
        "eligible_snapshot": audit.eligible_snapshot,
        "snapshot_hash": audit.snapshot_hash,
        "entropy": audit.entropy,
        "selection_hash": audit.selection_hash,
        "selected_index": audit.selected_index,
        "winning_number": audit.winning_number,
        "proof_url": audit.proof_url,
        "notes": audit.notes,
        "created_at": audit.created_at,
    }
