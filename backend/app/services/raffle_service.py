import random
from typing import List, Tuple, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from backend.app.models.raffle import Raffle, RaffleStatus, DrawType
from backend.app.models.order import Order, OrderStatus
from backend.app.models.ticket import Ticket, TicketStatus
from backend.app.models.tenant import Tenant
from backend.app.config import settings
from backend.app.models.financial import LedgerEntryType
from backend.app.services.financial import FinancialService, money

class RaffleService:
    @staticmethod
    def get_number_padding(total_numbers: int) -> int:
        """Determines string padding width for raffle numbers (e.g. 100 -> 2, 1000 -> 3, 100000 -> 5)"""
        return len(str(total_numbers - 1))

    @classmethod
    def format_number(cls, num: int, total_numbers: int) -> str:
        pad = cls.get_number_padding(total_numbers)
        return str(num).zfill(pad)

    @classmethod
    def calculate_order_price(cls, raffle: Raffle, quantity: int) -> Tuple[float, float, float]:
        """
        Calculates: (unit_price, discount_amount, total_amount)
        Applies highest applicable combo discount.
        """
        unit_price = raffle.price_per_number
        base_total = quantity * unit_price
        
        # Check discount combos
        best_discount_percent = 0.0
        if raffle.discount_combos:
            for combo in sorted(raffle.discount_combos, key=lambda x: x.get("quantity", 0), reverse=True):
                if quantity >= combo.get("quantity", 0):
                    best_discount_percent = combo.get("discount_percentage", 0.0)
                    break
        
        discount_amount = round(base_total * (best_discount_percent / 100.0), 2)
        total_amount = round(base_total - discount_amount, 2)
        return unit_price, discount_amount, total_amount

    @classmethod
    def cleanup_expired_orders(cls, db: Session, raffle_id: Optional[int] = None, commit: bool = True):
        """Releases reserved tickets for expired pending orders"""
        now = datetime.utcnow()
        query = db.query(Order).filter(
            Order.status == OrderStatus.PENDING.value,
            Order.expires_at < now
        )
        if raffle_id:
            query = query.filter(Order.raffle_id == raffle_id)
            
        expired_orders = query.all()
        for order in expired_orders:
            order.status = OrderStatus.EXPIRED.value
            # Remove reserved tickets
            db.query(Ticket).filter(Ticket.order_id == order.id, Ticket.status == TicketStatus.RESERVED.value).delete()
            # Update raffle cached counter
            if order.raffle:
                order.raffle.reserved_count = max(0, (order.raffle.reserved_count or 0) - order.quantity)
        
        if expired_orders and commit:
            db.commit()

    @classmethod
    def allocate_tickets(
        cls,
        db: Session,
        raffle: Raffle,
        quantity: int,
        manual_numbers: Optional[List[str]] = None,
        customer_name: str = "",
        customer_phone: str = ""
    ) -> List[int]:
        """
        Allocates specific or random available numbers for this reservation.
        Prevents race conditions using atomic uniqueness.
        """
        cls.cleanup_expired_orders(db, raffle.id)
        
        # Fetch all currently reserved or paid number integers for this raffle
        taken_numbers_query = db.query(Ticket.number_int).filter(Ticket.raffle_id == raffle.id).all()
        taken_numbers = {row[0] for row in taken_numbers_query}
        
        selected_numbers: List[int] = []
        
        if manual_numbers and len(manual_numbers) > 0:
            if len(manual_numbers) != quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Quantidade selecionada ({len(manual_numbers)}) diferente do pedido ({quantity})"
                )
            for num_str in manual_numbers:
                try:
                    num_int = int(num_str)
                except ValueError:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Número inválido: {num_str}"
                    )
                if num_int < 0 or num_int >= raffle.total_numbers:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Número fora do intervalo (0 a {raffle.total_numbers - 1}): {num_str}"
                    )
                if num_int in taken_numbers:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=f"O número {num_str} já foi reservado ou comprado por outro usuário."
                    )
                selected_numbers.append(num_int)
        else:
            # Automatic random allocation
            available_count = raffle.total_numbers - len(taken_numbers)
            if available_count < quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Apenas {available_count} cotas disponíveis no momento."
                )
            
            # Efficient random picking
            all_available = [n for n in range(raffle.total_numbers) if n not in taken_numbers]
            selected_numbers = random.sample(all_available, quantity)
            
        return selected_numbers

    @classmethod
    def confirm_payment(cls, db: Session, order: Order, commit: bool = True) -> Tuple[bool, List[Dict[str, Any]]]:
        """
        Confirms order payment:
        1. Updates Order to PAID
        2. Updates Tickets to PAID
        3. Checks if any ticket is a Cotas Premiadas (Lucky Number)
        4. Credits Tenant balance (less platform fee)
        5. Updates Raffle sold count
        """
        if order.status == OrderStatus.PAID.value:
            return True, []
        if order.status != OrderStatus.PENDING.value or order.expires_at < datetime.utcnow():
            return False, []
            
        raffle = db.query(Raffle).filter(Raffle.id == order.raffle_id).first()
        if not raffle:
            return False, []
            
        now = datetime.utcnow()
        order.status = OrderStatus.PAID.value
        order.paid_at = now
        
        # Calculate fees
        tenant = db.query(Tenant).filter(Tenant.id == raffle.tenant_id).first()
        fee_percent = tenant.custom_fee_percent if (tenant and tenant.custom_fee_percent is not None) else settings.DEFAULT_PLATFORM_FEE_PERCENT
        fee_amount = round(order.total_amount * (fee_percent / 100.0), 2)
        net_amount = round(order.total_amount - fee_amount, 2)
        
        order.platform_fee_percent = fee_percent
        order.platform_fee_amount = fee_amount
        order.organizer_net_amount = net_amount
        
        # Update Tenant Balance
        if tenant:
            tenant.available_balance = float(money(tenant.available_balance) + money(net_amount))
            tenant.total_sales_amount = float(money(tenant.total_sales_amount) + money(order.total_amount))
            FinancialService.add_ledger_entry(
                db,
                tenant_id=tenant.id,
                order_id=order.id,
                entry_type=LedgerEntryType.SALE_CREDIT,
                amount=net_amount,
                balance_after=tenant.available_balance,
                description=f"Crédito líquido da venda #{order.id}",
                idempotency_key=f"sale-credit:{order.id}",
            )
            
        # Update tickets & Check Cotas Premiadas
        lucky_prizes_won = []
        lucky_numbers_map = {item.get("number"): item for item in (raffle.lucky_numbers or [])}
        
        tickets = db.query(Ticket).filter(Ticket.order_id == order.id).all()
        if len(tickets) != order.quantity or any(t.status != TicketStatus.RESERVED.value for t in tickets):
            return False, []
        for ticket in tickets:
            ticket.status = TicketStatus.PAID.value
            if ticket.number_str in lucky_numbers_map:
                lucky_info = lucky_numbers_map[ticket.number_str]
                ticket.is_lucky_number = True
                ticket.lucky_prize = lucky_info.get("prize")
                lucky_info["winner_name"] = order.customer_name
                lucky_info["winner_phone"] = order.customer_phone[:4] + "****" + order.customer_phone[-2:] if order.customer_phone else ""
                lucky_info["claimed"] = True
                lucky_prizes_won.append({
                    "number": ticket.number_str,
                    "prize": lucky_info.get("prize")
                })
                
        # Re-save lucky numbers on raffle
        raffle.lucky_numbers = list(lucky_numbers_map.values())
        
        # Update counters
        raffle.sold_count = (raffle.sold_count or 0) + order.quantity
        raffle.reserved_count = max(0, (raffle.reserved_count or 0) - order.quantity)
        
        if commit:
            db.commit()
        return True, lucky_prizes_won

    @classmethod
    def get_top_buyers(cls, db: Session, raffle_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        """Calculates Top Buyers ranking for a raffle"""
        results = (
            db.query(
                Order.customer_name,
                Order.customer_phone,
                func.sum(Order.quantity).label("total_tickets")
            )
            .filter(Order.raffle_id == raffle_id, Order.status == OrderStatus.PAID.value)
            .group_by(Order.customer_phone, Order.customer_name)
            .order_by(func.sum(Order.quantity).desc())
            .limit(limit)
            .all()
        )
        
        raffle = db.query(Raffle).filter(Raffle.id == raffle_id).first()
        ranking_prizes_map = {p.get("position"): p.get("prize") for p in (raffle.ranking_prizes or [])} if raffle else {}
        
        top_list = []
        for idx, row in enumerate(results, 1):
            phone = row.customer_phone or ""
            masked_phone = f"({phone[:2]}) 9****-{phone[-4:]}" if len(phone) >= 10 else phone
            top_list.append({
                "position": idx,
                "customer_name": row.customer_name,
                "masked_phone": masked_phone,
                "total_tickets": int(row.total_tickets or 0),
                "prize_description": ranking_prizes_map.get(idx)
            })
        return top_list
