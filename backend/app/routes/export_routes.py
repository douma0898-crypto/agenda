import csv
import io

from flask import Blueprint, Response, send_file
from flask_jwt_extended import jwt_required
from openpyxl import Workbook
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer

from app.middlewares.auth_middleware import get_current_user
from app.models import Event, Task

export_bp = Blueprint("export", __name__, url_prefix="/api/export")

EVENT_HEADERS = ["Título", "Início", "Fim", "Local", "Prioridade", "Status", "Categoria"]
TASK_HEADERS = ["Título", "Data limite", "Prioridade", "Status", "Categoria"]


def _event_rows(events):
    return [
        [e.title, e.start_at.strftime("%Y-%m-%d %H:%M"), e.end_at.strftime("%Y-%m-%d %H:%M"),
         e.location or "", e.priority, e.status, e.category.name if e.category else ""]
        for e in events
    ]


def _task_rows(tasks):
    return [
        [t.title, t.due_date.strftime("%Y-%m-%d") if t.due_date else "", t.priority, t.status,
         t.category.name if t.category else ""]
        for t in tasks
    ]


@export_bp.get("/events.csv")
@jwt_required()
def export_events_csv():
    user = get_current_user()
    events = user.events.order_by(Event.start_at.asc()).all()

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(EVENT_HEADERS)
    writer.writerows(_event_rows(events))

    return Response(
        buffer.getvalue(), mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=eventos.csv"},
    )


@export_bp.get("/tasks.csv")
@jwt_required()
def export_tasks_csv():
    user = get_current_user()
    tasks = user.tasks.order_by(Task.due_date.asc()).all()

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(TASK_HEADERS)
    writer.writerows(_task_rows(tasks))

    return Response(
        buffer.getvalue(), mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=tarefas.csv"},
    )


@export_bp.get("/events.xlsx")
@jwt_required()
def export_events_xlsx():
    user = get_current_user()
    events = user.events.order_by(Event.start_at.asc()).all()

    wb = Workbook()
    ws = wb.active
    ws.title = "Eventos"
    ws.append(EVENT_HEADERS)
    for row in _event_rows(events):
        ws.append(row)
    for col in ws.columns:
        width = max(len(str(cell.value or "")) for cell in col) + 2
        ws.column_dimensions[col[0].column_letter].width = width

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return send_file(buffer, as_attachment=True, download_name="eventos.xlsx",
                      mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")


@export_bp.get("/tasks.xlsx")
@jwt_required()
def export_tasks_xlsx():
    user = get_current_user()
    tasks = user.tasks.order_by(Task.due_date.asc()).all()

    wb = Workbook()
    ws = wb.active
    ws.title = "Tarefas"
    ws.append(TASK_HEADERS)
    for row in _task_rows(tasks):
        ws.append(row)
    for col in ws.columns:
        width = max(len(str(cell.value or "")) for cell in col) + 2
        ws.column_dimensions[col[0].column_letter].width = width

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return send_file(buffer, as_attachment=True, download_name="tarefas.xlsx",
                      mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")


def _pdf_table(title: str, headers: list[str], rows: list[list[str]]) -> io.BytesIO:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = [Paragraph(title, styles["Title"]), Spacer(1, 12)]

    data = [headers] + rows if rows else [headers]
    table = Table(data, repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#3454D1")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elements.append(table)
    doc.build(elements)
    buffer.seek(0)
    return buffer


@export_bp.get("/events.pdf")
@jwt_required()
def export_events_pdf():
    user = get_current_user()
    events = user.events.order_by(Event.start_at.asc()).all()
    buffer = _pdf_table("Relatório de Eventos", EVENT_HEADERS, _event_rows(events))
    return send_file(buffer, as_attachment=True, download_name="eventos.pdf", mimetype="application/pdf")


@export_bp.get("/tasks.pdf")
@jwt_required()
def export_tasks_pdf():
    user = get_current_user()
    tasks = user.tasks.order_by(Task.due_date.asc()).all()
    buffer = _pdf_table("Relatório de Tarefas", TASK_HEADERS, _task_rows(tasks))
    return send_file(buffer, as_attachment=True, download_name="tarefas.pdf", mimetype="application/pdf")
