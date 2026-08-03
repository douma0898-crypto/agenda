"""
Loader de .env tolerante a problemas comuns quando o arquivo é editado no
Windows (Bloco de Notas salvando em UTF-16, BOM, aspas em volta do valor,
espaços extras, CRLF, etc). Usado como reforço além do python-dotenv normal,
porque em alguns casos o python-dotenv falha silenciosamente (não dá erro,
só não carrega nada) e o usuário fica sem saber por quê.
"""
import os


def _try_decode(raw: bytes) -> tuple[str, str] | None:
    for encoding in ("utf-8-sig", "utf-16", "utf-16-le", "utf-16-be", "latin-1"):
        try:
            return raw.decode(encoding), encoding
        except (UnicodeDecodeError, UnicodeError):
            continue
    return None


def load_env_robust(env_path: str) -> dict:
    """Lê o .env manualmente, tolerando BOM/UTF-16/aspas/espaços, e aplica as
    variáveis em os.environ. Retorna um dict de diagnóstico para exibição."""
    result = {"found": False, "encoding": None, "raw_preview": "", "loaded_keys": [], "error": None}

    if not os.path.isfile(env_path):
        return result

    result["found"] = True

    with open(env_path, "rb") as f:
        raw = f.read()

    decoded_pair = _try_decode(raw)
    if not decoded_pair:
        result["error"] = "Não consegui decodificar o arquivo em nenhuma codificação conhecida."
        return result

    content, encoding = decoded_pair
    result["encoding"] = encoding
    content = content.lstrip("\ufeff")  # remove BOM residual se houver

    loaded_keys = []
    for line in content.splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip()
        # Remove aspas envolvendo o valor, se houver (comuns quando editado em editores de texto)
        if len(value) >= 2 and value[0] == value[-1] and value[0] in ("'", '"'):
            value = value[1:-1]
        if key:
            os.environ[key] = value
            loaded_keys.append(key)

    result["loaded_keys"] = loaded_keys
    # Preview mascarando qualquer coisa que pareça senha/token, só para diagnóstico visual
    preview_lines = []
    for line in content.splitlines()[:20]:
        if "PASSWORD" in line.upper() or "TOKEN" in line.upper() or "SECRET" in line.upper() or "AUTH" in line.upper():
            key_part = line.split("=")[0] if "=" in line else line
            preview_lines.append(f"{key_part}=********")
        else:
            preview_lines.append(line)
    result["raw_preview"] = "\n".join(preview_lines)

    return result
