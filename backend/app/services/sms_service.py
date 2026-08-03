"""
Serviço de SMS — estrutura preparada para o provedor Twilio.

Para ativar de verdade: crie uma conta na Twilio, instale `twilio`
(`pip install twilio`) e defina TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN e
TWILIO_FROM_NUMBER no .env. Sem isso, as chamadas apenas registram no log,
para que o restante do sistema (configurações, UI) já funcione normalmente.
"""
import logging
import os

logger = logging.getLogger("agenda_api")


def is_configured() -> bool:
    return bool(os.getenv("TWILIO_ACCOUNT_SID") and os.getenv("TWILIO_AUTH_TOKEN") and os.getenv("TWILIO_FROM_NUMBER"))


def send_sms(to_number: str, message: str) -> bool:
    if not is_configured():
        logger.info("[SMS-DEV] (Twilio não configurado) Para: %s | %s", to_number, message)
        return True

    try:
        from twilio.rest import Client  # import tardio: dependência opcional

        client = Client(os.getenv("TWILIO_ACCOUNT_SID"), os.getenv("TWILIO_AUTH_TOKEN"))
        client.messages.create(body=message, from_=os.getenv("TWILIO_FROM_NUMBER"), to=to_number)
        return True
    except ModuleNotFoundError:
        logger.warning("SMS configurado, mas o pacote 'twilio' não está instalado. Rode: pip install twilio")
        return False
    except Exception:
        logger.exception("Falha ao enviar SMS para %s", to_number)
        return False
