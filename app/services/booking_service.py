"""Regras de negócio do agendamento público por link (estilo Calendly)."""
import re
import secrets
import unicodedata
from datetime import datetime, timedelta, date, time as dtime

from app.extensions import db
from app.models import User, Event


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text).strip("-").lower()
    return text or "usuario"


def generate_public_slug(name: str) -> str:
    base = slugify(name)
    for _ in range(20):
        candidate = f"{base}-{secrets.token_hex(2)}"
        if not User.query.filter_by(public_slug=candidate).first():
            return candidate
    return f"{base}-{secrets.token_hex(4)}"


def ensure_public_slug(user: User) -> str:
    if not user.public_slug:
        user.public_slug = generate_public_slug(user.name)
        db.session.commit()
    return user.public_slug


def _parse_hhmm(value: str) -> dtime:
    hour, minute = value.split(":")
    return dtime(hour=int(hour), minute=int(minute))


def get_available_slots(user: User, days: int | None = None) -> list[dict]:
    """Retorna lista de dias com os horários livres de cada um, respeitando
    dias/horário de trabalho configurados e os eventos já existentes."""
    days_ahead = days or user.booking_days_ahead or 14
    slot_minutes = user.booking_slot_minutes or 30
    work_days = {int(d) for d in user.booking_work_days.split(",") if d != ""}
    work_start = _parse_hhmm(user.booking_work_start or "09:00")
    work_end = _parse_hhmm(user.booking_work_end or "18:00")
    notice = timedelta(minutes=user.booking_notice_minutes or 0)

    now = datetime.utcnow()
    earliest_allowed = now + notice

    range_start = datetime.combine(date.today(), dtime.min)
    range_end = range_start + timedelta(days=days_ahead + 1)

    existing_events = (
        Event.query.filter(
            Event.user_id == user.id,
            Event.status != "canceled",
            Event.start_at < range_end,
            Event.end_at > range_start,
        ).all()
    )

    result = []
    cursor_day = date.today()
    for _ in range(days_ahead):
        if cursor_day.weekday() in _weekday_map(work_days):
            day_start = datetime.combine(cursor_day, work_start)
            day_end = datetime.combine(cursor_day, work_end)

            slots = []
            slot_start = day_start
            while slot_start + timedelta(minutes=slot_minutes) <= day_end:
                slot_end = slot_start + timedelta(minutes=slot_minutes)
                if slot_start >= earliest_allowed and not _overlaps(slot_start, slot_end, existing_events):
                    slots.append({
                        "start": slot_start.isoformat(),
                        "end": slot_end.isoformat(),
                    })
                slot_start = slot_end

            if slots:
                result.append({"date": cursor_day.isoformat(), "slots": slots})

        cursor_day = cursor_day + timedelta(days=1)

    return result


def _weekday_map(work_days: set[int]) -> set[int]:
    """Converte 0=Domingo..6=Sábado (armazenado) para o padrão Python (0=Segunda..6=Domingo)."""
    return {(d - 1) % 7 for d in work_days}


def _overlaps(start: datetime, end: datetime, events: list[Event]) -> bool:
    for ev in events:
        if ev.start_at < end and ev.end_at > start:
            return True
    return False


def slot_is_available(user: User, start_at: datetime, end_at: datetime) -> bool:
    conflicts = Event.query.filter(
        Event.user_id == user.id,
        Event.status != "canceled",
        Event.start_at < end_at,
        Event.end_at > start_at,
    ).first()
    return conflicts is None
