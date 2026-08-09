import logging
import httpx
from app.core.config import settings

logger = logging.getLogger("reading_club.whatsapp")


async def send_whatsapp_message(to_phone: str, text: str) -> bool:
    """Sends a text message via WhatsApp Business Cloud API.
    If WHATSAPP_API_TOKEN is not configured, logs the message locally.
    """
    if not settings.WHATSAPP_API_TOKEN or not settings.WHATSAPP_PHONE_NUMBER_ID:
        logger.info(f"[DEV MOCK] WhatsApp to {to_phone}: {text}")
        return True

    url = f"https://graph.facebook.com/v18.0/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
    headers = {
        "Authorization": f"Bearer {settings.WHATSAPP_API_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": to_phone,
        "type": "text",
        "text": {"body": text},
    }

    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(url, json=payload, headers=headers, timeout=10.0)
            if res.status_code == 200:
                logger.info(f"WhatsApp sent successfully to {to_phone}")
                return True
            else:
                logger.error(f"WhatsApp API error {res.status_code}: {res.text}")
                return False
    except Exception as e:
        logger.error(f"WhatsApp dispatch exception: {e}")
        return False
