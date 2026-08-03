"""Helpers para padronizar respostas JSON da API."""
from flask import jsonify


def success(data=None, message: str = "", status: int = 200, meta: dict | None = None):
    payload = {"success": True, "message": message, "data": data}
    if meta:
        payload["meta"] = meta
    return jsonify(payload), status


def error(message: str = "Erro inesperado", status: int = 400, errors: dict | None = None):
    payload = {"success": False, "message": message}
    if errors:
        payload["errors"] = errors
    return jsonify(payload), status


class ApiError(Exception):
    """Exceção de domínio, convertida em resposta HTTP pelo error handler global."""

    def __init__(self, message: str, status: int = 400, errors: dict | None = None):
        super().__init__(message)
        self.message = message
        self.status = status
        self.errors = errors
