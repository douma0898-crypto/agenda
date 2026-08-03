"""
Testa a configuração de envio de WhatsApp (WhatsApp Cloud API) isoladamente.

Uso:
    python test_whatsapp.py +245957112523 "Mensagem de teste"

Se `WHATSAPP_TOKEN` e `WHATSAPP_PHONE_ID` não estiverem no `.env`, o
env_loader tentará carregar o `.env`. Sem configuração as chamadas são
simuladas no log (modo dev) — assim o restante do sistema pode ser
testado sem conta do WhatsApp Cloud.
"""
import os
import sys

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BACKEND_DIR, ".env")


def diagnose_env_file():
    if os.path.isfile(ENV_PATH):
        return True

    print(f"❌ Não encontrei o arquivo .env em: {ENV_PATH}\n")
    suspects = [f for f in os.listdir(BACKEND_DIR) if f.lower().startswith(".env")]
    if suspects:
        print("   Encontrei estes arquivos parecidos na mesma pasta:")
        for s in suspects:
            print(f"     - {s}")
        if any(s.lower().endswith(".txt") for s in suspects):
            print("\n   ⚠️  Isso é o problema clássico do Windows: o Explorer esconde a extensão")
    else:
        print(f"   Nenhum arquivo .env* encontrado em {BACKEND_DIR}.")
    return False


def main():
    if len(sys.argv) < 2:
        print("Uso: python test_whatsapp.py +245957112523 'Mensagem opcional'")
        sys.exit(1)

    if not diagnose_env_file():
        sys.exit(1)

    sys.path.insert(0, BACKEND_DIR)
    from app.utils.env_loader import load_env_robust

    diag = load_env_robust(ENV_PATH)
    print(f"📄 Arquivo lido com codificação detectada: {diag.get('encoding')}")
    print(f"🔑 Variáveis carregadas: {', '.join(diag.get('loaded_keys') or []) or '(nenhuma!)'}\n")

    if not diag.get("loaded_keys"):
        print("❌ Não consegui extrair nenhuma variável do arquivo. Conteúdo lido (senhas mascaradas):")
        print("   " + "\n   ".join(diag.get("raw_preview", "").splitlines() or ["(arquivo vazio)"]))
        print("\n   Confirme se cada linha está no formato CHAVE=valor, uma por linha, sem espaços antes do '='.")
        sys.exit(1)

    from app.services.whatsapp_service import send_whatsapp, is_configured

    to_number = sys.argv[1]
    message = sys.argv[2] if len(sys.argv) > 2 else "Mensagem de teste do Agenda"

    configured = is_configured()
    print(f"⚙️  WhatsApp Cloud API configurada: {configured}")
    if configured:
        print("✉️  Tentando enviar mensagem de teste...")
    else:
        print("✉️  Modo dev: a chamada será registrada no log (não enviada).")

    ok = send_whatsapp(to_number, message)
    if ok:
        print("✅ Mensagem enviada (ou simulada com sucesso)")
    else:
        print("❌ Falha ao enviar mensagem via WhatsApp")
        sys.exit(1)


if __name__ == "__main__":
    main()
