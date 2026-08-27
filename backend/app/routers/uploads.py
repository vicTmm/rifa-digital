import io
import os
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from PIL import Image, UnidentifiedImageError
from PIL import ImageFile

from backend.app.config import settings
from backend.app.models.user import User
from backend.app.services.auth import get_current_active_user

router = APIRouter(prefix="/uploads", tags=["Uploads"])

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": (".jpg", "JPEG"),
    "image/png": (".png", "PNG"),
    "image/webp": (".webp", "WEBP"),
}
MAX_FILE_SIZE = 10 * 1024 * 1024
MAX_IMAGE_PIXELS = 25_000_000
Image.MAX_IMAGE_PIXELS = MAX_IMAGE_PIXELS
ImageFile.LOAD_TRUNCATED_IMAGES = False


@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
):
    """Stores an authenticated, verified raster image of at most 10 MB."""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Formato não suportado. Use JPG, PNG ou WEBP.")

    content = await file.read(MAX_FILE_SIZE + 1)
    size = len(content)
    if size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="O arquivo excede o limite máximo de 10 MB.")

    extension, expected_format = ALLOWED_IMAGE_TYPES[file.content_type]
    try:
        with Image.open(io.BytesIO(content)) as image:
            image.verify()
            detected_format = (image.format or "").upper()
            width, height = image.size
            if width * height > MAX_IMAGE_PIXELS:
                raise HTTPException(status_code=400, detail="Dimensões da imagem excedem o limite permitido.")
    except HTTPException:
        raise
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError):
        raise HTTPException(status_code=400, detail="Arquivo de imagem inválido ou corrompido.")

    if detected_format != expected_format:
        raise HTTPException(status_code=400, detail="Conteúdo não corresponde ao formato informado.")

    filename = f"{uuid.uuid4().hex}{extension}"
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    try:
        with open(file_path, "xb") as buffer:
            buffer.write(content)
    except OSError:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail="Erro ao armazenar imagem.")

    return {
        "url": f"/uploads/{filename}",
        "filename": filename,
        "content_type": file.content_type,
        "size_bytes": size,
    }
