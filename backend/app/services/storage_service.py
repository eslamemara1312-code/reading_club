import os
import uuid
import secrets
from pathlib import Path
from typing import Tuple
import httpx
from fastapi import HTTPException, status
from app.core.config import settings

MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB
ALLOWED_MIME_TYPES = {"application/pdf"}
PDF_MAGIC_BYTES = b"%PDF-"
BUCKET_NAME = "book-assets"
LOCAL_UPLOADS_DIR = Path("uploads/book-assets")

# In-memory store for local signed stream tokens (token -> (file_path, expiry_timestamp))
_local_stream_tokens = {}


def validate_pdf_file(filename: str, content: bytes, content_type: str) -> None:
    if not filename or not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files (.pdf) are allowed."
        )

    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is empty."
        )

    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum allowed limit of 50 MB (uploaded {len(content)} bytes)."
        )

    if content_type and content_type.lower() not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported media type. Declared Content-Type must be application/pdf."
        )

    if not content.startswith(PDF_MAGIC_BYTES):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid file signature. File contents are not a valid PDF document."
        )


def is_supabase_configured() -> bool:
    return bool(settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY)


async def upload_asset_object(storage_key: str, content: bytes, mime_type: str = "application/pdf") -> str:
    if is_supabase_configured():
        url = f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/{BUCKET_NAME}/{storage_key.lstrip('/')}"
        headers = {
            "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
            "ApiKey": settings.SUPABASE_SERVICE_ROLE_KEY,
            "Content-Type": mime_type,
            "x-upsert": "true"
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, content=content, headers=headers)
            if resp.status_code not in (200, 201):
                # Try creating bucket if missing
                if resp.status_code == 404:
                    bucket_url = f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/bucket"
                    await client.post(
                        bucket_url,
                        json={"id": BUCKET_NAME, "name": BUCKET_NAME, "public": False},
                        headers={"Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}", "ApiKey": settings.SUPABASE_SERVICE_ROLE_KEY}
                    )
                    resp = await client.post(url, content=content, headers=headers)

                if resp.status_code not in (200, 201):
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Failed to upload asset to object storage: {resp.text}"
                    )
        return storage_key
    else:
        # Local fallback mode
        file_path = LOCAL_UPLOADS_DIR / storage_key.replace("/", "_")
        file_path.parent.mkdir(parents=True, exist_ok=True)
        with open(file_path, "wb") as f:
            f.write(content)
        return storage_key


async def delete_asset_object(storage_key: str) -> None:
    if is_supabase_configured():
        url = f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/{BUCKET_NAME}"
        headers = {
            "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
            "ApiKey": settings.SUPABASE_SERVICE_ROLE_KEY,
            "Content-Type": "application/json"
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            await client.delete(url, json={"prefixes": [storage_key.lstrip('/')]}, headers=headers)
    else:
        file_path = LOCAL_UPLOADS_DIR / storage_key.replace("/", "_")
        if file_path.exists():
            try:
                os.remove(file_path)
            except OSError:
                pass


async def generate_signed_reader_url(storage_key: str, expires_in_seconds: int = 900) -> str:
    if is_supabase_configured():
        url = f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/sign/{BUCKET_NAME}/{storage_key.lstrip('/')}"
        headers = {
            "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
            "ApiKey": settings.SUPABASE_SERVICE_ROLE_KEY,
            "Content-Type": "application/json"
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json={"expiresIn": expires_in_seconds}, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                signed_path = data.get("signedURL") or data.get("signedUrl")
                if signed_path:
                    if signed_path.startswith("http"):
                        return signed_path
                    return f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1{signed_path}"

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate signed URL from storage provider"
        )
    else:
        # Generate temporary token for local stream route
        import time
        token = secrets.token_urlsafe(24)
        file_path = LOCAL_UPLOADS_DIR / storage_key.replace("/", "_")
        _local_stream_tokens[token] = (str(file_path), time.time() + expires_in_seconds)
        return f"/api/v1/reader/stream/{token}"


def get_local_stream_file(token: str) -> str:
    import time
    item = _local_stream_tokens.get(token)
    if not item:
        raise HTTPException(status_code=404, detail="Stream token invalid or expired")
    file_path_str, expiry = item
    if time.time() > expiry:
        _local_stream_tokens.pop(token, None)
        raise HTTPException(status_code=410, detail="Stream token expired")
    if not os.path.exists(file_path_str):
        raise HTTPException(status_code=404, detail="File asset not found")
    return file_path_str
