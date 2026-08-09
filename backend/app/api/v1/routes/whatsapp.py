import logging
from fastapi import APIRouter, Query, Response, HTTPException, status
from app.core.config import settings

logger = logging.getLogger("reading_club.whatsapp_webhook")

router = APIRouter(prefix="/whatsapp", tags=["WhatsApp"])


@router.get("/webhook")
async def verify_webhook(
    mode: str = Query(..., alias="hub.mode"),
    token: str = Query(..., alias="hub.verify_token"),
    challenge: str = Query(..., alias="hub.challenge")
):
    """Meta Webhook verification endpoint."""
    verify_token = getattr(settings, "WHATSAPP_VERIFY_TOKEN", "reading_club_secret_token")
    if mode == "subscribe" and token == verify_token:
        logger.info("WhatsApp webhook verified successfully")
        return Response(content=challenge, media_type="text/plain")
    else:
        logger.warning("WhatsApp webhook verification failed")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Verification failed")


@router.post("/webhook")
async def receive_webhook(payload: dict):
    """Meta Webhook payload listener."""
    logger.info(f"Received WhatsApp webhook payload: {payload}")
    return {"status": "ok"}
