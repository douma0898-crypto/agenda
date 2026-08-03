from app.extensions import db
from app.models.base import BaseModel
from app.models.tag import task_tags


class Task(BaseModel):
    __tablename__ = "tasks"

    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    category_id = db.Column(db.String(36), db.ForeignKey("categories.id"), nullable=True, index=True)

    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    due_date = db.Column(db.DateTime, nullable=True, index=True)
    priority = db.Column(db.String(10), default="medium")  # low | medium | high | urgent
    status = db.Column(db.String(20), default="pending")  # pending | in_progress | done
    estimated_minutes = db.Column(db.Integer, nullable=True)
    is_favorite = db.Column(db.Boolean, default=False)
    completed_at = db.Column(db.DateTime, nullable=True)

    checklist = db.relationship(
        "TaskChecklist", backref="task", lazy="joined",
        cascade="all, delete-orphan", order_by="TaskChecklist.position",
    )
    tags = db.relationship("Tag", secondary=task_tags, backref="tasks", lazy="joined")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "categoryId": self.category_id,
            "title": self.title,
            "description": self.description,
            "dueDate": self.due_date.isoformat() if self.due_date else None,
            "priority": self.priority,
            "status": self.status,
            "estimatedMinutes": self.estimated_minutes,
            "isFavorite": self.is_favorite,
            "completedAt": self.completed_at.isoformat() if self.completed_at else None,
            "checklist": [c.to_dict() for c in self.checklist],
            "tags": [t.to_dict() for t in self.tags],
            "createdAt": self.created_at.isoformat(),
        }


class TaskChecklist(BaseModel):
    __tablename__ = "task_checklist"

    task_id = db.Column(db.String(36), db.ForeignKey("tasks.id"), nullable=False, index=True)
    title = db.Column(db.String(200), nullable=False)
    done = db.Column(db.Boolean, default=False)
    position = db.Column(db.Integer, default=0)

    def to_dict(self) -> dict:
        return {"id": self.id, "title": self.title, "done": self.done, "position": self.position}
