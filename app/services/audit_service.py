"""Registro simples de auditoria: quem fez o quê, e quando."""
from app.extensions import db
from app.models import AuditLog


def log_action(user_id: str, action: str, entity: str, entity_id: str | None = None, description: str | None = None) -> None:
    entry = AuditLog(user_id=user_id, action=action, entity=entity, entity_id=entity_id, description=description)
    db.session.add(entry)
    # commit é feito junto com a operação principal pelo chamador (mesma transação)
