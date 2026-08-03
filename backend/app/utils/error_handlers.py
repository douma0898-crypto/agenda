import logging

from flask import Flask
from werkzeug.exceptions import HTTPException

from app.utils.responses import error, ApiError

logger = logging.getLogger("agenda_api")


def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(ApiError)
    def handle_api_error(err: ApiError):
        return error(err.message, status=err.status, errors=err.errors)

    @app.errorhandler(HTTPException)
    def handle_http_error(err: HTTPException):
        return error(err.description or "Erro na requisição", status=err.code or 500)

    @app.errorhandler(Exception)
    def handle_unexpected_error(err: Exception):
        logger.exception("Erro inesperado")
        return error("Erro interno do servidor", status=500)

    @app.errorhandler(404)
    def handle_not_found(_):
        return error("Recurso não encontrado", status=404)
