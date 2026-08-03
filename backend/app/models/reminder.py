from app.extensions import db
from app.models.base import BaseModel


class Reminder(BaseModel):
    __tablename__ = "reminders"

    event_id = db.Column(db.String(36), db.ForeignKey("events.id"), nullable=False, index=True)
    # em minutos antes do evento (ex.: 10, 30, 60, 120, 360, 720, 1440, 2880, 10080) ou custom
    minutes_before = db.Column(db.Integer, nullable=False)
    label = db.Column(db.String(60), nullable=True)
    triggered = db.Column(db.Boolean, default=False)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "eventId": self.event_id,
            "minutesBefore": self.minutes_before,
            "label": self.label,
            "triggered": self.triggered,
        }


class Attachment(BaseModel):
    __tablename__ = "attachments"

    event_id = db.Column(db.String(36), db.ForeignKey("events.id"), nullable=True, index=True)
    task_id = db.Column(db.String(36), db.ForeignKey("tasks.id"), nullable=True, index=True)
    file_name = db.Column(db.String(255), nullable=False)
    file_url = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer, nullable=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "fileName": self.file_name,
            "fileUrl": self.file_url,
            "fileSize": self.file_size,
        }
