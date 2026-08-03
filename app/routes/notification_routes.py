from datetime import datetime, timedelta

from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.extensions import db
from app.models import Notification, Event, PushSubscription
from app.middlewares.auth_middleware import get_current_user
from app.services import email_service, push_service, sms_service, whatsapp_service
from app.utils.responses import success, ApiError
from app.utils.validators import require_fields

notification_bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")


def dispatch_notification(user, title: str, message: str) -> dict:
    """Envia a notificação por todos os canais habilitados nas preferências do usuário.
    Retorna um relatório por canal, útil para diagnosticar falhas reais de envio."""
    report = {}

    if user.notify_email:
        ok, detail = email_service.send_generic_notification_email(user.email, title, message)
        report["email"] = {"attempted": True, "success": ok, "detail": detail}
    else:
        report["email"] = {"attempted": False}

    if user.notify_push:
        subs = PushSubscription.query.filter_by(user_id=user.id).all()
        if subs:
            results = [push_service.send_push(sub, title, message) for sub in subs]
            report["push"] = {"attempted": True, "success": all(results), "detail": f"{sum(results)}/{len(results)} dispositivo(s)"}
        else:
            report["push"] = {"attempted": True, "success": False, "detail": "Nenhum dispositivo inscrito neste navegador"}
    else:
        report["push"] = {"attempted": False}

    if user.notify_sms and user.phone_number:
        ok = sms_service.send_sms(user.phone_number, f"{title}: {message}")
        report["sms"] = {"attempted": True, "success": ok, "detail": "Enviado" if ok else "Falha ao enviar"}
    else:
        report["sms"] = {"attempted": False}

    if user.notify_whatsapp and user.phone_number:
        ok = whatsapp_service.send_whatsapp(user.phone_number, f"{title}: {message}")
        report["whatsapp"] = {"attempted": True, "success": ok, "detail": "Enviado" if ok else "Falha ao enviar"}
    else:
        report["whatsapp"] = {"attempted": False}

    return report


@notification_bp.get("")
@jwt_required()
def list_notifications():
    user = get_current_user()

    # Gera notificações para lembretes de eventos que estão prestes a disparar
    # (dentro da janela de tempo do lembrete) e ainda não têm notificação criada.
    now = datetime.utcnow()
    upcoming_events = user.events.filter(Event.start_at.between(now, now + timedelta(days=7))).all()

    for event in upcoming_events:
        for reminder in event.reminders:
            if reminder.triggered:
                continue
            trigger_time = event.start_at - timedelta(minutes=reminder.minutes_before)
            if trigger_time <= now:
                already = Notification.query.filter_by(user_id=user.id, reference_id=reminder.id).first()
                if not already:
                    title = f"Lembrete: {event.title}"
                    message = (
                        f"Seu evento \"{event.title}\" começa às {event.start_at.strftime('%H:%M')} de "
                        f"{event.start_at.strftime('%d/%m/%Y')}."
                    )
                    db.session.add(Notification(
                        user_id=user.id, title=title,
                        message=f"Começa às {event.start_at.strftime('%H:%M')}",
                        type="reminder", reference_id=reminder.id,
                    ))
                    dispatch_notification(user, title, message)
                reminder.triggered = True
    db.session.commit()

    unread_only = request.args.get("unread") == "true"
    query = Notification.query.filter_by(user_id=user.id)
    if unread_only:
        query = query.filter_by(read=False)

    notifications = query.order_by(Notification.created_at.desc()).limit(50).all()
    return success(
        [n.to_dict() for n in notifications],
        meta={"unreadCount": Notification.query.filter_by(user_id=user.id, read=False).count()},
    )


@notification_bp.patch("/<string:notification_id>/read")
@jwt_required()
def mark_read(notification_id):
    user = get_current_user()
    notification = Notification.query.filter_by(id=notification_id, user_id=user.id).first()
    if not notification:
        raise ApiError("Notificação não encontrada", status=404)

    notification.read = True
    db.session.commit()
    return success(notification.to_dict())


@notification_bp.patch("/read-all")
@jwt_required()
def mark_all_read():
    user = get_current_user()
    Notification.query.filter_by(user_id=user.id, read=False).update({"read": True})
    db.session.commit()
    return success(message="Todas as notificações foram marcadas como lidas")


@notification_bp.delete("/<string:notification_id>")
@jwt_required()
def delete_notification(notification_id):
    user = get_current_user()
    notification = Notification.query.filter_by(id=notification_id, user_id=user.id).first()
    if not notification:
        raise ApiError("Notificação não encontrada", status=404)

    db.session.delete(notification)
    db.session.commit()
    return success(message="Notificação removida")


# --------------------------------------------------------- Preferências ---

@notification_bp.get("/settings")
@jwt_required()
def get_notification_settings():
    user = get_current_user()
    return success(user.notification_settings_dict())


@notification_bp.put("/settings")
@jwt_required()
def update_notification_settings():
    user = get_current_user()
    payload = request.get_json(silent=True) or {}

    for field, attr in [
        ("email", "notify_email"), ("push", "notify_push"), ("desktop", "notify_desktop"),
        ("sms", "notify_sms"), ("whatsapp", "notify_whatsapp"), ("vibration", "notify_vibration"),
    ]:
        if field in payload:
            setattr(user, attr, bool(payload[field]))

    if "sound" in payload:
        user.notify_sound = payload["sound"]
    if "phoneNumber" in payload:
        user.phone_number = payload["phoneNumber"]

    db.session.commit()
    return success(user.notification_settings_dict(), "Preferências de notificação atualizadas")


@notification_bp.get("/channels/status")
@jwt_required()
def channels_status():
    return success({
        "email": True,  # sempre disponível (com fallback de log em dev)
        "push": push_service.is_configured(),
        "sms": sms_service.is_configured(),
        "whatsapp": whatsapp_service.is_configured(),
        "vapidPublicKey": push_service.get_vapid_public_key(),
    })


@notification_bp.post("/push/subscribe")
@jwt_required()
def push_subscribe():
    user = get_current_user()
    payload = request.get_json(silent=True) or {}
    require_fields(payload, ["endpoint"])

    existing = PushSubscription.query.filter_by(endpoint=payload["endpoint"]).first()
    if existing:
        existing.user_id = user.id
        existing.p256dh = payload.get("keys", {}).get("p256dh")
        existing.auth = payload.get("keys", {}).get("auth")
    else:
        db.session.add(PushSubscription(
            user_id=user.id, endpoint=payload["endpoint"],
            p256dh=payload.get("keys", {}).get("p256dh"),
            auth=payload.get("keys", {}).get("auth"),
        ))
    db.session.commit()
    return success(message="Inscrição de push registrada")


@notification_bp.post("/push/unsubscribe")
@jwt_required()
def push_unsubscribe():
    payload = request.get_json(silent=True) or {}
    endpoint = payload.get("endpoint")
    if endpoint:
        PushSubscription.query.filter_by(endpoint=endpoint).delete()
        db.session.commit()
    return success(message="Inscrição de push removida")


@notification_bp.post("/test")
@jwt_required()
def send_test_notification():
    user = get_current_user()
    report = dispatch_notification(user, "Notificação de teste", "Se você recebeu isso, seus canais estão funcionando!")
    return success(report, "Teste concluído — veja o resultado de cada canal")
