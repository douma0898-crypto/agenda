"""
Serviço de envio de e-mail (SMTP puro, sem dependências extras).

Configuração via variáveis de ambiente (.env):
    SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, SMTP_USE_TLS

Se o SMTP não estiver configurado, os e-mails são apenas registrados no log
(modo desenvolvimento), para que o restante do fluxo (agendamento, etc.)
continue funcionando normalmente mesmo sem um provedor de e-mail definido.
"""
import logging
import os
import re
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formatdate, make_msgid

from app.utils.env_loader import load_env_robust

logger = logging.getLogger("agenda_api")


def _load_env_if_needed() -> None:
    if os.getenv("SMTP_HOST"):
        return

    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    env_path = os.path.join(backend_dir, ".env")
    if not os.path.isfile(env_path):
        logger.debug("SMTP config not found in environment and no .env present at %s", env_path)
        return

    diag = load_env_robust(env_path)
    if diag["loaded_keys"]:
        logger.info("Carreguei variáveis de ambiente do %s: %s", env_path, ", ".join(diag["loaded_keys"]))
    else:
        logger.warning("O arquivo %s foi encontrado, mas não carregou chaves válidas: %s", env_path, diag.get("error"))


def _smtp_config() -> dict | None:
    _load_env_if_needed()
    host = os.getenv("SMTP_HOST")
    if not host:
        return None
    return {
        "host": host,
        "port": int(os.getenv("SMTP_PORT", "587")),
        "user": os.getenv("SMTP_USER", ""),
        "password": os.getenv("SMTP_PASSWORD", ""),
        "from_email": os.getenv("SMTP_FROM", os.getenv("SMTP_USER", "no-reply@agenda.app")),
        "from_name": os.getenv("SMTP_FROM_NAME", "Agenda"),
        "use_tls": os.getenv("SMTP_USE_TLS", "true").lower() != "false",
    }


def _html_to_text(html: str) -> str:
    text = re.sub(r"<head>.*?</head>", "", html, flags=re.S | re.I)
    text = re.sub(r"<style.*?>.*?</style>", "", text, flags=re.S | re.I)
    text = re.sub(r"<script.*?>.*?</script>", "", text, flags=re.S | re.I)
    text = re.sub(r"<a[^>]+href=[\"']([^\"']+)[\"'][^>]*>(.*?)</a>", r"\2 (\1)", text, flags=re.S | re.I)
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def send_email(to_email: str, subject: str, html_body: str, text_body: str | None = None) -> tuple[bool, str]:
    """Envia um e-mail. Retorna (sucesso, mensagem) — a mensagem ajuda a diagnosticar falhas reais de SMTP."""
    config = _smtp_config()

    if not config:
        logger.info("[EMAIL-DEV] (SMTP não configurado) Para: %s | Assunto: %s\n%s",
                     to_email, subject, text_body or html_body)
        return True, "SMTP não configurado — e-mail apenas simulado no log (modo dev)"

    raw_addresses = to_email.strip()
    separators = [",", ";"]
    for sep in separators:
        raw_addresses = raw_addresses.replace(sep, ",")
    recipients = [address.strip() for address in raw_addresses.split(",") if address.strip()]
    message = MIMEMultipart("alternative")
    message["Subject"] = subject.strip()
    message["From"] = f"{config['from_name']} <{config['from_email']}>"
    message["Sender"] = config["user"] or config["from_email"]
    message["To"] = ", ".join(recipients)
    message["Reply-To"] = config["from_email"]
    message["Date"] = formatdate(localtime=False)
    message["Message-ID"] = make_msgid()
    message["X-Mailer"] = "Agenda"
    message["X-Priority"] = "3"
    message["Importance"] = "normal"

    if text_body is None:
        text_body = _html_to_text(html_body) or subject.strip()

    message.attach(MIMEText(text_body, "plain", "utf-8"))
    message.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        # Porta 465 exige conexão SSL direta; 587 (ou outras) usa STARTTLS.
        if config["port"] == 465:
            server = smtplib.SMTP_SSL(config["host"], config["port"], timeout=10)
            server.ehlo()
        else:
            server = smtplib.SMTP(config["host"], config["port"], timeout=10)
            server.ehlo()
            if config["use_tls"]:
                server.starttls()
                server.ehlo()

        with server:
            if config["user"]:
                server.login(config["user"], config["password"])
            logger.info("[EMAIL] Enviando para %s via %s", recipients, config["host"])
            server.send_message(message, from_addr=config["from_email"], to_addrs=recipients)
        return True, "E-mail enviado com sucesso"
    except smtplib.SMTPAuthenticationError:
        logger.exception("Falha de autenticação SMTP para %s", to_email)
        return False, "Usuário/senha do SMTP recusados pelo provedor (verifique SMTP_USER e SMTP_PASSWORD — para Gmail, use uma 'senha de app', não a senha normal)"
    except (smtplib.SMTPConnectError, TimeoutError, OSError) as e:
        logger.exception("Falha de conexão SMTP para %s", to_email)
        return False, f"Não foi possível conectar em {config['host']}:{config['port']} ({e})"
    except Exception as e:
        logger.exception("Falha ao enviar e-mail para %s", to_email)
        return False, f"Falha ao enviar: {e}"


def _base_layout(title: str, body_html: str) -> str:
    return f"""
    <div style="font-family: Segoe UI, Arial, sans-serif; background:#f2f5f7; padding:24px;">
      <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e9eb;">
        <div style="background:#4F46E5;padding:20px 28px;">
          <span style="color:#ffffff;font-size:18px;font-weight:700;">Agenda</span>
        </div>
        <div style="padding:28px;color:#1f2933;">
          <h2 style="margin-top:0;color:#164653;">{title}</h2>
          {body_html}
        </div>
        <div style="padding:16px 28px;background:#f7f9fa;color:#8a97a0;font-size:12px;">
          Este é um e-mail automático, não é necessário responder.
        </div>
      </div>
    </div>
    """


def send_booking_confirmation_to_guest(guest_email: str, guest_name: str, owner_name: str,
                                        start_at, end_at, title: str, location: str | None,
                                        cancel_note: str | None = None) -> tuple[bool, str]:
    date_str = start_at.strftime("%d/%m/%Y")
    time_str = f"{start_at.strftime('%H:%M')} - {end_at.strftime('%H:%M')}"
    body = f"""
      <p>Olá, {guest_name}!</p>
      <p>Seu agendamento com <strong>{owner_name}</strong> foi confirmado:</p>
      <p style="background:#EAF3F4;padding:14px 18px;border-radius:8px;">
        <strong>{title}</strong><br/>
        📅 {date_str} às {time_str}
        {f"<br/>📍 {location}" if location else ""}
      </p>
      {f"<p style='color:#8a97a0;font-size:13px'>{cancel_note}</p>" if cancel_note else ""}
    """
    html = _base_layout("Agendamento confirmado", body)
    text = f"Agendamento confirmado com {owner_name} em {date_str} às {time_str}."
    return send_email(guest_email, f"Agendamento confirmado com {owner_name}", html, text)


def send_booking_notification_to_owner(owner_email: str, owner_name: str, guest_name: str,
                                        guest_email: str, start_at, end_at, notes: str | None = None) -> tuple[bool, str]:
    date_str = start_at.strftime("%d/%m/%Y")
    time_str = f"{start_at.strftime('%H:%M')} - {end_at.strftime('%H:%M')}"
    body = f"""
      <p>Olá, {owner_name}!</p>
      <p><strong>{guest_name}</strong> ({guest_email}) marcou um horário com você pelo seu link de agendamento:</p>
      <p style="background:#FDF1EB;padding:14px 18px;border-radius:8px;">
        📅 {date_str} às {time_str}
        {f"<br/>📝 {notes}" if notes else ""}
      </p>
    """
    html = _base_layout("Novo agendamento recebido", body)
    text = f"{guest_name} marcou um horário com você em {date_str} às {time_str}."
    return send_email(owner_email, f"Novo agendamento: {guest_name}", html, text)


def send_generic_notification_email(to_email: str, title: str, message: str) -> tuple[bool, str]:
    body = f"<p>{message}</p>"
    html = _base_layout(title, body)
    return send_email(to_email, title, html, message)


def send_share_invite_email(to_email: str, owner_name: str, entity_label: str, accept_url: str) -> tuple[bool, str]:
    button_style = (
        "background:#4F46E5;color:#ffffff;padding:10px 20px;border-radius:8px;"
        "text-decoration:none;font-weight:600;display:inline-block;"
    )
    body = f"""
      <p>Olá!</p>
      <p><strong>{owner_name}</strong> compartilhou <strong>{entity_label}</strong> com você no Agenda.</p>
      <p style="margin:20px 0;">
        <a href="{accept_url}" style="{button_style}">Aceitar convite</a>
      </p>
      <p style="color:#8a97a0;font-size:13px;">
        Faça login no Agenda com este e-mail para aceitar e começar a colaborar.
      </p>
    """
    html = _base_layout("Convite de compartilhamento", body)
    text = f"{owner_name} compartilhou {entity_label} com você. Aceite em: {accept_url}"
    return send_email(to_email, f"{owner_name} compartilhou {entity_label} com você", html, text)


def send_team_invite_email(to_email: str, owner_name: str, team_name: str) -> tuple[bool, str]:
    button_style = (
        "display:inline-block;background:#4F46E5;color:#ffffff;padding:10px 20px;"
        "border-radius:8px;font-weight:600;text-decoration:none;"
    )
    body = f"""
      <p>Olá!</p>
      <p><strong>{owner_name}</strong> te convidou para a equipe <strong>{team_name}</strong> no Agenda.</p>
      <p style="margin:20px 0;">
        <span style="{button_style}">Entre no Agenda para aceitar</span>
      </p>
      <p style="color:#8a97a0;font-size:13px;">
        Use o mesmo e-mail para fazer login e ver o convite.
      </p>
    """
    html = _base_layout("Convite para equipe", body)
    text = f"{owner_name} te convidou para a equipe {team_name} no Agenda. Use este e-mail para entrar e aceitar." 
    return send_email(to_email, f"Convite para a equipe {team_name}", html, text)
