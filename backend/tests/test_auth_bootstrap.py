import os
import tempfile

from sqlalchemy import inspect

from app import create_app
from app.extensions import db


def test_register_creates_user_and_tables():
    with tempfile.TemporaryDirectory() as tmpdir:
        db_path = os.path.join(tmpdir, "agenda.db")
        os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"
        os.environ["SECRET_KEY"] = "test-secret"
        os.environ["JWT_SECRET_KEY"] = "test-jwt-secret"

        app = create_app("production")
        app.config.update(TESTING=True)

        with app.app_context():
            inspector = inspect(db.engine)
            assert inspector.has_table("users")

        client = app.test_client()
        response = client.post(
            "/api/auth/register",
            json={
                "name": "Test User",
                "email": "test@example.com",
                "password": "StrongPass123!",
            },
        )

        assert response.status_code == 201
        payload = response.get_json()
        assert payload["success"] is True
        assert payload["data"]["user"]["email"] == "test@example.com"
