from datetime import datetime, timedelta

from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.extensions import db
from app.models import User, Event, Notification
from app.middlewares.auth_middleware import get_current_user
from app.services import booking_service, email_service
from app.utils.responses import success, error, ApiError
from app.utils.validators import require_fields, validate_email, parse_iso_datetime

booking_bp = Blueprint("booking", __name__, url_prefix="/api/booking")
public_booking_bp = Blueprint("public_booking", __name__, url_prefix="/api/public/booking")


# ---------- Configurações do dono do app (autenticado) ----------

@booking_bp.get("/settings")
@jwt_required()
def get_settings():
    user = get_current_user()
    booking_service.ensure_public_slug(user)
    return success(user.booking_settings_dict())


@booking_bp.put("/settings")
@jwt_required()
def update_settings():
    user = get_current_user()
    payload = request.get_json(silent=True) or {}

    if "enabled" in payload:
        user.booking_enabled = bool(payload["enabled"])
    if "slotMinutes" in payload:
        user.booking_slot_minutes = int(payload["slotMinutes"])
    if "workStart" in payload:
        user.booking_work_start = payload["workStart"]
    if "workEnd" in payload:
        user.booking_work_end = payload["workEnd"]
    if "workDays" in payload and isinstance(payload["workDays"], list):
        user.booking_work_days = ",".join(str(int(d)) for d in payload["workDays"])
    if "daysAhead" in payload:
        user.booking_days_ahead = int(payload["daysAhead"])
    if "noticeMinutes" in payload:
        user.booking_notice_minutes = int(payload["noticeMinutes"])
    if "title" in payload:
        user.booking_title = payload["title"]
    if "description" in payload:
        user.booking_description = payload["description"]

    booking_service.ensure_public_slug(user)
    db.session.commit()
    return success(user.booking_settings_dict(), "Configurações de agendamento atualizadas")


@booking_bp.post("/settings/regenerate-link")
@jwt_required()
def regenerate_link():
    user = get_current_user()
    user.public_slug = booking_service.generate_public_slug(user.name)
    db.session.commit()
    return success(user.booking_settings_dict(), "Link de agendamento renovado")


@booking_bp.get("/appointments")
@jwt_required()
def list_appointments():
    user = get_current_user()
    scope = request.args.get("scope", "upcoming")  # upcoming | past | all
    query = Event.query.filter_by(user_id=user.id, source="booking_link")

    now = datetime.utcnow()
    if scope == "upcoming":
        query = query.filter(Event.start_at >= now, Event.status != "canceled")
    elif scope == "past":
        query = query.filter(Event.start_at < now)

    events = query.order_by(Event.start_at.asc() if scope == "upcoming" else Event.start_at.desc()).all()
    return success([e.to_dict() for e in events])


@booking_bp.delete("/appointments/<string:event_id>")
@jwt_required()
def cancel_appointment(event_id: str):
    user = get_current_user()
    event = Event.query.filter_by(id=event_id, user_id=user.id, source="booking_link").first()
    if not event:
        raise ApiError("Agendamento não encontrado", status=404)

    event.status = "canceled"
    db.session.commit()
    return success(message="Agendamento cancelado")


# ---------- Área pública (sem autenticação) ----------

@public_booking_bp.get("/<slug>")
def public_booking_info(slug: str):
    user = User.query.filter_by(public_slug=slug).first()
    if not user or not user.booking_enabled:
        raise ApiError("Link de agendamento não encontrado ou desativado", status=404)

    days = request.args.get("days", type=int)
    slots = booking_service.get_available_slots(user, days=days)

    return success({
        "owner": {"name": user.name, "avatarUrl": user.avatar_url},
        "title": user.booking_title or "Reunião",
        "description": user.booking_description,
        "slotMinutes": user.booking_slot_minutes,
        "timezone": user.timezone,
        "availability": slots,
    })


@public_booking_bp.post("/<slug>")
def create_public_booking(slug: str):
    user = User.query.filter_by(public_slug=slug).first()
    if not user or not user.booking_enabled:
        raise ApiError("Link de agendamento não encontrado ou desativado", status=404)

    payload = request.get_json(silent=True) or {}
    require_fields(payload, ["name", "email", "start"])
    validate_email(payload["email"])

    start_at = parse_iso_datetime(payload["start"], "horário")
    end_at = start_at + timedelta(minutes=user.booking_slot_minutes or 30)

    if not booking_service.slot_is_available(user, start_at, end_at):
        raise ApiError("Esse horário acabou de ser reservado, escolha outro", status=409)

    guest_name = payload["name"].strip()
    guest_email = payload["email"].lower().strip()
    guest_notes = (payload.get("notes") or "").strip() or None

    event = Event(
        user_id=user.id,
        title=f"{user.booking_title or 'Reunião'} com {guest_name}",
        description=guest_notes,
        contact_email=guest_email,
        participants=f'[{{"name": "{guest_name}", "email": "{guest_email}"}}]',
        start_at=start_at,
        end_at=end_at,
        status="scheduled",
        notes="Agendado via link público",
        source="booking_link",
    )
    db.session.add(event)

    notification = Notification(
        user_id=user.id,
        title="Novo agendamento",
        message=f"{guest_name} marcou um horário com você",
        type="event",
        reference_id=event.id,
    )
    db.session.add(notification)
    db.session.commit()

    email_service.send_booking_confirmation_to_guest(
        guest_email, guest_name, user.name, start_at, end_at, event.title, None,
    )
    email_service.send_booking_notification_to_owner(
        user.email, user.name, guest_name, guest_email, start_at, end_at, guest_notes,
    )

    return success({"eventId": event.id}, "Agendamento confirmado! Verifique seu e-mail.", status=201)
