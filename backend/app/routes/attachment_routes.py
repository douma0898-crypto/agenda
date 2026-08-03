import os
import uuid

from flask import Blueprint, request, send_from_directory
from flask_jwt_extended import jwt_required
from werkzeug.utils import secure_filename

from app.extensions import db
from app.models import Attachment, Event, Task
from app.middlewares.auth_middleware import get_current_user
from app.utils.responses import success, ApiError

attachment_bp = Blueprint("attachments", __name__, url_prefix="/api/attachments")

ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "gif", "webp", "doc", "docx", "xls", "xlsx", "csv", "txt", "zip"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def _uploads_dir() -> str:
    path = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
    os.makedirs(path, exist_ok=True)
    return path


def _allowed(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@attachment_bp.post("")
@jwt_required()
def upload_attachment():
    user = get_current_user()

    if "file" not in request.files:
        raise ApiError("Nenhum arquivo enviado", status=422)

    file = request.files["file"]
    if file.filename == "":
        raise ApiError("Nome de arquivo inválido", status=422)
    if not _allowed(file.filename):
        raise ApiError("Tipo de arquivo não permitido", status=422)

    event_id = request.form.get("eventId")
    task_id = request.form.get("taskId")

    if event_id and not Event.query.filter_by(id=event_id, user_id=user.id).first():
        raise ApiError("Evento não encontrado", status=404)
    if task_id and not Task.query.filter_by(id=task_id, user_id=user.id).first():
        raise ApiError("Tarefa não encontrada", status=404)

    safe_name = secure_filename(file.filename)
    stored_name = f"{uuid.uuid4().hex}_{safe_name}"
    filepath = os.path.join(_uploads_dir(), stored_name)
    file.save(filepath)

    size = os.path.getsize(filepath)
    if size > MAX_FILE_SIZE:
        os.remove(filepath)
        raise ApiError("Arquivo excede o limite de 10MB", status=422)

    attachment = Attachment(
        event_id=event_id, task_id=task_id, file_name=safe_name,
        file_url=f"/api/attachments/download/{stored_name}", file_size=size,
    )
    db.session.add(attachment)
    db.session.commit()

    return success(attachment.to_dict(), "Arquivo enviado", status=201)


@attachment_bp.get("/download/<string:stored_name>")
@jwt_required()
def download_attachment(stored_name):
    return send_from_directory(_uploads_dir(), stored_name)


@attachment_bp.delete("/<string:attachment_id>")
@jwt_required()
def delete_attachment(attachment_id):
    attachment = Attachment.query.filter_by(id=attachment_id).first()
    if not attachment:
        raise ApiError("Anexo não encontrado", status=404)

    stored_name = attachment.file_url.rsplit("/", 1)[-1]
    filepath = os.path.join(_uploads_dir(), stored_name)
    if os.path.exists(filepath):
        os.remove(filepath)

    db.session.delete(attachment)
    db.session.commit()
    return success(message="Anexo removido")
