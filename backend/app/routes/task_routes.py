from datetime import datetime

from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.extensions import db
from app.models import Task, TaskChecklist, Tag
from app.middlewares.auth_middleware import get_current_user
from app.services.audit_service import log_action
from app.utils.responses import success, ApiError
from app.utils.validators import require_fields, parse_iso_datetime

task_bp = Blueprint("tasks", __name__, url_prefix="/api/tasks")


def _apply_task_tags(task: Task, tag_names: list[str], user_id: str):
    task.tags = []
    for name in tag_names or []:
        name = name.strip()
        if not name:
            continue
        tag = Tag.query.filter_by(user_id=user_id, name=name).first()
        if not tag:
            tag = Tag(user_id=user_id, name=name)
            db.session.add(tag)
            db.session.flush()
        task.tags.append(tag)


def _apply_checklist(task: Task, items: list[dict]):
    task.checklist = []
    for idx, item in enumerate(items or []):
        task.checklist.append(TaskChecklist(title=item.get("title", ""), done=item.get("done", False), position=idx))


@task_bp.get("")
@jwt_required()
def list_tasks():
    user = get_current_user()
    query = user.tasks

    status = request.args.get("status")
    if status:
        query = query.filter(Task.status == status)

    category_id = request.args.get("categoryId")
    if category_id:
        query = query.filter(Task.category_id == category_id)

    priority = request.args.get("priority")
    if priority:
        query = query.filter(Task.priority == priority)

    search = request.args.get("search")
    if search:
        like = f"%{search}%"
        query = query.filter(db.or_(Task.title.ilike(like), Task.description.ilike(like)))

    tasks = query.order_by(Task.due_date.is_(None), Task.due_date.asc()).all()
    return success([t.to_dict() for t in tasks])


@task_bp.post("")
@jwt_required()
def create_task():
    user = get_current_user()
    payload = request.get_json(silent=True) or {}
    require_fields(payload, ["title"])

    task = Task(
        user_id=user.id,
        category_id=payload.get("categoryId"),
        title=payload["title"].strip(),
        description=payload.get("description"),
        due_date=parse_iso_datetime(payload["dueDate"], "dueDate") if payload.get("dueDate") else None,
        priority=payload.get("priority", "medium"),
        status=payload.get("status", "pending"),
        estimated_minutes=payload.get("estimatedMinutes"),
        is_favorite=payload.get("isFavorite", False),
    )
    db.session.add(task)
    db.session.flush()

    _apply_checklist(task, payload.get("checklist", []))
    _apply_task_tags(task, payload.get("tags", []), user.id)

    log_action(user.id, "create", "task", task.id, f"Criou a tarefa '{task.title}'")
    db.session.commit()
    return success(task.to_dict(), "Tarefa criada", status=201)


@task_bp.put("/<string:task_id>")
@jwt_required()
def update_task(task_id):
    user = get_current_user()
    task = user.tasks.filter_by(id=task_id).first()
    if not task:
        raise ApiError("Tarefa não encontrada", status=404)

    payload = request.get_json(silent=True) or {}
    simple_fields = {
        "categoryId": "category_id", "title": "title", "description": "description",
        "priority": "priority", "estimatedMinutes": "estimated_minutes", "isFavorite": "is_favorite",
    }
    for key, db_field in simple_fields.items():
        if key in payload:
            setattr(task, db_field, payload[key])

    if "dueDate" in payload:
        task.due_date = parse_iso_datetime(payload["dueDate"], "dueDate") if payload["dueDate"] else None

    if "status" in payload:
        task.status = payload["status"]
        task.completed_at = datetime.utcnow() if payload["status"] == "done" else None

    if "checklist" in payload:
        _apply_checklist(task, payload["checklist"])
    if "tags" in payload:
        _apply_task_tags(task, payload["tags"], user.id)

    db.session.commit()
    return success(task.to_dict(), "Tarefa atualizada")


@task_bp.patch("/<string:task_id>/complete")
@jwt_required()
def complete_task(task_id):
    user = get_current_user()
    task = user.tasks.filter_by(id=task_id).first()
    if not task:
        raise ApiError("Tarefa não encontrada", status=404)

    task.status = "done" if task.status != "done" else "pending"
    task.completed_at = datetime.utcnow() if task.status == "done" else None
    db.session.commit()
    return success(task.to_dict())


@task_bp.post("/<string:task_id>/duplicate")
@jwt_required()
def duplicate_task(task_id):
    user = get_current_user()
    task = user.tasks.filter_by(id=task_id).first()
    if not task:
        raise ApiError("Tarefa não encontrada", status=404)

    clone = Task(
        user_id=user.id, category_id=task.category_id, title=f"{task.title} (cópia)",
        description=task.description, due_date=task.due_date, priority=task.priority,
        status="pending", estimated_minutes=task.estimated_minutes, is_favorite=False,
    )
    db.session.add(clone)
    db.session.flush()
    clone.tags = list(task.tags)
    for idx, item in enumerate(task.checklist):
        clone.checklist.append(TaskChecklist(title=item.title, done=False, position=idx))
    db.session.commit()
    return success(clone.to_dict(), "Tarefa duplicada", status=201)


@task_bp.delete("/<string:task_id>")
@jwt_required()
def delete_task(task_id):
    user = get_current_user()
    task = user.tasks.filter_by(id=task_id).first()
    if not task:
        raise ApiError("Tarefa não encontrada", status=404)

    db.session.delete(task)
    log_action(user.id, "delete", "task", task.id, f"Removeu a tarefa '{task.title}'")
    db.session.commit()
    return success(message="Tarefa removida")
