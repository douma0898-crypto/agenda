from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.extensions import db
from app.models import Share, Team, TeamMember, Comment, AuditLog, Event, Task, User, Notification
from app.middlewares.auth_middleware import get_current_user
from app.services import collaboration_service, email_service
from app.services.audit_service import log_action
from app.utils.responses import success, ApiError
from app.utils.validators import require_fields, validate_email


def _serialize_share(share: Share) -> dict:
    data = share.to_dict()
    if share.entity_type == "event" and share.entity_id:
        event = Event.query.get(share.entity_id)
        data["entityTitle"] = event.title if event else "Evento"
        data["entityLabel"] = "Evento"
    elif share.entity_type == "task" and share.entity_id:
        task = Task.query.get(share.entity_id)
        data["entityTitle"] = task.title if task else "Tarefa"
        data["entityLabel"] = "Tarefa"
    else:
        data["entityTitle"] = None
        data["entityLabel"] = "Agenda inteira"

    if share.team_id:
        team = Team.query.get(share.team_id)
        data["teamName"] = team.name if team else None
    else:
        data["teamName"] = None

    data["displayName"] = data["entityTitle"] or data["entityLabel"]
    return data

collaboration_bp = Blueprint("collaboration", __name__, url_prefix="/api/collaboration")


# ---------------------------------------------------------------- Shares ---

@collaboration_bp.post("/shares")
@jwt_required()
def create_share():
    user = get_current_user()
    payload = request.get_json(silent=True) or {}
    require_fields(payload, ["entityType"])

    entity_type = payload["entityType"]
    if entity_type not in ("calendar", "event", "task"):
        raise ApiError("Tipo de compartilhamento inválido", status=422)

    entity_id = payload.get("entityId")
    if entity_type != "calendar" and not entity_id:
        raise ApiError("entityId é obrigatório para esse tipo", status=422)

    if entity_type == "event":
        entity = Event.query.filter_by(id=entity_id, user_id=user.id).first()
        if not entity:
            raise ApiError("Evento não encontrado", status=404)
    elif entity_type == "task":
        entity = Task.query.filter_by(id=entity_id, user_id=user.id).first()
        if not entity:
            raise ApiError("Tarefa não encontrada", status=404)

    team_id = payload.get("teamId")
    email = (payload.get("email") or "").lower().strip() or None
    if not team_id and not email:
        raise ApiError("Informe um e-mail ou uma equipe para compartilhar", status=422)
    if email:
        validate_email(email)

    target_user = User.query.filter_by(email=email).first() if email else None

    share = Share(
        owner_id=user.id,
        entity_type=entity_type,
        entity_id=entity_id,
        email=email,
        user_id=target_user.id if target_user else None,
        team_id=team_id,
        permission=payload.get("permission", "view"),
        token=collaboration_service.generate_token(),
        status="pending",
    )
    db.session.add(share)
    db.session.commit()

    if email:
        if entity_type == "calendar":
            label = "a agenda inteira"
        elif entity_type == "event":
            label = f"o evento '{entity.title}'"
        else:
            label = f"a tarefa '{task.title}'"

        accept_url = f"{request.headers.get('Origin', '')}/colaboracao?aceitar={share.token}"
        email_service.send_share_invite_email(email, user.name, label, accept_url)

    if target_user:
        Notification.query.filter_by(user_id=target_user.id, reference_id=share.id).delete()
        db.session.add(Notification(
            user_id=target_user.id,
            title="Você recebeu um convite de colaboração",
            message=f"{user.name} compartilhou {label} com você.",
            type="system",
            reference_id=share.id,
        ))
        db.session.commit()

    return success(_serialize_share(share), "Convite enviado", status=201)


@collaboration_bp.get("/shares/mine")
@jwt_required()
def list_my_shares():
    user = get_current_user()
    shares = Share.query.filter_by(owner_id=user.id).order_by(Share.created_at.desc()).all()
    return success([_serialize_share(s) for s in shares])


@collaboration_bp.get("/shares/received")
@jwt_required()
def list_received_shares():
    user = get_current_user()
    shares = collaboration_service.shares_received_by(user)
    pending = Share.query.filter(Share.email == user.email, Share.status == "pending").all()
    result = {s.id: s for s in shares}
    for s in pending:
        result[s.id] = s
    return success([_serialize_share(s) for s in result.values()])


@collaboration_bp.post("/shares/<token>/accept")
@jwt_required()
def accept_share(token: str):
    user = get_current_user()
    share = Share.query.filter_by(token=token).first()
    if not share:
        raise ApiError("Convite não encontrado", status=404)
    if share.email and share.email != user.email:
        raise ApiError("Este convite foi enviado para outro e-mail", status=403)

    share.status = "accepted"
    share.user_id = user.id
    db.session.commit()
    return success(share.to_dict(), "Convite aceito")


@collaboration_bp.delete("/shares/<share_id>")
@jwt_required()
def revoke_share(share_id: str):
    user = get_current_user()
    share = Share.query.filter_by(id=share_id, owner_id=user.id).first()
    if not share:
        raise ApiError("Compartilhamento não encontrado", status=404)
    db.session.delete(share)
    db.session.commit()
    return success(message="Compartilhamento removido")


# ----------------------------------------------------------------- Teams ---

@collaboration_bp.post("/teams")
@jwt_required()
def create_team():
    user = get_current_user()
    payload = request.get_json(silent=True) or {}
    require_fields(payload, ["name"])

    team = Team(owner_id=user.id, name=payload["name"], description=payload.get("description"))
    db.session.add(team)
    db.session.flush()

    db.session.add(TeamMember(team_id=team.id, user_id=user.id, email=user.email, role="owner", status="active"))
    db.session.commit()
    return success(team.to_dict(), "Equipe criada", status=201)


@collaboration_bp.get("/teams")
@jwt_required()
def list_teams():
    user = get_current_user()
    owned = Team.query.filter_by(owner_id=user.id).all()
    memberships = TeamMember.query.filter_by(user_id=user.id).all()
    member_team_ids = {m.team_id for m in memberships}
    member_teams = Team.query.filter(Team.id.in_(member_team_ids)).all() if member_team_ids else []

    all_teams = {t.id: t for t in owned}
    for t in member_teams:
        all_teams[t.id] = t

    return success([t.to_dict() for t in all_teams.values()])


@collaboration_bp.post("/teams/<team_id>/members")
@jwt_required()
def invite_team_member(team_id: str):
    user = get_current_user()
    team = Team.query.filter_by(id=team_id, owner_id=user.id).first()
    if not team:
        raise ApiError("Equipe não encontrada", status=404)

    payload = request.get_json(silent=True) or {}
    require_fields(payload, ["email"])
    email = payload["email"].lower().strip()
    validate_email(email)

    if TeamMember.query.filter_by(team_id=team_id, email=email).first():
        raise ApiError("Essa pessoa já foi convidada", status=409)

    existing_user = User.query.filter_by(email=email).first()
    role = payload.get("role", "member")
    if role not in ("admin", "member"):
        role = "member"

    member = TeamMember(
        team_id=team_id, user_id=existing_user.id if existing_user else None,
        email=email, role=role, status="active" if existing_user else "pending",
    )
    db.session.add(member)
    db.session.commit()

    email_service.send_team_invite_email(email, user.name, team.name)

    if existing_user:
        Notification.query.filter_by(user_id=existing_user.id, reference_id=member.id).delete()
        db.session.add(Notification(
            user_id=existing_user.id,
            title="Você foi convidado para uma equipe",
            message=f"{user.name} convidou você para a equipe {team.name}.",
            type="system",
            reference_id=member.id,
        ))
        db.session.commit()

    return success(member.to_dict(), "Membro convidado", status=201)


@collaboration_bp.patch("/teams/<team_id>/members/<member_id>")
@jwt_required()
def update_team_member(team_id: str, member_id: str):
    user = get_current_user()
    team = Team.query.filter_by(id=team_id, owner_id=user.id).first()
    if not team:
        raise ApiError("Apenas o dono da equipe pode alterar papéis", status=403)

    member = TeamMember.query.filter_by(id=member_id, team_id=team_id).first()
    if not member:
        raise ApiError("Membro não encontrado", status=404)

    payload = request.get_json(silent=True) or {}
    if payload.get("role") in ("admin", "member"):
        member.role = payload["role"]
    db.session.commit()
    return success(member.to_dict(), "Papel atualizado")


@collaboration_bp.delete("/teams/<team_id>/members/<member_id>")
@jwt_required()
def remove_team_member(team_id: str, member_id: str):
    user = get_current_user()
    team = Team.query.filter_by(id=team_id, owner_id=user.id).first()
    if not team:
        raise ApiError("Apenas o dono da equipe pode remover membros", status=403)

    member = TeamMember.query.filter_by(id=member_id, team_id=team_id).first()
    if not member:
        raise ApiError("Membro não encontrado", status=404)
    if member.role == "owner":
        raise ApiError("Não é possível remover o dono da equipe", status=422)

    db.session.delete(member)
    db.session.commit()
    return success(message="Membro removido")


# -------------------------------------------------------- Comments/chat ---

@collaboration_bp.get("/comments")
@jwt_required()
def list_comments():
    entity_type = request.args.get("entityType")
    entity_id = request.args.get("entityId")
    if not entity_type or not entity_id:
        raise ApiError("Informe entityType e entityId", status=422)

    comments = Comment.query.filter_by(entity_type=entity_type, entity_id=entity_id).order_by(Comment.created_at.asc()).all()
    return success([c.to_dict() for c in comments])


@collaboration_bp.post("/comments")
@jwt_required()
def create_comment():
    user = get_current_user()
    payload = request.get_json(silent=True) or {}
    require_fields(payload, ["entityType", "entityId", "content"])

    comment = Comment(
        user_id=user.id, entity_type=payload["entityType"],
        entity_id=payload["entityId"], content=payload["content"].strip(),
    )
    db.session.add(comment)
    db.session.commit()
    return success(comment.to_dict(), status=201)


@collaboration_bp.delete("/comments/<comment_id>")
@jwt_required()
def delete_comment(comment_id: str):
    user = get_current_user()
    comment = Comment.query.filter_by(id=comment_id, user_id=user.id).first()
    if not comment:
        raise ApiError("Comentário não encontrado", status=404)
    db.session.delete(comment)
    db.session.commit()
    return success(message="Comentário removido")


# -------------------------------------------------------------- History ---

@collaboration_bp.get("/history")
@jwt_required()
def entity_history():
    user = get_current_user()
    entity = request.args.get("entity")
    entity_id = request.args.get("entityId")

    query = AuditLog.query.filter_by(user_id=user.id)
    if entity:
        query = query.filter_by(entity=entity)
    if entity_id:
        query = query.filter_by(entity_id=entity_id)

    logs = query.order_by(AuditLog.created_at.desc()).limit(100).all()
    return success([log.to_dict() for log in logs])
