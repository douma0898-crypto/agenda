from collections import defaultdict
from datetime import datetime, timedelta

from flask import Blueprint
from flask_jwt_extended import jwt_required

from app.middlewares.auth_middleware import get_current_user
from app.models import Habit
from app.utils.responses import success

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")

MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]


@dashboard_bp.get("/summary")
@jwt_required()
def summary():
    user = get_current_user()
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)

    all_events = user.events.all()
    all_tasks = user.tasks.all()

    today_events = [e for e in all_events if today_start <= e.start_at < today_end]
    upcoming_events = sorted(
        [e for e in all_events if e.start_at >= now and e.status != "canceled"],
        key=lambda e: e.start_at,
    )[:10]
    overdue_events = [e for e in all_events if e.end_at < now and e.status not in ("done", "canceled")]

    pending_tasks = [t for t in all_tasks if t.status != "done"]
    done_tasks = [t for t in all_tasks if t.status == "done"]
    overdue_tasks = [t for t in pending_tasks if t.due_date and t.due_date < now]

    productive_minutes = sum(e.actual_minutes or 0 for e in all_events if e.start_at >= today_start)

    return success({
        "todayEvents": [e.to_dict() for e in sorted(today_events, key=lambda e: e.start_at)],
        "upcomingEvents": [e.to_dict() for e in upcoming_events],
        "overdueEvents": [e.to_dict() for e in overdue_events],
        "pendingTasksCount": len(pending_tasks),
        "doneTasksCount": len(done_tasks),
        "overdueTasksCount": len(overdue_tasks),
        "productiveMinutesToday": productive_minutes,
        "totals": {
            "events": len(all_events),
            "tasks": len(all_tasks),
        },
    })


def _month_bounds(reference: datetime):
    start = reference.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if start.month == 12:
        end = start.replace(year=start.year + 1, month=1)
    else:
        end = start.replace(month=start.month + 1)
    return start, end


def _week_bounds(reference: datetime):
    start = (reference - timedelta(days=reference.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
    return start, start + timedelta(days=7)


def _quarter_bounds(reference: datetime):
    quarter = (reference.month - 1) // 3
    start_month = quarter * 3 + 1
    start = reference.replace(month=start_month, day=1, hour=0, minute=0, second=0, microsecond=0)
    if start_month == 10:
        end = start.replace(year=start.year + 1, month=1)
    else:
        end = start.replace(month=start_month + 3)
    return start, end


def _semester_bounds(reference: datetime):
    if reference.month <= 6:
        start = reference.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        end = start.replace(month=7)
    else:
        start = reference.replace(month=7, day=1, hour=0, minute=0, second=0, microsecond=0)
        end = start.replace(year=start.year + 1, month=1)
    return start, end


@dashboard_bp.get("/analytics")
@jwt_required()
def analytics():
    """
    Dados para os 4 painéis de analytics do dashboard: evolução mensal (6 meses),
    distribuição de horas por categoria, tendência de tarefas (8 semanas) e
    resumo do mês corrente.
    """
    user = get_current_user()
    now = datetime.utcnow()
    all_events = user.events.all()
    all_tasks = user.tasks.all()
    categories = {c.id: c for c in user.categories}

    # --- Evolução mensal (últimos 6 meses) ---
    monthly_evolution = []
    month_starts = []
    cursor = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    for _ in range(6):
        month_starts.append(cursor)
        cursor = (cursor - timedelta(days=1)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    month_starts.reverse()

    total_productive_minutes_6m = 0
    for month_start in month_starts:
        month_end = _month_bounds(month_start)[1]

        month_events = [e for e in all_events if month_start <= e.start_at < month_end]
        month_tasks_done = [t for t in all_tasks if t.completed_at and month_start <= t.completed_at < month_end]

        productive_minutes = sum(e.actual_minutes or 0 for e in month_events)
        total_productive_minutes_6m += productive_minutes

        focus_ratios = [
            min(e.actual_minutes / e.estimated_minutes, 1) * 100
            for e in month_events
            if e.actual_minutes and e.estimated_minutes
        ]
        avg_focus = round(sum(focus_ratios) / len(focus_ratios)) if focus_ratios else 0

        monthly_evolution.append({
            "month": month_start.strftime("%Y-%m"),
            "label": MONTH_LABELS[month_start.month - 1],
            "productiveHours": round(productive_minutes / 60, 1),
            "eventsCount": len(month_events),
            "tasksCompletedCount": len(month_tasks_done),
            "avgFocus": avg_focus,
        })

    # --- Visão trimestral e semestral ---
    quarter_summary = []
    quarter_cursor = now
    quarter_starts = []
    for _ in range(4):
        quarter_start, _ = _quarter_bounds(quarter_cursor)
        quarter_starts.append(quarter_start)
        quarter_cursor = quarter_start - timedelta(days=1)
    quarter_starts.reverse()

    for quarter_start in quarter_starts:
        quarter_end = _quarter_bounds(quarter_start)[1]
        quarter_events = [e for e in all_events if quarter_start <= e.start_at < quarter_end]
        quarter_tasks_done = [t for t in all_tasks if t.completed_at and quarter_start <= t.completed_at < quarter_end]
        productive_minutes = sum(e.actual_minutes or 0 for e in quarter_events)
        focus_ratios = [
            min(e.actual_minutes / e.estimated_minutes, 1) * 100
            for e in quarter_events
            if e.actual_minutes and e.estimated_minutes
        ]
        avg_focus = round(sum(focus_ratios) / len(focus_ratios)) if focus_ratios else 0
        quarter_summary.append({
            "quarterLabel": f"Q{(quarter_start.month - 1) // 3 + 1} {quarter_start.year}",
            "productiveHours": round(productive_minutes / 60, 1),
            "eventsCount": len(quarter_events),
            "tasksCompletedCount": len(quarter_tasks_done),
            "avgFocus": avg_focus,
        })

    semester_summary = []
    semester_cursor = now
    semester_starts = []
    for _ in range(2):
        semester_start, _ = _semester_bounds(semester_cursor)
        semester_starts.append(semester_start)
        semester_cursor = semester_start - timedelta(days=1)
    semester_starts.reverse()

    for semester_start in semester_starts:
        semester_end = _semester_bounds(semester_start)[1]
        semester_events = [e for e in all_events if semester_start <= e.start_at < semester_end]
        semester_tasks_done = [t for t in all_tasks if t.completed_at and semester_start <= t.completed_at < semester_end]
        productive_minutes = sum(e.actual_minutes or 0 for e in semester_events)
        focus_ratios = [
            min(e.actual_minutes / e.estimated_minutes, 1) * 100
            for e in semester_events
            if e.actual_minutes and e.estimated_minutes
        ]
        avg_focus = round(sum(focus_ratios) / len(focus_ratios)) if focus_ratios else 0
        semester_label = "1S" if semester_start.month == 1 else "2S"
        semester_summary.append({
            "semesterLabel": f"{semester_label} {semester_start.year}",
            "productiveHours": round(productive_minutes / 60, 1),
            "eventsCount": len(semester_events),
            "tasksCompletedCount": len(semester_tasks_done),
            "avgFocus": avg_focus,
        })

    # --- Distribuição por categoria (horas, últimos 30 dias) ---
    since = now - timedelta(days=30)
    hours_by_category = defaultdict(float)
    for e in all_events:
        if e.start_at >= since and e.category_id:
            minutes = e.actual_minutes or e.estimated_minutes or 0
            hours_by_category[e.category_id] += minutes / 60

    total_hours = sum(hours_by_category.values())
    category_distribution = [
        {
            "categoryId": cat_id,
            "name": categories[cat_id].name if cat_id in categories else "Categoria",
            "color": categories[cat_id].color if cat_id in categories else "#94A3B8",
            "hours": round(hours, 1),
            "percentage": round((hours / total_hours) * 100) if total_hours else 0,
        }
        for cat_id, hours in sorted(hours_by_category.items(), key=lambda kv: kv[1], reverse=True)
    ]

    # --- Tendência de tarefas (últimas 8 semanas): criadas vs concluídas ---
    task_trend = []
    week_starts = []
    cursor = _week_bounds(now)[0]
    for _ in range(8):
        week_starts.append(cursor)
        cursor -= timedelta(days=7)
    week_starts.reverse()

    for week_start in week_starts:
        week_end = week_start + timedelta(days=7)
        created = len([t for t in all_tasks if week_start <= t.created_at < week_end])
        completed = len([t for t in all_tasks if t.completed_at and week_start <= t.completed_at < week_end])
        task_trend.append({
            "weekLabel": f"Sem {week_start.isocalendar()[1]}",
            "weekStart": week_start.strftime("%Y-%m-%d"),
            "created": created,
            "completed": completed,
        })

    # --- Resumo do mês corrente ---
    current_month_start, current_month_end = _month_bounds(now)
    month_events = [e for e in all_events if current_month_start <= e.start_at < current_month_end]
    month_tasks_created = [t for t in all_tasks if current_month_start <= t.created_at < current_month_end]
    month_tasks_completed = [t for t in month_tasks_created if t.status == "done"]
    pending_events = [e for e in month_events if e.status not in ("done", "canceled")]
    month_productive_minutes = sum(e.actual_minutes or 0 for e in month_events)
    days_elapsed = max((min(now, current_month_end) - current_month_start).days, 1)

    month_summary = {
        "totalEvents": len(month_events),
        "pendingEvents": len(pending_events),
        "completionRate": round((len(month_tasks_completed) / len(month_tasks_created)) * 100) if month_tasks_created else 0,
        "dailyAverageHours": round((month_productive_minutes / 60) / days_elapsed, 1),
        "totalHours6m": round(total_productive_minutes_6m / 60),
    }

    # --- Distribuição por prioridade (eventos, últimos 90 dias) ---
    since_90 = now - timedelta(days=90)
    priority_labels = {"low": "Baixa", "medium": "Média", "high": "Alta", "urgent": "Urgente"}
    priority_counts = defaultdict(int)
    for e in all_events:
        if e.start_at >= since_90:
            priority_counts[e.priority] += 1
    priority_breakdown = [
        {"priority": p, "label": priority_labels.get(p, p), "count": priority_counts.get(p, 0)}
        for p in ["low", "medium", "high", "urgent"]
    ]

    # --- Atividade por dia da semana (eventos, últimos 90 dias) ---
    weekday_labels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]
    weekday_counts = [0] * 7
    for e in all_events:
        if e.start_at >= since_90:
            weekday_counts[e.start_at.weekday()] += 1
    weekday_activity = [{"weekday": weekday_labels[i], "count": weekday_counts[i]} for i in range(7)]

    # --- Distribuição de status das tarefas ---
    status_labels = {"pending": "Pendente", "in_progress": "Em andamento", "done": "Concluída"}
    status_counts = defaultdict(int)
    for t in all_tasks:
        status_counts[t.status] += 1
    status_breakdown = [
        {"status": s, "label": status_labels.get(s, s), "count": status_counts.get(s, 0)}
        for s in ["pending", "in_progress", "done"]
    ]

    # --- Consistência de hábitos (% de dias concluídos nos últimos 30 dias) ---
    habits = Habit.query.filter_by(user_id=user.id, archived=False).all()
    habit_consistency = []
    for habit in habits:
        recent_logs = [log for log in habit.logs if log.date >= (now - timedelta(days=30)).date()]
        habit_consistency.append({
            "habitId": habit.id,
            "name": habit.name,
            "color": habit.color,
            "percentage": round((len(recent_logs) / 30) * 100),
        })

    return success({
        "monthlyEvolution": monthly_evolution,
        "quarterSummary": quarter_summary,
        "semesterSummary": semester_summary,
        "categoryDistribution": category_distribution,
        "taskTrend": task_trend,
        "monthSummary": month_summary,
        "priorityBreakdown": priority_breakdown,
        "weekdayActivity": weekday_activity,
        "statusBreakdown": status_breakdown,
        "habitConsistency": habit_consistency,
    })
