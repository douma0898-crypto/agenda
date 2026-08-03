"""
Serviço de Push Notification (Web Push API).

Estrutura pronta para envio real: basta configurar as chaves VAPID e instalar
`pywebpush` (`pip install pywebpush`). Sem isso, o envio é apenas registrado
no log — o cadastro/gerenciamento das inscrições (subscriptions) já funciona
normalmente, então nada quebra enquanto o provedor não é configurado.
"""
import json
import logging
import os

logger = logging.getLogger("agenda_api")


def is_configured() -> bool:
    return bool(os.getenv("VAPID_PRIVATE_KEY") and os.getenv("VAPID_PUBLIC_KEY"))


def get_vapid_public_key() -> str | None:
    return os.getenv("VAPID_PUBLIC_KEY")


def send_push(subscription, title: str, body: str, url: str | None = None) -> bool:
    """Envia uma push notification para uma inscrição salva. `subscription` é
    um PushSubscription (model) ou dict com endpoint/keys."""
    payload = json.dumps({"title": title, "body": body, "url": url or "/"})

    if not is_configured():
        logger.info("[PUSH-DEV] (VAPID não configurado) %s: %s", title, body)
        return True

    try:
        from pywebpush import webpush, WebPushException  # import tardio: dependência opcional

        endpoint = subscription.endpoint if hasattr(subscription, "endpoint") else subscription["endpoint"]
        p256dh = subscription.p256dh if hasattr(subscription, "p256dh") else subscription.get("keys", {}).get("p256dh")
        auth = subscription.auth if hasattr(subscription, "auth") else subscription.get("keys", {}).get("auth")

        webpush(
            subscription_info={"endpoint": endpoint, "keys": {"p256dh": p256dh, "auth": auth}},
            data=payload,
            vapid_private_key=os.getenv("VAPID_PRIVATE_KEY"),
            vapid_claims={"sub": f"mailto:{os.getenv('SMTP_FROM', 'no-reply@agenda.app')}"},
        )
        return True
    except ModuleNotFoundError:
        logger.warning("Push configurado, mas 'pywebpush' não está instalado. Rode: pip install pywebpush")
        return False
    except Exception:
        logger.exception("Falha ao enviar push notification")
        return False
