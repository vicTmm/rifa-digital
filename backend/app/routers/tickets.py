from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.database import get_db
from backend.app.models.raffle import Raffle
from backend.app.models.order import Order, OrderStatus
from backend.app.models.ticket import Ticket, TicketStatus
from backend.app.schemas.ticket import CustomerRaffleTickets, TicketPublic
from backend.app.services.raffle_service import RaffleService
from backend.app.routers.orders import validate_order_access
from backend.app.config import settings
from backend.app.services.rate_limit import limiter

router = APIRouter(prefix="/tickets", tags=["Bilhetes e Consulta"])

@router.get("/raffle/{raffle_id}/grid")
def get_raffle_number_grid(raffle_id: int, db: Session = Depends(get_db)):
    """Returns occupied numbers status and lucky numbers for the interactive manual number selector"""
    RaffleService.cleanup_expired_orders(db, raffle_id)
    
    raffle = db.query(Raffle).filter(Raffle.id == raffle_id).first()
    if not raffle:
        raise HTTPException(status_code=404, detail="Rifa não encontrada.")
        
    taken_tickets = db.query(Ticket).filter(Ticket.raffle_id == raffle_id).all()
    
    occupied_map = {}
    for t in taken_tickets:
        occupied_map[t.number_str] = {
            "status": t.status, # RESERVED, PAID
            "is_lucky": t.is_lucky_number,
            "lucky_claimed": t.lucky_prize_claimed
        }
        
    lucky_numbers_list = [l.get("number") for l in (raffle.lucky_numbers or [])]
    
    return {
        "total_numbers": raffle.total_numbers,
        "padding": RaffleService.get_number_padding(raffle.total_numbers),
        "occupied_map": occupied_map,
        "lucky_numbers": lucky_numbers_list
    }

@router.get("/my-tickets", response_model=List[CustomerRaffleTickets])
@limiter.limit(settings.ORDER_LOOKUP_RATE_LIMIT)
def search_my_tickets(
    request: Request,
    order_id: int = Query(..., gt=0, description="Identificador do pedido"),
    order_token: Optional[str] = Header(None, alias="X-Order-Token"),
    db: Session = Depends(get_db),
):
    """Return one order only after verifying its unguessable access token."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado.")
    validate_order_access(order, order_token)

    results = []
    for o in [order]:
        if not o.raffle:
            continue
        tickets = db.query(Ticket).filter(Ticket.order_id == o.id).all()
        ticket_numbers = [t.number_str for t in tickets]
        lucky_prizes = [
            {"number": t.number_str, "prize": t.lucky_prize}
            for t in tickets if t.is_lucky_number
        ]
        
        results.append({
            "raffle_id": o.raffle.id,
            "raffle_title": o.raffle.title,
            "raffle_slug": o.raffle.slug,
            "raffle_image": o.raffle.images[0] if o.raffle.images else None,
            "raffle_status": o.raffle.status,
            "draw_date": o.raffle.draw_date,
            "order_id": o.id,
            "order_status": o.status,
            "total_amount": o.total_amount,
            "paid_at": o.paid_at,
            "tickets": ticket_numbers,
            "lucky_prizes": lucky_prizes
        })
        
    return results
