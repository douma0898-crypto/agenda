from werkzeug.security import generate_password_hash, check_password_hash

from app.extensions import db
from app.models.base import BaseModel


class User(BaseModel):
    __tablename__ = "users"

    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(180), nullable=False, unique=True, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    avatar_url = db.Column(db.String(500), nullable=True)

    # Preferências de usuário (settings)
    theme = db.Column(db.String(10), default="dark")  # dark | light
    primary_color = db.Column(db.String(20), default="#3454D1")
    language = db.Column(db.String(10), default="pt-BR")
    time_format = db.Column(db.String(5), default="24h")  # 24h | 12h
    date_format = db.Column(db.String(20), default="DD/MM/YYYY")
    timezone = db.Column(db.String(60), default="America/Sao_Paulo")

    # Agendamento por link público (estilo Calendly)
    public_slug = db.Column(db.String(80), unique=True, index=True, nullable=True)
    booking_enabled = db.Column(db.Boolean, default=True)
    booking_slot_minutes = db.Column(db.Integer, default=30)
    booking_work_start = db.Column(db.String(5), default="09:00")  # HH:MM
    booking_work_end = db.Column(db.String(5), default="18:00")  # HH:MM
    booking_work_days = db.Column(db.String(20), default="1,2,3,4,5")  # 0=Dom ... 6=Sáb
    booking_days_ahead = db.Column(db.Integer, default=14)
    booking_notice_minutes = db.Column(db.Integer, default=60)  # antecedência mínima
    booking_title = db.Column(db.String(200), default="Reunião")
    booking_description = db.Column(db.Text, nullable=True)

    # Notificações premium
    notify_email = db.Column(db.Boolean, default=True)
    notify_push = db.Column(db.Boolean, default=True)
    notify_desktop = db.Column(db.Boolean, default=True)
    notify_sms = db.Column(db.Boolean, default=False)
    notify_whatsapp = db.Column(db.Boolean, default=False)
    notify_sound = db.Column(db.String(30), default="default")  # default | chime | ping | none
    notify_vibration = db.Column(db.Boolean, default=True)
    phone_number = db.Column(db.String(30), nullable=True)

    events = db.relationship("Event", backref="owner", lazy="dynamic", cascade="all, delete-orphan")
    categories = db.relationship("Category", backref="owner", lazy="dynamic", cascade="all, delete-orphan")
    tasks = db.relationship("Task", backref="owner", lazy="dynamic", cascade="all, delete-orphan")

    def set_password(self, raw_password: str) -> None:
        self.password_hash = generate_password_hash(raw_password)

    def check_password(self, raw_password: str) -> bool:
        return check_password_hash(self.password_hash, raw_password)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "avatarUrl": self.avatar_url,
            "theme": self.theme,
            "primaryColor": self.primary_color,
            "language": self.language,
            "timeFormat": self.time_format,
            "dateFormat": self.date_format,
            "timezone": self.timezone,
            "createdAt": self.created_at.isoformat(),
            "booking": self.booking_settings_dict(),
            "notifications": self.notification_settings_dict(),
        }

    def notification_settings_dict(self) -> dict:
        return {
            "email": self.notify_email,
            "push": self.notify_push,
            "desktop": self.notify_desktop,
            "sms": self.notify_sms,
            "whatsapp": self.notify_whatsapp,
            "sound": self.notify_sound,
            "vibration": self.notify_vibration,
            "phoneNumber": self.phone_number,
        }

    def booking_settings_dict(self) -> dict:
        return {
            "publicSlug": self.public_slug,
            "enabled": self.booking_enabled,
            "slotMinutes": self.booking_slot_minutes,
            "workStart": self.booking_work_start,
            "workEnd": self.booking_work_end,
            "workDays": [int(d) for d in self.booking_work_days.split(",") if d != ""],
            "daysAhead": self.booking_days_ahead,
            "noticeMinutes": self.booking_notice_minutes,
            "title": self.booking_title,
            "description": self.booking_description,
        }
