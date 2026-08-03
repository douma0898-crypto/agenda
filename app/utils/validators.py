import re
from datetime import datetime

from app.utils.responses import ApiError

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def require_fields(payload: dict, fields: list[str]) -> None:
    missing = [f for f in fields if payload.get(f) in (None, "")]
    if missing:
        raise ApiError(
            "Campos obrigatórios ausentes",
            status=422,
            errors={f: "Este campo é obrigatório" for f in missing},
        )


def validate_email(email: str) -> None:
    if not EMAIL_RE.match(email or ""):
        raise ApiError("E-mail inválido", status=422, errors={"email": "Formato inválido"})


def validate_password(password: str) -> None:
    if not password or len(password) < 6:
        raise ApiError(
            "Senha inválida", status=422,
            errors={"password": "A senha deve ter ao menos 6 caracteres"},
        )


def parse_iso_datetime(value: str, field_name: str = "data") -> datetime:
    try:
        # Aceita tanto "Z" quanto offset explícito
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except (ValueError, AttributeError, TypeError):
        raise ApiError(f"Formato de {field_name} inválido", status=422)
