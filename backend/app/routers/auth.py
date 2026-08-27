from fastapi import APIRouter, Depends, HTTPException, Request, status
from datetime import datetime, timedelta
import hashlib
import secrets
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User, UserRole
from backend.app.models.tenant import Tenant
from backend.app.schemas.user import UserRegister, UserLogin, UserResponse, Token, PasswordResetRequest, PasswordResetConfirm
from backend.app.services.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user
)
import re
from backend.app.config import settings
from backend.app.services.rate_limit import limiter

router = APIRouter(prefix="/auth", tags=["Autenticação"])

def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()

def generate_slug(text: str) -> str:
    slug = text.lower().strip()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[\s_-]+', '-', slug)
    slug = re.sub(r'^-+|-+$', '', slug)
    return slug

@router.post("/register", response_model=Token)
@limiter.limit(settings.AUTH_REGISTER_RATE_LIMIT)
def register_user(request: Request, payload: UserRegister, db: Session = Depends(get_db)):
    # Check if email exists
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este e-mail já está cadastrado no sistema."
        )
    
    role = UserRole.ORGANIZER.value if payload.role == "ORGANIZER" else UserRole.CUSTOMER.value
    
    new_user = User(
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
        phone=payload.phone,
        cpf=payload.cpf,
        role=role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # If registered as Organizer, automatically create a default Tenant profile
    if role == UserRole.ORGANIZER.value:
        base_slug = generate_slug(new_user.full_name) or f"organizador-{new_user.id}"
        slug = base_slug
        counter = 1
        while db.query(Tenant).filter(Tenant.slug == slug).first():
            slug = f"{base_slug}-{counter}"
            counter += 1
            
        tenant = Tenant(
            user_id=new_user.id,
            slug=slug,
            name=new_user.full_name,
            whatsapp=new_user.phone
        )
        db.add(tenant)
        db.commit()
        
    access_token = create_access_token(data={"sub": str(new_user.id), "role": new_user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user
    }

@router.post("/login", response_model=Token)
@limiter.limit(settings.AUTH_LOGIN_RATE_LIMIT)
def login(request: Request, payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos."
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Conta desativada. Entre em contato com o suporte."
        )
        
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tenant_info = None
    if current_user.tenant:
        t = current_user.tenant
        tenant_info = {
            "id": t.id,
            "slug": t.slug,
            "name": t.name,
            "bio": t.bio,
            "logo_url": t.logo_url,
            "banner_url": t.banner_url,
            "whatsapp": t.whatsapp,
            "instagram": t.instagram,
            "pix_key": t.pix_key,
            "is_verified": t.is_verified,
            "available_balance": t.available_balance or 0.0,
            "total_sales_amount": t.total_sales_amount or 0.0
        }
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "phone": current_user.phone,
        "cpf": current_user.cpf,
        "role": current_user.role,
        "avatar_url": current_user.avatar_url,
        "tenant": tenant_info
    }

@router.post("/request-password-reset")
@limiter.limit("3/hour")
def request_password_reset(request: Request, payload: PasswordResetRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    token = secrets.token_urlsafe(32)
    if user and user.is_active:
        user.password_reset_token_hash = _token_hash(token)
        user.password_reset_expires_at = datetime.utcnow() + timedelta(minutes=30)
        db.commit()
    result = {"detail": "Se o e-mail estiver cadastrado, enviaremos instruções de recuperação."}
    if user and settings.ENVIRONMENT.lower() in {"development", "test", "sandbox"}:
        result["debug_token"] = token
    return result

@router.post("/reset-password")
def reset_password(payload: PasswordResetConfirm, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.password_reset_token_hash == _token_hash(payload.token)).first()
    if not user or not user.password_reset_expires_at or user.password_reset_expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Token inválido ou expirado.")
    user.hashed_password = get_password_hash(payload.new_password)
    user.password_reset_token_hash = user.password_reset_expires_at = None
    db.commit()
    return {"detail": "Senha redefinida com sucesso."}

@router.post("/request-email-verification")
@limiter.limit("3/hour")
def request_email_verification(request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    token = secrets.token_urlsafe(32)
    current_user.email_verification_token_hash = _token_hash(token)
    current_user.email_verification_expires_at = datetime.utcnow() + timedelta(minutes=30)
    db.commit()
    result = {"detail": "Se a conta estiver elegível, enviaremos instruções de verificação."}
    if settings.ENVIRONMENT.lower() in {"development", "test", "sandbox"}:
        result["debug_token"] = token
    return result

@router.post("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email_verification_token_hash == _token_hash(token)).first()
    if not user or not user.email_verification_expires_at or user.email_verification_expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Token inválido ou expirado.")
    user.email_verified_at = datetime.utcnow()
    user.email_verification_token_hash = user.email_verification_expires_at = None
    db.commit()
    return {"detail": "E-mail verificado com sucesso."}
