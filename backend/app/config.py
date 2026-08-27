import os
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    ENVIRONMENT: str = "development"
    PROJECT_NAME: str = "Rifa Digital - Plataforma Multi-Tenant"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "supersecret_rifa_digital_jwt_key_development_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = "sqlite:///./rifa_digital.db"
    
    # Platform settings
    DEFAULT_PLATFORM_FEE_PERCENT: float = 5.0 # 5% default fee
    ORDER_RESERVATION_MINUTES: int = 15 # 15 min to pay PIX
    EXPIRED_ORDER_CLEANUP_INTERVAL_SECONDS: int = 60
    
    # Mercado Pago
    MERCADO_PAGO_ACCESS_TOKEN: str = "TEST-MERCADOPAGO-ACCESS-TOKEN-MOCK"
    ENABLE_PAYMENT_SIMULATOR: bool = True
    MERCADO_PAGO_WEBHOOK_SECRET: str = ""
    CREDENTIAL_ENCRYPTION_KEY: str = "development-only-credential-key"
    
    # Uploads
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"

    @model_validator(mode="after")
    def validate_production_security(self):
        if self.is_production:
            if self.SECRET_KEY == "supersecret_rifa_digital_jwt_key_development_2026":
                raise ValueError("SECRET_KEY deve ser configurada em produção")
            if not self.MERCADO_PAGO_WEBHOOK_SECRET:
                raise ValueError("MERCADO_PAGO_WEBHOOK_SECRET deve ser configurado em produção")
            if self.CREDENTIAL_ENCRYPTION_KEY == "development-only-credential-key":
                raise ValueError("CREDENTIAL_ENCRYPTION_KEY deve ser configurada em produção")
            self.ENABLE_PAYMENT_SIMULATOR = False
        return self

settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
