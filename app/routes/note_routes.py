from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.extensions import db
from app.models import Note
from app.middlewares.auth_middleware import get_current_user
from app.utils.responses import success, ApiError

note_bp = Blueprint("notes", __name__, url_prefix="/api/notes")


@note_bp.get("")
@jwt_required()
def list_notes():
    user = get_current_user()
    notes = Note.query.filter_by(user_id=user.id).order_by(Note.pinned.desc(), Note.updated_at.desc()).all()
    return success([n.to_dict() for n in notes])


@note_bp.post("")
@jwt_required()
def create_note():
    user = get_current_user()
    payload = request.get_json(silent=True) or {}

    note = Note(
        user_id=user.id, title=payload.get("title"), content=payload.get("content", ""),
        color=payload.get("color", "#F1F0FE"), pinned=payload.get("pinned", False),
    )
    db.session.add(note)
    db.session.commit()
    return success(note.to_dict(), "Nota criada", status=201)


@note_bp.put("/<string:note_id>")
@jwt_required()
def update_note(note_id):
    user = get_current_user()
    note = Note.query.filter_by(id=note_id, user_id=user.id).first()
    if not note:
        raise ApiError("Nota não encontrada", status=404)

    payload = request.get_json(silent=True) or {}
    for field in ["title", "content", "color", "pinned"]:
        if field in payload:
            setattr(note, field, payload[field])

    db.session.commit()
    return success(note.to_dict(), "Nota atualizada")


@note_bp.delete("/<string:note_id>")
@jwt_required()
def delete_note(note_id):
    user = get_current_user()
    note = Note.query.filter_by(id=note_id, user_id=user.id).first()
    if not note:
        raise ApiError("Nota não encontrada", status=404)

    db.session.delete(note)
    db.session.commit()
    return success(message="Nota removida")
