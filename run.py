import logging
import os
import sys

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BACKEND_DIR, ".env")
sys.path.insert(0, BACKEND_DIR)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)

from app.utils.env_loader import load_env_robust  # noqa: E402

if os.path.isfile(ENV_PATH):
    diag = load_env_robust(ENV_PATH)
    if not diag["loaded_keys"]:
        print(f"⚠️  Encontrei o .env em {ENV_PATH}, mas não consegui ler nenhuma variável dele.")
        print("   Confira se o formato é CHAVE=valor, uma por linha.")
else:
    print(f"⚠️  Nenhum arquivo .env encontrado em {ENV_PATH} — usando apenas valores padrão.")
    print("   Se você configurou e-mail/SMTP e ele não está funcionando, confira se o arquivo")
    print("   não ficou salvo como '.env.txt' (extensão escondida pelo Windows Explorer).")

from app import create_app

app = create_app(os.getenv("FLASK_ENV", "development"))

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)), debug=app.config.get("DEBUG", True))
