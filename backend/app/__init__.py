import logging
import os

from flask import Flask
from sqlalchemy import inspect

from app.config.config import config_by_name
from app.extensions import db, migrate, jwt, cors
from app.models import User
from app.utils.env_loader import load_env_robust
from app.utils.error_handlers import register_error_handlers
from app.utils.responses import error


def create_app(env: str | None = None) -> Flask:
    env = env or os.getenv("FLASK_ENV", "development")
    app = Flask(__name__)

    _load_env_file()
    app.config.from_object(config_by_name[env])

    # Garante que a pasta do banco de dados SQLite existe apenas quando usamos SQLite.
    database_uri = app.config.get("SQLALCHEMY_DATABASE_URI", "")
    if database_uri.startswith("sqlite:"):
        sqlite_path = os.path.join(os.path.dirname(__file__), "..", "database")
        os.makedirs(sqlite_path, exist_ok=True)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    supports_credentials = not any(origin == "*" for origin in app.config["CORS_ORIGINS"])
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        supports_credentials=supports_credentials,
    )

    register_error_handlers(app)
    register_jwt_callbacks(jwt)
    register_blueprints(app)
    initialize_database(app)
    ensure_notification_defaults(app)

    @app.get("/api/health")
    def health():
        return {"success": True, "message": "API online", "data": {"status": "ok"}}

    return app


def _load_env_file() -> None:
    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    env_path = os.path.join(backend_dir, ".env")
    if not os.path.isfile(env_path):
        logging.debug("Nenhum .env encontrado em %s", env_path)
        return

    diag = load_env_robust(env_path)
    if diag["loaded_keys"]:
        logging.info("Variáveis de ambiente carregadas do %s: %s", env_path, ", ".join(diag["loaded_keys"]))
    else:
        logging.warning("O arquivo %s foi encontrado, mas não carregou variáveis: %s", env_path, diag.get("error"))


def initialize_database(app: Flask) -> None:
    with app.app_context():
        try:
            inspector = inspect(db.engine)
            if not inspector.has_table(User.__tablename__):
                logging.info("Criando tabelas do banco de dados...")
                db.create_all()
                logging.info("Tabelas criadas com sucesso.")
        except Exception as exc:
            logging.exception("Falha ao inicializar o banco de dados: %s", exc)


def ensure_notification_defaults(app: Flask) -> None:
    with app.app_context():
        inspector = inspect(db.engine)
        if not inspector.has_table(User.__tablename__):
            logging.debug("Tabela users não existe ainda; pulando ajustes de notificação.")
            return

        updated = User.query.filter_by(notify_email=False).update({"notify_email": True})
        if updated:
            db.session.commit()


def register_blueprints(app: Flask) -> None:
    from app.routes.auth_routes import auth_bp
    from app.routes.category_routes import category_bp
    from app.routes.event_routes import event_bp
    from app.routes.task_routes import task_bp
    from app.routes.dashboard_routes import dashboard_bp
    from app.routes.notification_routes import notification_bp
    from app.routes.habit_routes import habit_bp
    from app.routes.note_routes import note_bp
    from app.routes.attachment_routes import attachment_bp
    from app.routes.export_routes import export_bp
    from app.routes.import_routes import import_bp
    from app.routes.backup_routes import backup_bp
    from app.routes.integration_routes import integration_bp
    from app.routes.booking_routes import booking_bp, public_booking_bp
    from app.routes.collaboration_routes import collaboration_bp
    from app.routes.analytics_exec_routes import analytics_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(category_bp)
    app.register_blueprint(event_bp)
    app.register_blueprint(task_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(notification_bp)
    app.register_blueprint(habit_bp)
    app.register_blueprint(note_bp)
    app.register_blueprint(attachment_bp)
    app.register_blueprint(export_bp)
    app.register_blueprint(import_bp)
    app.register_blueprint(backup_bp)
    app.register_blueprint(integration_bp)
    app.register_blueprint(booking_bp)
    app.register_blueprint(public_booking_bp)
    app.register_blueprint(collaboration_bp)
    app.register_blueprint(analytics_bp)


def register_jwt_callbacks(jwt_manager) -> None:
    @jwt_manager.unauthorized_loader
    def unauthorized(reason):
        return error("Token de autenticação ausente", status=401, errors={"auth": reason})

    @jwt_manager.invalid_token_loader
    def invalid_token(reason):
        return error("Token de autenticação inválido", status=401, errors={"auth": reason})

    @jwt_manager.expired_token_loader
    def expired_token(_jwt_header, _jwt_payload):
        return error("Sessão expirada, faça login novamente", status=401)
