"""
Estrutura preparada para integração com o Google Calendar.

Implementar de fato exige credenciais OAuth2 do Google Cloud Console
(client_id/client_secret) configuradas via variáveis de ambiente, e a
biblioteca `google-api-python-client` + `google-auth-oauthlib`. Os
endpoints abaixo já definem o contrato esperado pelo frontend
(`/api/integrations/google-calendar/*`), retornando "não configurado"
até que as credenciais sejam adicionadas ao `.env`.
"""
import os

from flask import Blueprint
from flask_jwt_extended import jwt_required

from app.utils.responses import success, error

integration_bp = Blueprint("integrations", __name__, url_prefix="/api/integrations")


def _google_configured() -> bool:
    return bool(os.getenv("GOOGLE_CLIENT_ID") and os.getenv("GOOGLE_CLIENT_SECRET"))


@integration_bp.get("/google-calendar/status")
@jwt_required()
def google_calendar_status():
    return success({
        "configured": _google_configured(),
        "connected": False,
        "message": "Defina GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no .env para habilitar."
        if not _google_configured() else "Pronto para autenticação.",
    })


@integration_bp.get("/google-calendar/connect")
@jwt_required()
def google_calendar_connect():
    if not _google_configured():
        return error("Integração com Google Calendar não configurada neste ambiente", status=501)
    # Aqui entraria a geração da URL de autorização OAuth2 (Flow.from_client_config(...).authorization_url()).
    return success({"authorizationUrl": None}, "Fluxo OAuth2 ainda não implementado nesta instância")


@integration_bp.post("/google-calendar/disconnect")
@jwt_required()
def google_calendar_disconnect():
    return success(message="Nenhuma conta conectada")
