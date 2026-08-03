from app.extensions import db
from app.models.base import BaseModel


class Team(BaseModel):
    __tablename__ = "teams"

    owner_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.String(300), nullable=True)

    members = db.relationship("TeamMember", backref="team", lazy="joined", cascade="all, delete-orphan")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "ownerId": self.owner_id,
            "members": [m.to_dict() for m in self.members],
            "createdAt": self.created_at.isoformat(),
        }


class TeamMember(BaseModel):
    __tablename__ = "team_members"

    team_id = db.Column(db.String(36), db.ForeignKey("teams.id"), nullable=False, index=True)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True, index=True)
    email = db.Column(db.String(180), nullable=False)
    role = db.Column(db.String(20), default="member")  # owner | admin | member
    status = db.Column(db.String(20), default="pending")  # pending | active

    user = db.relationship("User", foreign_keys=[user_id])

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "teamId": self.team_id,
            "userId": self.user_id,
            "name": self.user.name if self.user else None,
            "email": self.email,
            "role": self.role,
            "status": self.status,
        }


class Share(BaseModel):
    """Compartilhamento de agenda inteira, de um evento ou de uma tarefa com
    outra pessoa (por e-mail) ou com uma equipe inteira."""
    __tablename__ = "shares"

    owner_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    entity_type = db.Column(db.String(20), nullable=False)  # calendar | event | task
    entity_id = db.Column(db.String(36), nullable=True)  # nulo quando entity_type = calendar

    # Destino: ou um e-mail individual, ou uma equipe (um dos dois)
    email = db.Column(db.String(180), nullable=True)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True, index=True)
    team_id = db.Column(db.String(36), db.ForeignKey("teams.id"), nullable=True, index=True)

    permission = db.Column(db.String(10), default="view")  # view | edit
    token = db.Column(db.String(64), unique=True, nullable=False, index=True)
    status = db.Column(db.String(20), default="pending")  # pending | accepted

    user = db.relationship("User", foreign_keys=[user_id])

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "entityType": self.entity_type,
            "entityId": self.entity_id,
            "email": self.email,
            "userId": self.user_id,
            "teamId": self.team_id,
            "permission": self.permission,
            "status": self.status,
            "token": self.token,
            "createdAt": self.created_at.isoformat(),
        }


class Comment(BaseModel):
    """Comentários / chat vinculados a um evento ou tarefa."""
    __tablename__ = "collab_comments"

    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    entity_type = db.Column(db.String(20), nullable=False)  # event | task
    entity_id = db.Column(db.String(36), nullable=False, index=True)
    content = db.Column(db.Text, nullable=False)

    author = db.relationship("User", foreign_keys=[user_id])

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "entityType": self.entity_type,
            "entityId": self.entity_id,
            "authorName": self.author.name if self.author else None,
            "authorId": self.user_id,
            "content": self.content,
            "createdAt": self.created_at.isoformat(),
        }


class PushSubscription(BaseModel):
    """Assinatura de push notification do navegador (Web Push API)."""
    __tablename__ = "push_subscriptions"

    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    endpoint = db.Column(db.String(500), nullable=False, unique=True)
    p256dh = db.Column(db.String(200), nullable=True)
    auth = db.Column(db.String(100), nullable=True)

    def to_dict(self) -> dict:
        return {"id": self.id, "endpoint": self.endpoint}
