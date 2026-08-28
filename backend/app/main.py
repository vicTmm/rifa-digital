from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
from sqlalchemy import text
from slowapi.errors import RateLimitExceeded

from backend.app.config import settings
from backend.app.seed import seed_database
from backend.app.database import SessionLocal
from backend.app.routers import auth, tenants, raffles, orders, tickets, admin, uploads
from backend.app.services.rate_limit import limiter

@asynccontextmanager
async def lifespan(_: FastAPI):
    seed_database()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API Completa para Plataforma Multi-Tenant / SaaS de Rifas Digitais com Mercado Pago PIX e Sorteio Auditável",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(_, __):
    return JSONResponse(
        status_code=429,
        content={"detail": "Muitas solicitações. Aguarde antes de tentar novamente."},
        headers={"Retry-After": "60"},
    )

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rejeita Host manipulado antes de chegar aos routers. O curinga só deve ser
# usado deliberadamente em ambiente local (e é rejeitado pela validação de produção).
app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.ALLOWED_HOSTS)


@app.middleware("http")
async def security_headers(request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
    response.headers.setdefault("Content-Security-Policy", "default-src 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'")
    if settings.is_production:
        response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    return response

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
app.include_router(uploads.router, prefix=settings.API_V1_STR)

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
