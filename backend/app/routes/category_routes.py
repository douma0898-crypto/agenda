from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.extensions import db
from app.models import Category
from app.middlewares.auth_middleware import get_current_user
from app.utils.responses import success, ApiError
from app.utils.validators import require_fields

category_bp = Blueprint("categories", __name__, url_prefix="/api/categories")

DEFAULT_CATEGORIES = [
    {"name": "Trabalho", "color": "#3454D1", "icon": "briefcase"},
    {"name": "Pessoal", "color": "#0F9B8E", "icon": "user"},
    {"name": "Saúde", "color": "#22C55E", "icon": "heart-pulse"},
    {"name": "Estudos", "color": "#0EA5E9", "icon": "book-open"},
    {"name": "Financeiro", "color": "#F59E0B", "icon": "wallet"},
]


@category_bp.get("")
@jwt_required()
def list_categories():
    user = get_current_user()
    categories = user.categories.order_by(Category.created_at.asc()).all()
    return success([c.to_dict() for c in categories])


@category_bp.post("")
@jwt_required()
def create_category():
    user = get_current_user()
    payload = request.get_json(silent=True) or {}
    require_fields(payload, ["name"])

    category = Category(
        user_id=user.id,
        name=payload["name"].strip(),
        color=payload.get("color", "#3454D1"),
        icon=payload.get("icon", "folder"),
        description=payload.get("description"),
    )
    db.session.add(category)
    db.session.commit()
    return success(category.to_dict(), "Categoria criada", status=201)


@category_bp.put("/<string:category_id>")
@jwt_required()
def update_category(category_id):
    user = get_current_user()
    category = user.categories.filter_by(id=category_id).first()
    if not category:
        raise ApiError("Categoria não encontrada", status=404)

    payload = request.get_json(silent=True) or {}
    for field in ["name", "color", "icon", "description"]:
        if field in payload:
            setattr(category, field, payload[field])

    db.session.commit()
    return success(category.to_dict(), "Categoria atualizada")


@category_bp.delete("/<string:category_id>")
@jwt_required()
def delete_category(category_id):
    user = get_current_user()
    category = user.categories.filter_by(id=category_id).first()
    if not category:
        raise ApiError("Categoria não encontrada", status=404)

    db.session.delete(category)
    db.session.commit()
    return success(message="Categoria removida")
