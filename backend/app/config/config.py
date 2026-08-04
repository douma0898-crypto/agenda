"""
Configurações centrais da aplicação.

Todas as opções sensíveis podem ser sobrescritas por variáveis de ambiente
(veja o arquivo .env.example na raiz do backend).
"""
import os
import re
from datetime import timedelta

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


def _get_database_uri() -> str:
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        return f"sqlite:///{os.path.join(BASE_DIR, 'database', 'agenda.db')}"

    if database_url.startswith(("postgres://", "postgresql://")):
        database_url = database_url.replace("postgres://", "postgresql+psycopg://", 1)
        database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)

    return database_url


# Regex que libera qualquer IP da rede local (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
# além de localhost/127.0.0.1, em qualquer porta. Usado no modo desenvolvimento
# para que o app funcione ao ser acessado de outros dispositivos (ex: celular)
# na mesma rede Wi-Fi.
LOCAL_NETWORK_ORIGIN_REGEX = re.compile(
    r"^https?://("
    r"localhost"
    r"|127\.0\.0\.1"
    r"|192\.168\.\d{1,3}\.\d{1,3}"
    r"|10\.\d{1,3}\.\d{1,3}\.\d{1,3}"
    r"|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}"
    r")(:\d+)?$"
)


def _get_cors_origins() -> list[str]:
    configured = os.getenv("CORS_ORIGINS", "").strip()
    if configured:
        return [origin.strip() for origin in configured.split(",") if origin.strip()]

    if os.getenv("FLASK_ENV", "development") == "production":
        return ["*"]

    return [LOCAL_NETWORK_ORIGIN_REGEX]


class Config:
    """Configuração base, compartilhada por todos os ambientes."""

    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret-change-me")

    SQLALCHEMY_DATABASE_URI = _get_database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"

    CORS_ORIGINS = _get_cors_origins()
    DEFAULT_PAGE_SIZE = 20
    MAX_PAGE_SIZE = 100

class DevelopmentConfig(Config):
    DEBUG = True
    # Se o usuário definir CORS_ORIGINS no .env, respeita a lista explícita.
    # Caso contrário, libera automaticamente localhost e qualquer IP de rede
    # local (necessário para acessar o app pelo celular/outro dispositivo).
    CORS_ORIGINS = (
        os.getenv("CORS_ORIGINS").split(",")
        if os.getenv("CORS_ORIGINS")
        else [LOCAL_NETWORK_ORIGIN_REGEX]
    )


class ProductionConfig(Config):
    DEBUG = False


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"


config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
}
