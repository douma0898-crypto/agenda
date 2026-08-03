"""
Testa a configuração de e-mail (SMTP) isoladamente, sem precisar subir o
Flask nem passar pelo app inteiro. Útil para descobrir rapidamente por que
os e-mails não estão saindo de verdade.

Uso:
    python test_email.py seuemail-de-destino@gmail.com
"""
import os
import sys

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BACKEND_DIR, ".env")


def diagnose_env_file():
    """Verifica problemas comuns antes mesmo de tentar carregar o .env —
    principalmente no Windows, onde o Explorer costuma esconder a extensão
    .txt e o arquivo acaba se chamando '.env.txt' sem o usuário perceber."""
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
            print("      '.txt', então seu arquivo provavelmente se chama '.env.txt' de verdade,")
            print("      não '.env'. Para corrigir:")
            print("      1. No Explorer, vá em Exibir > Mostrar > Extensões de nome de arquivo (marque)")
            print("      2. Renomeie o arquivo removendo o '.txt' do final, deixando só '.env'")
    else:
        print(f"   Nenhum arquivo .env* encontrado em {BACKEND_DIR}.")
        print("   Copie o .env.example para .env nessa mesma pasta e preencha com suas credenciais:")
        print(f"     copy .env.example .env   (rode isso dentro de {BACKEND_DIR})")

    return False


def main():
    if len(sys.argv) < 2:
        print("Uso: python test_email.py seuemail-de-destino@gmail.com")
        sys.exit(1)

    if not diagnose_env_file():
        sys.exit(1)

    sys.path.insert(0, BACKEND_DIR)
    from app.utils.env_loader import load_env_robust

    diag = load_env_robust(ENV_PATH)
    print(f"📄 Arquivo lido com codificação detectada: {diag['encoding']}")
    print(f"🔑 Variáveis carregadas: {', '.join(diag['loaded_keys']) or '(nenhuma!)'}\n")

    if not diag["loaded_keys"]:
        print("❌ Não consegui extrair nenhuma variável do arquivo. Conteúdo lido (senhas mascaradas):")
        print("   " + "\n   ".join(diag["raw_preview"].splitlines() or ["(arquivo vazio)"]))
        print("\n   Confirme se cada linha está no formato CHAVE=valor, uma por linha, sem espaços antes do '='.")
        sys.exit(1)

    from app.services.email_service import send_email, _smtp_config

    destino = sys.argv[1]
    config = _smtp_config()

    if not config:
        print("❌ As variáveis foram lidas do arquivo, mas SMTP_HOST ficou vazio ou ausente.")
        print("   Conteúdo lido (senhas mascaradas):")
        print("   " + "\n   ".join(diag["raw_preview"].splitlines()))
        sys.exit(1)

    print(f"📡 Configuração encontrada: {config['host']}:{config['port']} (usuário: {config['user']})")
    print(f"✉️  Enviando e-mail de teste para {destino}...")

    ok, detail = send_email(
        destino,
        "Teste de configuração — Agenda",
        "<p>Se você está lendo isso, o SMTP do seu Agenda está funcionando! ✅</p>",
        "Se você está lendo isso, o SMTP do seu Agenda está funcionando!",
    )

    if ok:
        print(f"✅ Sucesso: {detail}")
        print("   Confira a caixa de entrada (e o spam) de", destino)
    else:
        print(f"❌ Falha: {detail}")
        sys.exit(1)


if __name__ == "__main__":
    main()
