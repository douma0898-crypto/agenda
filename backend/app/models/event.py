from app.extensions import db
from app.models.base import BaseModel
from app.models.tag import event_tags


class Event(BaseModel):
    __tablename__ = "events"

    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    category_id = db.Column(db.String(36), db.ForeignKey("categories.id"), nullable=True, index=True)

    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    color = db.Column(db.String(20), nullable=True)  # sobrescreve a cor da categoria, se definida
    icon = db.Column(db.String(40), nullable=True)

    location = db.Column(db.String(300), nullable=True)
    link = db.Column(db.String(500), nullable=True)
    participants = db.Column(db.Text, nullable=True)  # JSON stringificado: [{name, email}]
    phone = db.Column(db.String(30), nullable=True)
    contact_email = db.Column(db.String(180), nullable=True)

    # Origem do evento: manual | booking_link (criado por alguém via link público de agendamento)
    source = db.Column(db.String(20), default="manual")

    start_at = db.Column(db.DateTime, nullable=False, index=True)
    end_at = db.Column(db.DateTime, nullable=False, index=True)
    all_day = db.Column(db.Boolean, default=False)

    # Recorrência simples: none | daily | weekly | monthly | yearly
    recurrence = db.Column(db.String(20), default="none")
    recurrence_end = db.Column(db.DateTime, nullable=True)

    priority = db.Column(db.String(10), default="medium")  # low | medium | high | urgent
    status = db.Column(db.String(20), default="scheduled")  # scheduled | in_progress | done | canceled
    notes = db.Column(db.Text, nullable=True)

    estimated_minutes = db.Column(db.Integer, nullable=True)
    actual_minutes = db.Column(db.Integer, nullable=True)

    is_favorite = db.Column(db.Boolean, default=False)

    tags = db.relationship("Tag", secondary=event_tags, backref="events", lazy="joined")
    reminders = db.relationship("Reminder", backref="event", lazy="joined", cascade="all, delete-orphan")
    attachments = db.relationship("Attachment", backref="event", lazy="joined", cascade="all, delete-orphan")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "categoryId": self.category_id,
            "title": self.title,
            "description": self.description,
            "color": self.color or (self.category.color if self.category else "#3454D1"),
            "icon": self.icon,
            "location": self.location,
            "link": self.link,
            "participants": self.participants,
            "phone": self.phone,
            "contactEmail": self.contact_email,
            "source": self.source,
            "startAt": self.start_at.isoformat(),
            "endAt": self.end_at.isoformat(),
            "allDay": self.all_day,
            "recurrence": self.recurrence,
            "recurrenceEnd": self.recurrence_end.isoformat() if self.recurrence_end else None,
            "priority": self.priority,
            "status": self.status,
            "notes": self.notes,
            "estimatedMinutes": self.estimated_minutes,
            "actualMinutes": self.actual_minutes,
            "isFavorite": self.is_favorite,
            "tags": [t.to_dict() for t in self.tags],
            "reminders": [r.to_dict() for r in self.reminders],
            "attachments": [a.to_dict() for a in self.attachments],
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat(),
        }
