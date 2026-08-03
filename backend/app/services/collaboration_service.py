"""Regras de negócio de colaboração: compartilhamentos, permissões e equipes."""
import secrets

from app.extensions import db
from app.models import Share, TeamMember, User, Event, Task


def generate_token() -> str:
    return secrets.token_urlsafe(24)


def _user_team_ids(user: User) -> list[str]:
    memberships = TeamMember.query.filter_by(user_id=user.id, status="active").all()
    return [m.team_id for m in memberships]


def shares_received_by(user: User) -> list[Share]:
    """Todos os compartilhamentos aceitos que dão acesso a este usuário
    (diretos por e-mail/usuário, ou via equipe)."""
    team_ids = _user_team_ids(user)
    query = Share.query.filter(Share.status == "accepted").filter(
        db.or_(
            Share.user_id == user.id,
            Share.email == user.email,
            Share.team_id.in_(team_ids) if team_ids else False,
        )
    )
    return query.all()


def get_accessible_events(user: User, own_events_query):
    """Retorna (lista de eventos, mapa evento_id -> permissão) considerando
    a agenda própria + agendas/eventos compartilhados com o usuário."""
    own = list(own_events_query)
    permissions = {e.id: "edit" for e in own}

    for share in shares_received_by(user):
        if share.entity_type == "calendar":
            owner_events = Event.query.filter_by(user_id=share.owner_id).all()
            for e in owner_events:
                if e.id not in permissions:
                    own.append(e)
                permissions[e.id] = max_permission(permissions.get(e.id), share.permission)
        elif share.entity_type == "event" and share.entity_id:
            e = Event.query.get(share.entity_id)
            if e:
                if e.id not in permissions:
                    own.append(e)
                permissions[e.id] = max_permission(permissions.get(e.id), share.permission)

    return own, permissions


def max_permission(current: str | None, new: str) -> str:
    if current == "edit" or new == "edit":
        return "edit"
    return "view"


def user_can_access_event(user: User, event: Event) -> str | None:
    """Retorna 'edit', 'view' ou None."""
    if event.user_id == user.id:
        return "edit"
    for share in shares_received_by(user):
        if share.entity_type == "calendar" and share.owner_id == event.user_id:
            return share.permission
        if share.entity_type == "event" and share.entity_id == event.id:
            return share.permission
    return None


def user_can_access_task(user: User, task: Task) -> str | None:
    if task.user_id == user.id:
        return "edit"
    for share in shares_received_by(user):
        if share.entity_type == "calendar" and share.owner_id == task.user_id:
            return share.permission
        if share.entity_type == "task" and share.entity_id == task.id:
            return share.permission
    return None
