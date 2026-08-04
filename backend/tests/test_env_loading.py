import importlib
import os


def test_load_env_file_reads_backend_dotenv(monkeypatch):
    monkeypatch.delenv("SECRET_KEY", raising=False)
    monkeypatch.delenv("JWT_SECRET_KEY", raising=False)

    app_module = importlib.import_module("app")
    importlib.reload(app_module)
    app_module._load_env_file()

    assert os.getenv("SECRET_KEY") == "change-me-in-production"
    assert os.getenv("JWT_SECRET_KEY") == "change-me-in-production"
