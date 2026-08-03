from functools import wraps

from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

from app.models import User
from app.utils.responses import ApiError


def get_current_user() -> User:
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        raise ApiError("Usuário não encontrado", status=404)
    return user


def login_required(fn):
    """Garante que a requisição tem um JWT válido antes de executar a view."""

    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        return fn(*args, **kwargs)

    return wrapper
