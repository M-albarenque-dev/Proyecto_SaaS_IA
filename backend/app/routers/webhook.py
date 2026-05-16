from fastapi import APIRouter, Request, Response
from twilio.twiml.messaging_response import MessagingResponse
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/webhook/whatsapp")
async def whatsapp_webhook(request: Request):
    form_data = await request.form()
    incoming_msg = form_data.get("Body", "").strip()
    from_number = form_data.get("From", "")
    num_media = form_data.get("NumMedia", "0")

    logger.info(f"[WEBHOOK] De: {from_number} | Mensaje: {incoming_msg} | Media: {num_media}")

    resp = MessagingResponse()
    resp.message(f"✅ TurnoIA recibió tu mensaje: '{incoming_msg}'. Pronto podrás reservar turnos por acá.")

    return Response(content=str(resp), media_type="application/xml")
