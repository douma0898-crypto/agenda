"""Cálculos do Dashboard Executivo: heatmap, streak, conquistas, ranking etc."""
from collections import defaultdict
from datetime import datetime, timedelta

WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]


def build_heatmap(events, days: int = 90) -> list[dict]:
    """Matriz dia-da-semana x hora, com minutos de atividade — para o heatmap de produtividade."""
    since = datetime.utcnow() - timedelta(days=days)
    grid = defaultdict(int)  # (weekday, hour) -> minutos
    for e in events:
        if e.start_at < since or e.status == "canceled":
            continue
        minutes = e.actual_minutes or e.estimated_minutes or 30
        grid[(e.start_at.weekday(), e.start_at.hour)] += minutes

    max_value = max(grid.values()) if grid else 0
    cells = []
    for weekday in range(7):
        for hour in range(24):
            value = grid.get((weekday, hour), 0)
            cells.append({
                "weekday": weekday,
                "weekdayLabel": WEEKDAY_LABELS[weekday],
                "hour": hour,
                "minutes": value,
                "intensity": round(value / max_value, 2) if max_value else 0,
            })
    return cells


def most_productive_hours(events, days: int = 90, top: int = 3) -> list[dict]:
    since = datetime.utcnow() - timedelta(days=days)
    by_hour = defaultdict(int)
    for e in events:
        if e.start_at >= since and e.status != "canceled":
            by_hour[e.start_at.hour] += e.actual_minutes or e.estimated_minutes or 30
    ranked = sorted(by_hour.items(), key=lambda kv: kv[1], reverse=True)[:top]
    return [{"hour": h, "label": f"{h:02d}:00", "minutes": m} for h, m in ranked]


def busiest_days(events, days: int = 90, top: int = 5) -> list[dict]:
    since = datetime.utcnow() - timedelta(days=days)
    by_day = defaultdict(lambda: {"minutes": 0, "count": 0})
    for e in events:
        if e.start_at >= since and e.status != "canceled":
            key = e.start_at.date().isoformat()
            by_day[key]["minutes"] += e.actual_minutes or e.estimated_minutes or 30
            by_day[key]["count"] += 1
    ranked = sorted(by_day.items(), key=lambda kv: kv[1]["minutes"], reverse=True)[:top]
    return [{"date": d, "minutes": v["minutes"], "eventsCount": v["count"]} for d, v in ranked]


def time_lost_vs_focused(events, days: int = 30) -> dict:
    since = datetime.utcnow() - timedelta(days=days)
    period_events = [e for e in events if e.start_at >= since]

    focused_minutes = sum(e.actual_minutes or 0 for e in period_events if e.status == "done")
    lost_minutes = 0
    for e in period_events:
        if e.status == "canceled":
            lost_minutes += e.estimated_minutes or 30
        elif e.status == "done" and e.estimated_minutes and e.actual_minutes and e.actual_minutes > e.estimated_minutes:
            lost_minutes += e.actual_minutes - e.estimated_minutes

    return {
        "focusedMinutes": focused_minutes,
        "focusedHours": round(focused_minutes / 60, 1),
        "lostMinutes": lost_minutes,
        "lostHours": round(lost_minutes / 60, 1),
    }


def category_ranking(events, categories: dict, days: int = 30) -> list[dict]:
    since = datetime.utcnow() - timedelta(days=days)
    totals = defaultdict(float)
    for e in events:
        if e.start_at >= since and e.category_id:
            totals[e.category_id] += (e.actual_minutes or e.estimated_minutes or 0) / 60

    ranked = sorted(totals.items(), key=lambda kv: kv[1], reverse=True)
    return [
        {
            "rank": idx + 1,
            "categoryId": cat_id,
            "name": categories[cat_id].name if cat_id in categories else "Categoria",
            "color": categories[cat_id].color if cat_id in categories else "#94A3B8",
            "hours": round(hours, 1),
        }
        for idx, (cat_id, hours) in enumerate(ranked)
    ]


def compute_streak(tasks, events) -> dict:
    """Sequência de dias consecutivos (até hoje) com pelo menos uma tarefa concluída
    ou um evento marcado como concluído."""
    productive_days = set()
    for t in tasks:
        if t.completed_at:
            productive_days.add(t.completed_at.date())
    for e in events:
        if e.status == "done":
            productive_days.add(e.start_at.date())

    today = datetime.utcnow().date()
    streak = 0
    cursor = today
    # Se hoje ainda não teve nada produtivo, o streak "atual" começa a contar de ontem
    if cursor not in productive_days:
        cursor -= timedelta(days=1)
    while cursor in productive_days:
        streak += 1
        cursor -= timedelta(days=1)

    # Melhor sequência histórica
    best_streak = 0
    if productive_days:
        ordered = sorted(productive_days)
        run = 1
        best_streak = 1
        for i in range(1, len(ordered)):
            if (ordered[i] - ordered[i - 1]).days == 1:
                run += 1
                best_streak = max(best_streak, run)
            else:
                run = 1

    return {"currentStreak": streak, "bestStreak": best_streak}


def compute_achievements(tasks, events, streak: dict) -> list[dict]:
    done_tasks = len([t for t in tasks if t.status == "done"])
    done_events = len([e for e in events if e.status == "done"])
    total_focused_hours = round(sum(e.actual_minutes or 0 for e in events) / 60)

    definitions = [
        ("first_task", "Primeiros passos", "Concluiu sua primeira tarefa", done_tasks >= 1),
        ("ten_tasks", "Produtivo", "Concluiu 10 tarefas", done_tasks >= 10),
        ("fifty_tasks", "Imparável", "Concluiu 50 tarefas", done_tasks >= 50),
        ("hundred_tasks", "Mestre das tarefas", "Concluiu 100 tarefas", done_tasks >= 100),
        ("streak_3", "No embalo", "3 dias seguidos de produtividade", streak["currentStreak"] >= 3 or streak["bestStreak"] >= 3),
        ("streak_7", "Consistente", "7 dias seguidos de produtividade", streak["currentStreak"] >= 7 or streak["bestStreak"] >= 7),
        ("streak_30", "Disciplina de ferro", "30 dias seguidos de produtividade", streak["bestStreak"] >= 30),
        ("focus_10h", "Foco total", "10 horas de foco acumuladas", total_focused_hours >= 10),
        ("focus_100h", "Mestre do foco", "100 horas de foco acumuladas", total_focused_hours >= 100),
        ("events_50", "Organizado", "50 eventos concluídos", done_events >= 50),
    ]

    return [
        {"id": aid, "title": title, "description": desc, "unlocked": unlocked}
        for aid, title, desc, unlocked in definitions
    ]
