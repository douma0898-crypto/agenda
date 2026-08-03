"""Regras de negócio de eventos: expansão de recorrência e detecção de conflitos."""
from datetime import datetime, timedelta

from app.models import Event

MAX_OCCURRENCES = 200

STEP_BY_RECURRENCE = {
    "daily": timedelta(days=1),
    "weekly": timedelta(weeks=1),
}


def _add_months(dt: datetime, months: int) -> datetime:
    month = dt.month - 1 + months
    year = dt.year + month // 12
    month = month % 12 + 1
    day = min(dt.day, [31, 29 if year % 4 == 0 and (year % 100 != 0 or year % 400 == 0) else 28,
                       31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1])
    return dt.replace(year=year, month=month, day=day)


def expand_occurrences(event: Event, range_start: datetime, range_end: datetime) -> list[dict]:
    """Gera as instâncias visíveis de um evento (incluindo recorrências) dentro do range."""
    duration = event.end_at - event.start_at
    occurrences = []

    if event.recurrence == "none":
        if event.start_at < range_end and event.end_at > range_start:
            occurrences.append(_occurrence_dict(event, event.start_at, event.end_at))
        return occurrences

    cursor = event.start_at
    limit = event.recurrence_end or range_end
    count = 0
    while cursor <= min(range_end, limit) and count < MAX_OCCURRENCES:
        occ_end = cursor + duration
        if cursor < range_end and occ_end > range_start:
            occurrences.append(_occurrence_dict(event, cursor, occ_end))

        if event.recurrence in STEP_BY_RECURRENCE:
            cursor = cursor + STEP_BY_RECURRENCE[event.recurrence]
        elif event.recurrence == "monthly":
            cursor = _add_months(cursor, 1)
        elif event.recurrence == "yearly":
            cursor = _add_months(cursor, 12)
        else:
            break
        count += 1

    return occurrences


def _occurrence_dict(event: Event, start_at: datetime, end_at: datetime) -> dict:
    data = event.to_dict()
    data["startAt"] = start_at.isoformat()
    data["endAt"] = end_at.isoformat()
    data["isRecurrenceInstance"] = start_at != event.start_at
    return data


def find_conflicts(user_events: list[Event], start_at: datetime, end_at: datetime, ignore_id: str | None = None):
    """Retorna eventos que se sobrepõem ao intervalo informado (mesmo usuário)."""
    conflicts = []
    for ev in user_events:
        if ignore_id and ev.id == ignore_id:
            continue
        if ev.start_at < end_at and ev.end_at > start_at:
            conflicts.append(ev)
    return conflicts
