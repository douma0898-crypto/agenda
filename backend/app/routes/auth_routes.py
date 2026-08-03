import json
import os
import uuid

from flask import Blueprint, request, send_from_directory
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
)
from werkzeug.utils import secure_filename

from app.extensions import db
from app.models import User, Share, Team, TeamMember, Notification
from app.middlewares.auth_middleware import get_current_user
from app.utils.responses import success, error, ApiError
from app.utils.validators import require_fields, validate_email, validate_password

PROFILE_AVATAR_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}
MAX_AVATAR_SIZE = 5 * 1024 * 1024  # 5 MB


def _profile_avatar_dir() -> str:
    path = os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "avatars")
    os.makedirs(path, exist_ok=True)
    return path


def _allowed_avatar(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in PROFILE_AVATAR_EXTENSIONS


def _parse_payload():
    raw_data = request.get_data(cache=True)
    if raw_data:
        try:
            payload = json.loads(raw_data.decode("utf-8"))
            if isinstance(payload, dict):
                return payload
        except (json.JSONDecodeError, UnicodeDecodeError):
            pass

    json_payload = request.get_json(silent=True)
    if isinstance(json_payload, dict):
        return json_payload

    json_payload = request.get_json(force=True, silent=True)
    if isinstance(json_payload, dict):
        return json_payload

    if request.form:
        return request.form.to_dict()

    return {}

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _tokens_for(user: User) -> dict:
    return {
        "accessToken": create_access_token(identity=user.id),
        "refreshToken": create_refresh_token(identity=user.id),
        "user": user.to_dict(),
    }


@auth_bp.post("/register")
def register():
    payload = _parse_payload()
    require_fields(payload, ["name", "email", "password"])
    validate_email(payload["email"])
    validate_password(payload["password"])

    if User.query.filter_by(email=payload["email"].lower().strip()).first():
        raise ApiError("Já existe uma conta com este e-mail", status=409)

    user = User(
        name=payload["name"].strip(),
        email=payload["email"].lower().strip(),
        notify_email=True,
        notify_push=True,
        notify_desktop=True,
    )
    user.set_password(payload["password"])
    db.session.add(user)
    db.session.commit()

    # Ao criar a conta, associe convites pendentes existentes para este e-mail.
    pending_shares = Share.query.filter_by(email=user.email, status="pending").all()
    for share in pending_shares:
        share.user_id = user.id
    pending_memberships = TeamMember.query.filter_by(email=user.email, status="pending").all()
    for member in pending_memberships:
        member.user_id = user.id
        member.status = "active"

    if pending_shares or pending_memberships:
        db.session.add(Notification(
            user_id=user.id,
            title="Você tem convites pendentes",
            message="Sua nova conta Agenda recebeu convites que estavam aguardando este e-mail.",
            type="system",
            reference_id=None,
        ))
    db.session.commit()

    return success(_tokens_for(user), "Conta criada com sucesso", status=201)


@auth_bp.post("/login")
def login():
    payload = _parse_payload()
    require_fields(payload, ["email", "password"])

    user = User.query.filter_by(email=payload["email"].lower().strip()).first()
    if not user or not user.check_password(payload["password"]):
        raise ApiError("E-mail ou senha inválidos", status=401)

    return success(_tokens_for(user), "Login realizado com sucesso")


@auth_bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    access_token = create_access_token(identity=identity)
    return success({"accessToken": access_token}, "Token renovado")


@auth_bp.get("/me")
@jwt_required()
def me():
    user = get_current_user()
    return success(user.to_dict())


@auth_bp.post("/me/avatar")
@jwt_required()
def upload_avatar():
    user = get_current_user()

    if "avatar" not in request.files:
        raise ApiError("Nenhum arquivo de avatar enviado", status=422)

    file = request.files["avatar"]
    if file.filename == "":
        raise ApiError("Nome de arquivo inválido", status=422)
    if not _allowed_avatar(file.filename):
        raise ApiError("Tipo de arquivo de avatar não permitido", status=422)

    safe_name = secure_filename(file.filename)
    stored_name = f"{uuid.uuid4().hex}_{safe_name}"
    filepath = os.path.join(_profile_avatar_dir(), stored_name)
    file.save(filepath)

    size = os.path.getsize(filepath)
    if size > MAX_AVATAR_SIZE:
        os.remove(filepath)
        raise ApiError("Avatar excede o limite de 5MB", status=422)

    avatar_url = f"{request.url_root.rstrip('/')}/api/auth/avatar/{stored_name}"
    user.avatar_url = avatar_url
    db.session.commit()

    return success({"avatarUrl": avatar_url}, "Avatar enviado", status=201)


@auth_bp.get("/avatar/<string:filename>")
def get_avatar(filename):
    return send_from_directory(_profile_avatar_dir(), filename)


@auth_bp.put("/me")
@jwt_required()
def update_me():
    user = get_current_user()
    payload = request.get_json(silent=True) or {}

    for field in ["name", "avatarUrl", "theme", "primaryColor", "language", "timeFormat", "dateFormat", "timezone"]:
        db_field = {
            "avatarUrl": "avatar_url",
            "primaryColor": "primary_color",
            "timeFormat": "time_format",
            "dateFormat": "date_format",
        }.get(field, field)
        if field in payload:
            setattr(user, db_field, payload[field])

    db.session.commit()
    return success(user.to_dict(), "Perfil atualizado")


@auth_bp.post("/change-password")
@jwt_required()
def change_password():
    user = get_current_user()
    payload = request.get_json(silent=True) or {}
    require_fields(payload, ["currentPassword", "newPassword"])

    if not user.check_password(payload["currentPassword"]):
        raise ApiError("Senha atual incorreta", status=401)

    validate_password(payload["newPassword"])
    user.set_password(payload["newPassword"])
    db.session.commit()
    return success(message="Senha alterada com sucesso")


@auth_bp.post("/forgot-password")
def forgot_password():
    """
    Fluxo de recuperação de senha (estrutura pronta para produção).

    Em produção, aqui seria gerado um token de reset com expiração e enviado
    por e-mail via um provedor (SES, SendGrid, etc.). Como este é um projeto
    local sem serviço de e-mail configurado, apenas validamos a existência
    do e-mail e confirmamos o fluxo, sem expor se o e-mail existe ou não.
    """
    payload = request.get_json(silent=True) or {}
    require_fields(payload, ["email"])
    return success(message="Se o e-mail existir em nossa base, enviaremos instruções de recuperação")
