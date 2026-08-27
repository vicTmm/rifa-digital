from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import asyncio
import os
from sqlalchemy import text

from backend.app.config import settings
from backend.app.seed import seed_database
from backend.app.database import SessionLocal
from backend.app.services.raffle_service import RaffleService
from backend.app.routers import auth, tenants, raffles, orders, tickets, admin

def cleanup_expired_orders() -> None:
    db = SessionLocal()
    try:
        RaffleService.cleanup_expired_orders(db)
    except Exception:
        db.rollback()
    finally:
        db.close()


async def expiration_worker() -> None:
    while True:
        await asyncio.sleep(settings.EXPIRED_ORDER_CLEANUP_INTERVAL_SECONDS)
        await asyncio.to_thread(cleanup_expired_orders)


@asynccontextmanager
async def lifespan(_: FastAPI):
    seed_database()
    cleanup_task = asyncio.create_task(expiration_worker())
    try:
        yield
    finally:
        cleanup_task.cancel()
        try:
            await cleanup_task
        except asyncio.CancelledError:
            pass


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API Completa para Plataforma Multi-Tenant / SaaS de Rifas Digitais com Mercado Pago PIX e Sorteio Auditável",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Uploads directory
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(tenants.router, prefix=settings.API_V1_STR)
app.include_router(raffles.router, prefix=settings.API_V1_STR)
app.include_router(orders.router, prefix=settings.API_V1_STR)
app.include_router(tickets.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "status": "online",
        "docs": "/docs",
        "version": "1.0.0"
    }


@app.get("/health", tags=["Operação"])
def health_check():
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    finally:
        db.close()
