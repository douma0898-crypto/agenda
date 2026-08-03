"""
Serviço de WhatsApp — estrutura preparada para a WhatsApp Cloud API (Meta).

Para ativar de verdade: crie um app no Meta for Developers, gere um token de
acesso e defina WHATSAPP_TOKEN e WHATSAPP_PHONE_ID no .env. Sem isso, as
chamadas apenas registram no log, para que o restante do sistema já funcione.
"""
import logging
import os

import requests

logger = logging.getLogger("agenda_api")


def is_configured() -> bool:
    return bool(os.getenv("WHATSAPP_TOKEN") and os.getenv("WHATSAPP_PHONE_ID"))


def send_whatsapp(to_number: str, message: str) -> bool:
    if not is_configured():
        logger.info("[WHATSAPP-DEV] (Cloud API não configurada) Para: %s | %s", to_number, message)
        return True

    try:
        phone_id = os.getenv("WHATSAPP_PHONE_ID")
        token = os.getenv("WHATSAPP_TOKEN")
        response = requests.post(
            f"https://graph.facebook.com/v20.0/{phone_id}/messages",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "messaging_product": "whatsapp",
                "to": to_number,
                "type": "text",
                "text": {"body": message},
            },
            timeout=10,
        )
        return response.status_code < 300
    except Exception:
        logger.exception("Falha ao enviar WhatsApp para %s", to_number)
        return False
