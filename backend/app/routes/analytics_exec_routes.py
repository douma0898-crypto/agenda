import io

from flask import Blueprint, send_file
from flask_jwt_extended import jwt_required
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer

from app.middlewares.auth_middleware import get_current_user
from app.services import analytics_service
from app.utils.responses import success

analytics_bp = Blueprint("analytics_exec", __name__, url_prefix="/api/analytics")


def _gather(user):
    events = user.events.all()
    tasks = user.tasks.all()
    categories = {c.id: c for c in user.categories}
    streak = analytics_service.compute_streak(tasks, events)
    return events, tasks, categories, streak


@analytics_bp.get("/executive")
@jwt_required()
def executive_dashboard():
    user = get_current_user()
    events, tasks, categories, streak = _gather(user)

    return success({
        "heatmap": analytics_service.build_heatmap(events),
        "mostProductiveHours": analytics_service.most_productive_hours(events),
        "busiestDays": analytics_service.busiest_days(events),
        "timeLostVsFocused": analytics_service.time_lost_vs_focused(events),
        "categoryRanking": analytics_service.category_ranking(events, categories),
        "streak": streak,
        "achievements": analytics_service.compute_achievements(tasks, events, streak),
    })


@analytics_bp.get("/report.pdf")
@jwt_required()
def executive_report_pdf():
    user = get_current_user()
    events, tasks, categories, streak = _gather(user)

    time_stats = analytics_service.time_lost_vs_focused(events)
    ranking = analytics_service.category_ranking(events, categories)
    achievements = [a for a in analytics_service.compute_achievements(tasks, events, streak) if a["unlocked"]]
    productive_hours = analytics_service.most_productive_hours(events)
    busy_days = analytics_service.busiest_days(events)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = [
        Paragraph(f"Relatório Executivo — {user.name}", styles["Title"]),
        Spacer(1, 6),
        Paragraph("Resumo de produtividade dos últimos 30/90 dias", styles["Normal"]),
        Spacer(1, 18),
    ]

    def _section(title, headers, rows):
        elements.append(Paragraph(title, styles["Heading2"]))
        elements.append(Spacer(1, 6))
        data = [headers] + rows if rows else [headers, ["—"] * len(headers)]
        table = Table(data, repeatRows=1)
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4F46E5")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 18))

    _section("Tempo focado x tempo perdido (30 dias)", ["Métrica", "Valor"], [
        ["Horas focadas", f"{time_stats['focusedHours']}h"],
        ["Horas perdidas", f"{time_stats['lostHours']}h"],
    ])

    _section("Sequência de dias produtivos", ["Métrica", "Valor"], [
        ["Streak atual", f"{streak['currentStreak']} dias"],
        ["Melhor streak", f"{streak['bestStreak']} dias"],
    ])

    _section("Horários mais produtivos", ["Horário", "Minutos"],
              [[h["label"], str(h["minutes"])] for h in productive_hours])

    _section("Dias mais ocupados", ["Data", "Eventos", "Minutos"],
              [[d["date"], str(d["eventsCount"]), str(d["minutes"])] for d in busy_days])

    _section("Ranking de categorias (30 dias)", ["#", "Categoria", "Horas"],
              [[str(c["rank"]), c["name"], str(c["hours"])] for c in ranking])

    _section("Conquistas desbloqueadas", ["Conquista", "Descrição"],
              [[a["title"], a["description"]] for a in achievements])

    doc.build(elements)
    buffer.seek(0)
    return send_file(buffer, as_attachment=True, download_name="relatorio-executivo.pdf", mimetype="application/pdf")
