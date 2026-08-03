import json
import io
from datetime import datetime

from flask import Blueprint, request, send_file
from flask_jwt_extended import jwt_required

from app.extensions import db
from app.models import Category, Event, Task, TaskChecklist
from app.middlewares.auth_middleware import get_current_user
from app.utils.responses import success, ApiError
from app.utils.validators import parse_iso_datetime

backup_bp = Blueprint("backup", __name__, url_prefix="/api/backup")


@backup_bp.get("/export")
@jwt_required()
def export_backup():
    """Exporta todos os dados do usuário (categorias, eventos e tarefas) em um único JSON."""
    user = get_current_user()

    payload = {
        "version": 1,
        "exportedAt": datetime.utcnow().isoformat(),
        "user": {"name": user.name, "email": user.email},
        "categories": [c.to_dict() for c in user.categories],
        "events": [e.to_dict() for e in user.events],
        "tasks": [t.to_dict() for t in user.tasks],
    }

    buffer = io.BytesIO(json.dumps(payload, indent=2, ensure_ascii=False).encode("utf-8"))
    return send_file(buffer, as_attachment=True, download_name="agenda-backup.json", mimetype="application/json")


@backup_bp.post("/restore")
@jwt_required()
def restore_backup():
    """
    Restaura categorias, eventos e tarefas a partir de um arquivo de backup gerado por
    /api/backup/export. Itens existentes não são apagados — a restauração é aditiva.
    """
    user = get_current_user()

    if "file" not in request.files:
        raise ApiError("Nenhum arquivo enviado", status=422)

    try:
        payload = json.loads(request.files["file"].read().decode("utf-8"))
    except (ValueError, UnicodeDecodeError):
        raise ApiError("Arquivo de backup inválido", status=422)

    category_map: dict[str, str] = {}
    for cat in payload.get("categories", []):
        new_cat = Category(
            user_id=user.id, name=cat.get("name", "Categoria"), color=cat.get("color", "#3454D1"),
            icon=cat.get("icon", "folder"), description=cat.get("description"),
        )
        db.session.add(new_cat)
        db.session.flush()
        category_map[cat.get("id")] = new_cat.id

    events_created = 0
    for ev in payload.get("events", []):
        try:
            start_at = parse_iso_datetime(ev["startAt"])
            end_at = parse_iso_datetime(ev["endAt"])
        except Exception:
            continue
        db.session.add(Event(
            user_id=user.id, category_id=category_map.get(ev.get("categoryId")),
            title=ev.get("title", "Evento"), description=ev.get("description"),
            location=ev.get("location"), start_at=start_at, end_at=end_at,
            priority=ev.get("priority", "medium"), status=ev.get("status", "scheduled"),
        ))
        events_created += 1

    tasks_created = 0
    for t in payload.get("tasks", []):
        task = Task(
            user_id=user.id, category_id=category_map.get(t.get("categoryId")),
            title=t.get("title", "Tarefa"), description=t.get("description"),
            due_date=parse_iso_datetime(t["dueDate"]) if t.get("dueDate") else None,
            priority=t.get("priority", "medium"), status=t.get("status", "pending"),
        )
        db.session.add(task)
        db.session.flush()
        for idx, item in enumerate(t.get("checklist", [])):
            task.checklist.append(TaskChecklist(title=item.get("title", ""), done=item.get("done", False), position=idx))
        tasks_created += 1

    db.session.commit()
    return success(
        {"categoriesCreated": len(category_map), "eventsCreated": events_created, "tasksCreated": tasks_created},
        "Backup restaurado com sucesso",
    )
