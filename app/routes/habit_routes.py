from datetime import date, timedelta

from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.extensions import db
from app.models import Habit, HabitLog
from app.middlewares.auth_middleware import get_current_user
from app.utils.responses import success, ApiError
from app.utils.validators import require_fields

habit_bp = Blueprint("habits", __name__, url_prefix="/api/habits")


@habit_bp.get("")
@jwt_required()
def list_habits():
    user = get_current_user()
    habits = Habit.query.filter_by(user_id=user.id, archived=False).order_by(Habit.created_at.asc()).all()
    return success([h.to_dict() for h in habits])


@habit_bp.post("")
@jwt_required()
def create_habit():
    user = get_current_user()
    payload = request.get_json(silent=True) or {}
    require_fields(payload, ["name"])

    habit = Habit(
        user_id=user.id,
        name=payload["name"].strip(),
        color=payload.get("color", "#3454D1"),
        icon=payload.get("icon", "target"),
        frequency=payload.get("frequency", "daily"),
        target_per_period=payload.get("targetPerPeriod", 1),
    )
    db.session.add(habit)
    db.session.commit()
    return success(habit.to_dict(), "Hábito criado", status=201)


@habit_bp.put("/<string:habit_id>")
@jwt_required()
def update_habit(habit_id):
    user = get_current_user()
    habit = Habit.query.filter_by(id=habit_id, user_id=user.id).first()
    if not habit:
        raise ApiError("Hábito não encontrado", status=404)

    payload = request.get_json(silent=True) or {}
    fields = {"name": "name", "color": "color", "icon": "icon", "frequency": "frequency",
              "targetPerPeriod": "target_per_period", "archived": "archived"}
    for key, db_field in fields.items():
        if key in payload:
            setattr(habit, db_field, payload[key])

    db.session.commit()
    return success(habit.to_dict(), "Hábito atualizado")


@habit_bp.post("/<string:habit_id>/toggle")
@jwt_required()
def toggle_habit_today(habit_id):
    """Marca/desmarca a conclusão do hábito em uma data (padrão: hoje)."""
    user = get_current_user()
    habit = Habit.query.filter_by(id=habit_id, user_id=user.id).first()
    if not habit:
        raise ApiError("Hábito não encontrado", status=404)

    payload = request.get_json(silent=True) or {}
    target_date = date.fromisoformat(payload["date"]) if payload.get("date") else date.today()

    existing = HabitLog.query.filter_by(habit_id=habit.id, date=target_date).first()
    if existing:
        db.session.delete(existing)
        done = False
    else:
        db.session.add(HabitLog(habit_id=habit.id, date=target_date))
        done = True

    db.session.commit()
    return success({"date": target_date.isoformat(), "done": done})


@habit_bp.get("/<string:habit_id>/stats")
@jwt_required()
def habit_stats(habit_id):
    user = get_current_user()
    habit = Habit.query.filter_by(id=habit_id, user_id=user.id).first()
    if not habit:
        raise ApiError("Hábito não encontrado", status=404)

    today = date.today()
    streak = 0
    cursor = today
    logged_dates = {log.date for log in habit.logs}
    while cursor in logged_dates:
        streak += 1
        cursor -= timedelta(days=1)

    last_30_days = [(today - timedelta(days=i)) for i in range(29, -1, -1)]
    history = [{"date": d.isoformat(), "done": d in logged_dates} for d in last_30_days]

    return success({"streak": streak, "totalCompletions": len(logged_dates), "history": history})


@habit_bp.delete("/<string:habit_id>")
@jwt_required()
def delete_habit(habit_id):
    user = get_current_user()
    habit = Habit.query.filter_by(id=habit_id, user_id=user.id).first()
    if not habit:
        raise ApiError("Hábito não encontrado", status=404)

    db.session.delete(habit)
    db.session.commit()
    return success(message="Hábito removido")
