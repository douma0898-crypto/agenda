from app.extensions import db
from app.models.base import BaseModel


class Category(BaseModel):
    __tablename__ = "categories"

    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    name = db.Column(db.String(80), nullable=False)
    color = db.Column(db.String(20), nullable=False, default="#3454D1")
    icon = db.Column(db.String(40), nullable=False, default="folder")
    description = db.Column(db.String(300), nullable=True)

    events = db.relationship("Event", backref="category", lazy="dynamic")
    tasks = db.relationship("Task", backref="category", lazy="dynamic")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "color": self.color,
            "icon": self.icon,
            "description": self.description,
        }
