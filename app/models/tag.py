from app.extensions import db
from app.models.base import BaseModel

# Tabelas de associação muitos-para-muitos
event_tags = db.Table(
    "event_tags",
    db.Column("event_id", db.String(36), db.ForeignKey("events.id"), primary_key=True),
    db.Column("tag_id", db.String(36), db.ForeignKey("tags.id"), primary_key=True),
)

task_tags = db.Table(
    "task_tags",
    db.Column("task_id", db.String(36), db.ForeignKey("tasks.id"), primary_key=True),
    db.Column("tag_id", db.String(36), db.ForeignKey("tags.id"), primary_key=True),
)


class Tag(BaseModel):
    __tablename__ = "tags"

    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    name = db.Column(db.String(60), nullable=False)
    color = db.Column(db.String(20), nullable=False, default="#94A3B8")

    def to_dict(self) -> dict:
        return {"id": self.id, "name": self.name, "color": self.color}
