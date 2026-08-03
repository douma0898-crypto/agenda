import csv
import io
from datetime import datetime

from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.extensions import db
from app.models import Event, Category
from app.middlewares.auth_middleware import get_current_user
from app.utils.responses import success, ApiError

import_bp = Blueprint("import_data", __name__, url_prefix="/api/import")


@import_bp.post("/events.csv")
@jwt_required()
def import_events_csv():
    """
    Importa eventos de um CSV com colunas: Título, Início, Fim, Local, Prioridade, Status, Categoria
    (mesmo formato gerado por /api/export/events.csv). Categorias não existentes são criadas
    automaticamente.
    """
    user = get_current_user()

    if "file" not in request.files:
        raise ApiError("Nenhum arquivo enviado", status=422)

    file = request.files["file"]
    try:
        content = file.read().decode("utf-8-sig")
    except UnicodeDecodeError:
        raise ApiError("Não foi possível ler o arquivo (esperado CSV em UTF-8)", status=422)

    reader = csv.DictReader(io.StringIO(content))
    required_cols = {"Título", "Início", "Fim"}
    if not required_cols.issubset(set(reader.fieldnames or [])):
        raise ApiError(f"CSV inválido. Colunas esperadas: {', '.join(required_cols)}", status=422)

    category_cache: dict[str, Category] = {c.name: c for c in user.categories}
    created, skipped = 0, 0

    for row in reader:
        title = (row.get("Título") or "").strip()
        start_raw = (row.get("Início") or "").strip()
        end_raw = (row.get("Fim") or "").strip()
        if not title or not start_raw or not end_raw:
            skipped += 1
            continue

        try:
            start_at = datetime.strptime(start_raw, "%Y-%m-%d %H:%M")
            end_at = datetime.strptime(end_raw, "%Y-%m-%d %H:%M")
        except ValueError:
            skipped += 1
            continue

        category_name = (row.get("Categoria") or "").strip()
        category = None
        if category_name:
            category = category_cache.get(category_name)
            if not category:
                category = Category(user_id=user.id, name=category_name, color="#3454D1", icon="folder")
                db.session.add(category)
                db.session.flush()
                category_cache[category_name] = category

        db.session.add(Event(
            user_id=user.id, category_id=category.id if category else None,
            title=title, location=(row.get("Local") or "").strip() or None,
            start_at=start_at, end_at=end_at,
            priority=(row.get("Prioridade") or "medium").strip().lower() or "medium",
            status=(row.get("Status") or "scheduled").strip().lower() or "scheduled",
        ))
        created += 1

    db.session.commit()
    return success({"created": created, "skipped": skipped}, f"{created} evento(s) importado(s), {skipped} ignorado(s)")
