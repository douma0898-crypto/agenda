from app.extensions import db
from app.models.base import BaseModel


class Notification(BaseModel):
    __tablename__ = "notifications"

    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.String(500), nullable=True)
    type = db.Column(db.String(30), default="reminder")  # reminder | system | task | event
    read = db.Column(db.Boolean, default=False)
    reference_id = db.Column(db.String(36), nullable=True)  # id do evento/tarefa relacionado

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "message": self.message,
            "type": self.type,
            "read": self.read,
            "referenceId": self.reference_id,
            "createdAt": self.created_at.isoformat(),
        }


class Habit(BaseModel):
    __tablename__ = "habits"

    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False)
    color = db.Column(db.String(20), default="#3454D1")
    icon = db.Column(db.String(40), default="target")
    frequency = db.Column(db.String(20), default="daily")  # daily | weekly
    target_per_period = db.Column(db.Integer, default=1)
    archived = db.Column(db.Boolean, default=False)

    logs = db.relationship("HabitLog", backref="habit", lazy="joined", cascade="all, delete-orphan")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "color": self.color,
            "icon": self.icon,
            "frequency": self.frequency,
            "targetPerPeriod": self.target_per_period,
            "archived": self.archived,
            "logs": [log.to_dict() for log in self.logs],
        }


class HabitLog(BaseModel):
    __tablename__ = "habit_logs"

    habit_id = db.Column(db.String(36), db.ForeignKey("habits.id"), nullable=False, index=True)
    date = db.Column(db.Date, nullable=False, index=True)

    def to_dict(self) -> dict:
        return {"id": self.id, "date": self.date.isoformat()}


class Note(BaseModel):
    __tablename__ = "notes"

    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    title = db.Column(db.String(200), nullable=True)
    content = db.Column(db.Text, nullable=True)
    color = db.Column(db.String(20), default="#F1F0FE")
    pinned = db.Column(db.Boolean, default=False)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "color": self.color,
            "pinned": self.pinned,
            "updatedAt": self.updated_at.isoformat(),
        }


class AuditLog(BaseModel):
    __tablename__ = "audit_logs"

    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    action = db.Column(db.String(30), nullable=False)  # create | update | delete
    entity = db.Column(db.String(30), nullable=False)  # event | task | category | habit | note
    entity_id = db.Column(db.String(36), nullable=True)
    description = db.Column(db.String(300), nullable=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "action": self.action,
            "entity": self.entity,
            "entityId": self.entity_id,
            "description": self.description,
            "createdAt": self.created_at.isoformat(),
        }
