from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from backend.app.database import SessionLocal, engine, Base
from backend.app.models.user import User, UserRole
from backend.app.models.tenant import Tenant
from backend.app.models.raffle import Raffle, RaffleStatus, DrawType
from backend.app.models.order import Order, OrderStatus
from backend.app.models.ticket import Ticket, TicketStatus
from backend.app.services.auth import get_password_hash
from backend.app.services.raffle_service import RaffleService

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        # Check if already seeded
        if db.query(User).filter(User.email == "admin@rifadigital.com").first():
            print("[Seed] Database already seeded.")
            return

        print("[Seed] Seeding database with initial data...")

        # 1. Super Admin
        admin_user = User(
            email="admin@rifadigital.com",
            hashed_password=get_password_hash("admin123"),
            full_name="Administrador Global",
            phone="11999999999",
            role=UserRole.SUPERADMIN.value,
            is_active=True
        )
        db.add(admin_user)

        # 2. Organizer 1: Prêmios do Victor
        org1_user = User(
            email="victor@rifas.com",
            hashed_password=get_password_hash("organizador123"),
            full_name="Victor Prêmios",
            phone="11987654321",
            role=UserRole.ORGANIZER.value,
            is_active=True
        )
        db.add(org1_user)
        db.flush()

        tenant1 = Tenant(
            user_id=org1_user.id,
            slug="premios-do-victor",
            name="Prêmios do Victor",
            bio="A maior plataforma de prêmios e sorteios auditados do Brasil! Mais de 100 ganhadores satisfeitos.",
            logo_url="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80",
            banner_url="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80",
            whatsapp="11987654321",
            instagram="@premiosdovictor",
            pix_key="11987654321",
            pix_key_type="TELEFONE",
            is_verified=True,
            available_balance=14250.0,
            total_sales_amount=15000.0
        )
        db.add(tenant1)
        db.flush()

        # 3. Organizer 2: AutoSonhos Rifas
        org2_user = User(
            email="contato@autosonhos.com",
            hashed_password=get_password_hash("organizador123"),
            full_name="AutoSonhos Brasil",
            phone="21998887766",
            role=UserRole.ORGANIZER.value,
            is_active=True
        )
        db.add(org2_user)
        db.flush()

        tenant2 = Tenant(
            user_id=org2_user.id,
            slug="autosonhos",
            name="AutoSonhos Rifas & Veículos",
            bio="Realizando o sonho do carro e da moto zero km toda semana. Sorteios baseados na Loteria Federal.",
            logo_url="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop&q=80",
            banner_url="https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=1200&auto=format&fit=crop&q=80",
            whatsapp="21998887766",
            instagram="@autosonhos.rifas",
            pix_key="contato@autosonhos.com",
            pix_key_type="EMAIL",
            is_verified=True,
            available_balance=28500.0,
            total_sales_amount=30000.0
        )
        db.add(tenant2)
        db.flush()

        # 4. Raffles
        raffle1 = Raffle(
            tenant_id=tenant1.id,
            title="Yamaha MT-03 ABS 2025 0km ou R$ 32.000 no PIX",
            slug="yamaha-mt-03-abs-2025-0km",
            description="Leve para casa uma Yamaha MT-03 0km com IPVA 2025 pago e frete grátis para todo o Brasil, ou escolha R$ 32.000,00 direto na sua conta via PIX no mesmo dia! Sorteio ao vivo auditado com base na extração da Loteria Federal.",
            category="Automóveis",
            images=[
                "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80"
            ],
            price_per_number=0.35,
            total_numbers=100000,
            min_purchase=5,
            max_purchase=5000,
            status=RaffleStatus.ACTIVE.value,
            draw_date=datetime.utcnow() + timedelta(days=14),
            draw_type=DrawType.FEDERAL.value,
            discount_combos=[
                {"quantity": 50, "discount_percentage": 14.28},  # R$ 15.00
                {"quantity": 100, "discount_percentage": 20.0},  # R$ 28.00
                {"quantity": 250, "discount_percentage": 25.0},  # R$ 65.62
                {"quantity": 500, "discount_percentage": 28.57}, # R$ 125.00
            ],
            lucky_numbers=[
                {"number": "00777", "prize": "R$ 500 no PIX", "winner_name": "Lucas Silva", "winner_phone": "1198****12", "claimed": True},
                {"number": "12345", "prize": "R$ 500 no PIX", "winner_name": None, "winner_phone": None, "claimed": False},
                {"number": "77777", "prize": "R$ 1.000 no PIX", "winner_name": None, "winner_phone": None, "claimed": False},
                {"number": "99999", "prize": "R$ 500 no PIX", "winner_name": None, "winner_phone": None, "claimed": False}
            ],
            ranking_prizes=[
                {"position": 1, "prize": "R$ 1.500 no PIX"},
                {"position": 2, "prize": "R$ 500 no PIX"},
                {"position": 3, "prize": "R$ 250 no PIX"}
            ],
            badge_text="🔥 MAIS VENDIDA",
            is_featured=True,
            sold_count=42150,
            reserved_count=1200
        )
        db.add(raffle1)

        raffle2 = Raffle(
            tenant_id=tenant1.id,
            title="iPhone 16 Pro Max 256GB Titânio + Apple Watch Series 10",
            slug="iphone-16-pro-max-256gb-apple-watch",
            description="Combo Apple dos Sonhos! iPhone 16 Pro Max 256GB lacrado com garantia de 1 ano Apple + Apple Watch Series 10 de 46mm, ou R$ 10.000,00 no PIX na hora.",
            category="Eletrônicos",
            images=[
                "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&auto=format&fit=crop&q=80"
            ],
            price_per_number=1.50,
            total_numbers=10000,
            min_purchase=1,
            max_purchase=500,
            status=RaffleStatus.ACTIVE.value,
            draw_date=datetime.utcnow() + timedelta(days=7),
            draw_type=DrawType.FEDERAL.value,
            discount_combos=[
                {"quantity": 10, "discount_percentage": 10.0},
                {"quantity": 25, "discount_percentage": 15.0},
                {"quantity": 50, "discount_percentage": 20.0},
            ],
            lucky_numbers=[
                {"number": "0010", "prize": "R$ 250 no PIX", "winner_name": None, "claimed": False},
                {"number": "0777", "prize": "R$ 500 no PIX", "winner_name": None, "claimed": False},
            ],
            ranking_prizes=[
                {"position": 1, "prize": "R$ 500 no PIX"}
            ],
            badge_text="⚡ QUASE ESGOTANDO",
            is_featured=True,
            sold_count=7800,
            reserved_count=350
        )
        db.add(raffle2)

        raffle3 = Raffle(
            tenant_id=tenant2.id,
            title="PIX Instantâneo de R$ 10.000 na Conta Hoje",
            slug="pix-instantaneo-10k-na-conta",
            description="Rifa relâmpago de apenas 1.000 cotas! R$ 10.000,00 no PIX transferido imediatamente após o sorteio para o ganhador.",
            category="Dinheiro / Pix",
            images=[
                "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop&q=80"
            ],
            price_per_number=12.00,
            total_numbers=1000,
            min_purchase=1,
            max_purchase=100,
            status=RaffleStatus.ACTIVE.value,
            draw_date=datetime.utcnow() + timedelta(days=3),
            draw_type=DrawType.AUTOMATIC.value,
            discount_combos=[
                {"quantity": 5, "discount_percentage": 5.0},
                {"quantity": 10, "discount_percentage": 10.0}
            ],
            lucky_numbers=[],
            ranking_prizes=[
                {"position": 1, "prize": "R$ 1.000 no PIX"}
            ],
            badge_text="🚀 SORTEIO RÁPIDO",
            is_featured=False,
            sold_count=650,
            reserved_count=80
        )
        db.add(raffle3)
        db.flush()

        # 5. Create some sample orders and buyers for Raffle 1 to populate Top Buyers Ranking
        sample_buyers = [
            ("Marcos Vinicius Pereira", "11991234567", 850, 238.0),
            ("Rodrigo Almeida Santos", "21987654321", 500, 140.0),
            ("Camila Fernandes Rocha", "31998881122", 300, 84.0),
            ("Bruno Henrique Costa", "41988776655", 200, 56.0),
            ("Patricia Souza Lima", "71992223344", 150, 42.0),
        ]

        for name, phone, qty, amount in sample_buyers:
            order = Order(
                raffle_id=raffle1.id,
                customer_name=name,
                customer_phone=phone,
                customer_email=f"{name.lower().split()[0]}@gmail.com",
                quantity=qty,
                unit_price=0.35,
                discount_amount=round((qty * 0.35) - amount, 2),
                total_amount=amount,
                platform_fee_percent=5.0,
                platform_fee_amount=round(amount * 0.05, 2),
                organizer_net_amount=round(amount * 0.95, 2),
                status=OrderStatus.PAID.value,
                payment_method="PIX",
                pix_txid=f"SEED_{phone[-6:]}",
                paid_at=datetime.utcnow() - timedelta(days=1),
                expires_at=datetime.utcnow() + timedelta(days=1)
            )
            db.add(order)

        db.commit()
        print("[Seed] Database successfully populated with initial admin, organizers, raffles, and simulated orders!")
    except Exception as e:
        db.rollback()
        print(f"[Seed] Error seeding database: {e}")
    finally:
        db.close()
