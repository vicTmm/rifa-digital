import base64
import hashlib
from typing import Optional

from cryptography.fernet import Fernet, InvalidToken

from backend.app.config import settings


class CredentialService:
    PREFIX = "enc:"

    @staticmethod
    def _fernet() -> Fernet:
        digest = hashlib.sha256(settings.CREDENTIAL_ENCRYPTION_KEY.encode("utf-8")).digest()
        return Fernet(base64.urlsafe_b64encode(digest))

    @classmethod
    def encrypt(cls, value: Optional[str]) -> Optional[str]:
        if not value or value.startswith(cls.PREFIX):
            return value
        encrypted = cls._fernet().encrypt(value.encode("utf-8")).decode("ascii")
        return f"{cls.PREFIX}{encrypted}"

    @classmethod
    def decrypt(cls, value: Optional[str]) -> Optional[str]:
        if not value or not value.startswith(cls.PREFIX):
            # Compatibility with credentials stored before encryption was introduced.
            return value
        try:
            return cls._fernet().decrypt(value[len(cls.PREFIX):].encode("ascii")).decode("utf-8")
        except InvalidToken as exc:
            raise ValueError("Não foi possível descriptografar a credencial armazenada") from exc
