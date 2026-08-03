import json
from datetime import datetime, timedelta

from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.extensions import db
from app.models import Event, Reminder, Tag
from app.middlewares.auth_middleware import get_current_user
from app.services.event_service import expand_occurrences, find_conflicts
from app.services.audit_service import log_action
from app.utils.responses import success, ApiError
from app.utils.validators import require_fields, parse_iso_datetime

event_bp = Blueprint("events", __name__, url_prefix="/api/events")


def _apply_tags(event: Event, tag_names: list[str], user_id: str):
    event.tags = []
    for name in tag_names or []:
        name = name.strip()
        if not name:
            continue
        tag = Tag.query.filter_by(user_id=user_id, name=name).first()
        if not tag:
            tag = Tag(user_id=user_id, name=name)
            db.session.add(tag)
            db.session.flush()
        event.tags.append(tag)


def _apply_reminders(event: Event, reminders: list[dict]):
    event.reminders = []
    for r in reminders or []:
        event.reminders.append(Reminder(minutes_before=r.get("minutesBefore"), label=r.get("label")))


@event_bp.get("")
@jwt_required()
def list_events():
    user = get_current_user()

    query = user.events

    category_id = request.args.get("categoryId")
    if category_id:
        query = query.filter(Event.category_id == category_id)

    status = request.args.get("status")
    if status:
        query = query.filter(Event.status == status)

    favorite = request.args.get("favorite")
    if favorite is not None:
        query = query.filter(Event.is_favorite == (favorite.lower() == "true"))

    search = request.args.get("search")
    if search:
        like = f"%{search}%"
        query = query.filter(
            db.or_(
                Event.title.ilike(like),
                Event.description.ilike(like),
                Event.location.ilike(like),
            )
        )

    start_param = request.args.get("start")
    end_param = request.args.get("end")
    range_start = parse_iso_datetime(start_param, "start") if start_param else datetime.utcnow() - timedelta(days=365)
    range_end = parse_iso_datetime(end_param, "end") if end_param else datetime.utcnow() + timedelta(days=365)

    # Para recorrência funcionar corretamente, buscamos eventos cujo início é
    # anterior ao fim do range (a expansão filtra o restante em memória).
    query = query.filter(Event.start_at <= range_end)

    events = query.order_by(Event.start_at.asc()).all()

    occurrences = []
    for ev in events:
        occurrences.extend(expand_occurrences(ev, range_start, range_end))

    occurrences.sort(key=lambda e: e["startAt"])
    return success(occurrences)


@event_bp.get("/<string:event_id>")
@jwt_required()
def get_event(event_id):
    user = get_current_user()
    event = user.events.filter_by(id=event_id).first()
    if not event:
        raise ApiError("Evento não encontrado", status=404)
    return success(event.to_dict())


@event_bp.post("")
@jwt_required()
def create_event():
    user = get_current_user()
    payload = request.get_json(silent=True) or {}
    require_fields(payload, ["title", "startAt", "endAt"])

    start_at = parse_iso_datetime(payload["startAt"], "startAt")
    end_at = parse_iso_datetime(payload["endAt"], "endAt")
    if end_at <= start_at:
        raise ApiError("O horário final deve ser depois do horário inicial", status=422)

    event = Event(
        user_id=user.id,
        category_id=payload.get("categoryId"),
        title=payload["title"].strip(),
        description=payload.get("description"),
        color=payload.get("color"),
        icon=payload.get("icon"),
        location=payload.get("location"),
        link=payload.get("link"),
        participants=json.dumps(payload.get("participants", [])),
        phone=payload.get("phone"),
        contact_email=payload.get("contactEmail"),
        start_at=start_at,
        end_at=end_at,
        all_day=payload.get("allDay", False),
        recurrence=payload.get("recurrence", "none"),
        recurrence_end=parse_iso_datetime(payload["recurrenceEnd"], "recurrenceEnd") if payload.get("recurrenceEnd") else None,
        priority=payload.get("priority", "medium"),
        status=payload.get("status", "scheduled"),
        notes=payload.get("notes"),
        estimated_minutes=payload.get("estimatedMinutes"),
        is_favorite=payload.get("isFavorite", False),
    )
    db.session.add(event)
    db.session.flush()

    _apply_tags(event, payload.get("tags", []), user.id)
    _apply_reminders(event, payload.get("reminders", []))

    log_action(user.id, "create", "event", event.id, f"Criou o evento '{event.title}'")
    db.session.commit()

    conflicts = find_conflicts(user.events.all(), start_at, end_at, ignore_id=event.id)
    meta = {"conflicts": [c.id for c in conflicts]} if conflicts else None

    return success(event.to_dict(), "Evento criado", status=201, meta=meta)


@event_bp.put("/<string:event_id>")
@jwt_required()
def update_event(event_id):
    user = get_current_user()
    event = user.events.filter_by(id=event_id).first()
    if not event:
        raise ApiError("Evento não encontrado", status=404)

    payload = request.get_json(silent=True) or {}

    simple_fields = {
        "categoryId": "category_id", "title": "title", "description": "description",
        "color": "color", "icon": "icon", "location": "location", "link": "link",
        "phone": "phone", "contactEmail": "contact_email", "allDay": "all_day",
        "recurrence": "recurrence", "priority": "priority", "status": "status",
        "notes": "notes", "estimatedMinutes": "estimated_minutes",
        "actualMinutes": "actual_minutes", "isFavorite": "is_favorite",
    }
    for key, db_field in simple_fields.items():
        if key in payload:
            setattr(event, db_field, payload[key])

    if "participants" in payload:
        event.participants = json.dumps(payload["participants"])
    if "startAt" in payload:
        event.start_at = parse_iso_datetime(payload["startAt"], "startAt")
    if "endAt" in payload:
        event.end_at = parse_iso_datetime(payload["endAt"], "endAt")
    if "recurrenceEnd" in payload:
        event.recurrence_end = parse_iso_datetime(payload["recurrenceEnd"], "recurrenceEnd") if payload["recurrenceEnd"] else None
    if event.end_at <= event.start_at:
        raise ApiError("O horário final deve ser depois do horário inicial", status=422)

    if "tags" in payload:
        _apply_tags(event, payload["tags"], user.id)
    if "reminders" in payload:
        _apply_reminders(event, payload["reminders"])

    log_action(user.id, "update", "event", event.id, f"Atualizou o evento '{event.title}'")
    db.session.commit()

    conflicts = find_conflicts(user.events.all(), event.start_at, event.end_at, ignore_id=event.id)
    meta = {"conflicts": [c.id for c in conflicts]} if conflicts else None

    return success(event.to_dict(), "Evento atualizado", meta=meta)


@event_bp.patch("/<string:event_id>/move")
@jwt_required()
def move_event(event_id):
    """Endpoint dedicado para drag-and-drop / resize no calendário."""
    user = get_current_user()
    event = user.events.filter_by(id=event_id).first()
    if not event:
        raise ApiError("Evento não encontrado", status=404)

    payload = request.get_json(silent=True) or {}
    require_fields(payload, ["startAt", "endAt"])

    event.start_at = parse_iso_datetime(payload["startAt"], "startAt")
    event.end_at = parse_iso_datetime(payload["endAt"], "endAt")
    db.session.commit()

    return success(event.to_dict(), "Evento movido")


@event_bp.post("/<string:event_id>/duplicate")
@jwt_required()
def duplicate_event(event_id):
    user = get_current_user()
    event = user.events.filter_by(id=event_id).first()
    if not event:
        raise ApiError("Evento não encontrado", status=404)

    clone = Event(
        user_id=user.id, category_id=event.category_id, title=f"{event.title} (cópia)",
        description=event.description, color=event.color, icon=event.icon,
        location=event.location, link=event.link, participants=event.participants,
        phone=event.phone, contact_email=event.contact_email,
        start_at=event.start_at, end_at=event.end_at, all_day=event.all_day,
        recurrence=event.recurrence, recurrence_end=event.recurrence_end,
        priority=event.priority, status="scheduled", notes=event.notes,
        estimated_minutes=event.estimated_minutes, is_favorite=False,
    )
    db.session.add(clone)
    db.session.flush()
    clone.tags = list(event.tags)
    for r in event.reminders:
        clone.reminders.append(Reminder(minutes_before=r.minutes_before, label=r.label))
    db.session.commit()

    return success(clone.to_dict(), "Evento duplicado", status=201)


@event_bp.delete("/<string:event_id>")
@jwt_required()
def delete_event(event_id):
    user = get_current_user()
    event = user.events.filter_by(id=event_id).first()
    if not event:
        raise ApiError("Evento não encontrado", status=404)

    db.session.delete(event)
    log_action(user.id, "delete", "event", event.id, f"Removeu o evento '{event.title}'")
    db.session.commit()
    return success(message="Evento removido")
