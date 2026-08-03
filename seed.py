"""
Script de inicialização do banco de dados.

Cria todas as tabelas e popula com um usuário de demonstração, categorias
padrão, e um volume realista de eventos, tarefas, hábitos e notas ao longo
dos últimos 6 meses — para que o dashboard e a aba de Análises já apareçam
com dados ricos assim que você fizer login.

Uso:
    python seed.py
"""
import os
import random
import shutil
from datetime import datetime, timedelta

from app import create_app
from app.extensions import db
from app.models import User, Category, Event, Task, TaskChecklist, Habit, HabitLog, Note

app = create_app()

DEMO_EMAIL = "douma@agenda.com"
DEMO_PASSWORD = "Douma02"

random.seed(42)

CATEGORY_DEFS = [
    {"name": "Trabalho", "color": "#3454D1", "icon": "briefcase", "weight": 5},
    {"name": "Estudos", "color": "#8B5CF6", "icon": "book-open", "weight": 3},
    {"name": "Saúde", "color": "#EF4444", "icon": "heart-pulse", "weight": 2},
    {"name": "Projetos", "color": "#0EA5E9", "icon": "layers", "weight": 3},
    {"name": "Família", "color": "#EC4899", "icon": "users", "weight": 2},
    {"name": "Social", "color": "#F97316", "icon": "party-popper", "weight": 1},
    {"name": "Finanças", "color": "#0F9B8E", "icon": "wallet", "weight": 1},
    {"name": "Pessoal", "color": "#F59E0B", "icon": "user", "weight": 1},
]

EVENT_TITLES = [
    "Reunião de planejamento", "Sessão de treino", "Aula de inglês", "Consulta médica",
    "Jantar em família", "Apresentação do projeto", "Revisão de sprint", "Call com cliente",
    "Sessão de estudo", "Academia", "Yoga", "Reunião 1:1", "Workshop de design",
    "Almoço com a equipe", "Planejamento financeiro", "Consulta com nutricionista",
    "Aniversário de amigo", "Reunião de diretoria", "Code review", "Brainstorm de produto",
    "Terapia", "Corrida matinal", "Curso online", "Encontro com investidores",
]
EVENT_QUARTER_TITLES = [
    "Alinhamento trimestral", "Fechamento de semestre", "Revisão trimestral",
    "Retrospectiva de semestre", "Planejamento estratégico", "Apresentação de resultados",
]

TASK_TITLES = [
    "Preparar relatório trimestral", "Revisar contrato", "Atualizar planilha de gastos",
    "Responder e-mails pendentes", "Organizar arquivos do projeto", "Estudar para certificação",
    "Agendar consulta odontológica", "Planejar viagem de férias", "Revisar apresentação",
    "Comprar presente de aniversário", "Renovar assinatura da academia", "Ler capítulo do livro",
    "Fazer backup dos arquivos", "Preparar pauta da reunião", "Enviar proposta comercial",
    "Atualizar currículo", "Pesquisar fornecedores", "Revisar código do projeto X",
]
TASK_QUARTER_TITLES = [
    "Revisar metas do trimestre", "Preparar balanço semestral", "Ajustar escopo do projeto do semestre",
    "Definir prioridades do próximo trimestre", "Mapear entregas do semestre", "Realizar validação de resultados",
]

PRIORITIES = ["low", "medium", "high", "urgent"]
PRIORITY_WEIGHTS = [3, 4, 2, 1]


def run():
    with app.app_context():
        db.create_all()

        # Limpa dados existentes para sempre iniciar o backend com seed consistente.
        # Isso remove todas as tabelas antes de recriar e repopular.
        db.drop_all()
        db.create_all()

        avatar_dir = os.path.join(os.path.dirname(__file__), "uploads", "avatars")
        if os.path.isdir(avatar_dir):
            shutil.rmtree(avatar_dir)

        uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
        if os.path.isdir(uploads_dir):
            for entry in os.listdir(uploads_dir):
                entry_path = os.path.join(uploads_dir, entry)
                if os.path.isdir(entry_path) and entry != "avatars":
                    shutil.rmtree(entry_path)
                elif os.path.isfile(entry_path):
                    os.remove(entry_path)

        user = User(
            name="Usuário Demo",
            email=DEMO_EMAIL,
            notify_email=True,
            notify_push=True,
            notify_desktop=True,
        )
        user.set_password(DEMO_PASSWORD)
        db.session.add(user)
        db.session.flush()

        categories = []
        for c in CATEGORY_DEFS:
            cat = Category(user_id=user.id, name=c["name"], color=c["color"], icon=c["icon"])
            db.session.add(cat)
            categories.append(cat)
        db.session.flush()
        category_weights = [c["weight"] for c in CATEGORY_DEFS]

        now = datetime.utcnow()

        # --- Eventos: últimos 360 dias + próximos 14 dias ---
        events_created = 0
        event_titles = EVENT_TITLES + EVENT_QUARTER_TITLES
        day_cursor = now - timedelta(days=360)
        while day_cursor < now + timedelta(days=14):
            is_weekend = day_cursor.weekday() >= 5
            quarter = (day_cursor.month - 1) // 3 + 1
            if quarter == 1:
                event_weights = [4, 4, 3, 2]
            elif quarter == 2:
                event_weights = [5, 4, 3, 1]
            elif quarter == 3:
                event_weights = [7, 3, 2, 0]
            else:
                event_weights = [3, 3, 4, 2]

            events_today = random.choices([0, 1, 2, 3], weights=event_weights if not is_weekend else [7, 2, 1, 0])[0]

            for _ in range(events_today):
                hour = random.randint(7, 20)
                start = day_cursor.replace(hour=hour, minute=random.choice([0, 15, 30, 45]), second=0, microsecond=0)
                duration_minutes = random.choice([30, 45, 60, 60, 90, 120])
                end = start + timedelta(minutes=duration_minutes)
                category = random.choices(categories, weights=category_weights)[0]
                priority = random.choices(PRIORITIES, weights=PRIORITY_WEIGHTS)[0]
                is_past = end < now

                estimated = duration_minutes
                actual = None
                status = "scheduled"
                if is_past:
                    actual = max(10, int(estimated * random.uniform(0.65, 1.15)))
                    status = random.choices(["done", "done", "done", "canceled"], weights=[7, 7, 7, 1])[0]

                db.session.add(Event(
                    user_id=user.id, category_id=category.id,
                    title=random.choice(event_titles),
                    start_at=start, end_at=end,
                    priority=priority, status=status,
                    estimated_minutes=estimated, actual_minutes=actual,
                    location=random.choice(["Escritório", "Online", "Sala 3", "Casa", None]),
                ))
                events_created += 1

            day_cursor += timedelta(days=1)

        # --- Tarefas: últimos 26 semanas ---
        tasks_created = 0
        task_titles = TASK_TITLES + TASK_QUARTER_TITLES
        week_cursor = now - timedelta(weeks=26)
        while week_cursor < now:
            quarter = (week_cursor.month - 1) // 3 + 1
            if quarter in (1, 4):
                tasks_this_week = random.randint(5, 9)
            elif quarter == 2:
                tasks_this_week = random.randint(4, 8)
            else:
                tasks_this_week = random.randint(3, 6)

            for _ in range(tasks_this_week):
                created_at = week_cursor + timedelta(days=random.randint(0, 6), hours=random.randint(8, 19))
                if created_at > now:
                    continue
                category = random.choices(categories, weights=category_weights)[0]
                priority = random.choices(PRIORITIES, weights=PRIORITY_WEIGHTS)[0]
                due_date = created_at + timedelta(days=random.randint(1, 14))

                completed = random.random() < 0.72
                status = "pending"
                completed_at = None
                if completed:
                    completed_at = created_at + timedelta(days=random.randint(0, 6), hours=random.randint(1, 10))
                    if completed_at <= now:
                        status = "done"
                    else:
                        completed_at = None
                elif due_date < now and random.random() < 0.5:
                    status = "in_progress"

                task = Task(
                    user_id=user.id, category_id=category.id,
                    title=random.choice(task_titles),
                    due_date=due_date, priority=priority, status=status,
                    estimated_minutes=random.choice([15, 30, 45, 60, 90]),
                    created_at=created_at, completed_at=completed_at,
                )
                db.session.add(task)
                tasks_created += 1
            week_cursor += timedelta(days=7)

        # Algumas tarefas com checklist detalhado (mais recentes, ainda pendentes)
        checklist_task = Task(
            user_id=user.id, category_id=categories[0].id, title="Preparar relatório trimestral",
            description="Consolidar números de vendas e produtividade do time",
            due_date=now + timedelta(days=2), priority="high", status="pending", estimated_minutes=120,
        )
        db.session.add(checklist_task)
        db.session.flush()
        checklist_task.checklist = [
            TaskChecklist(title="Coletar dados de vendas", position=0, done=True),
            TaskChecklist(title="Montar gráficos", position=1, done=False),
            TaskChecklist(title="Revisar com o time", position=2, done=False),
        ]

        # --- Hábitos com histórico de 30 dias ---
        habit_defs = [
            {"name": "Beber 2L de água", "color": "#3B82F6", "icon": "droplet", "consistency": 0.85},
            {"name": "Ler 20 minutos", "color": "#22C55E", "icon": "book-open", "consistency": 0.6},
            {"name": "Exercitar-se", "color": "#EF4444", "icon": "dumbbell", "consistency": 0.7},
            {"name": "Meditar", "color": "#8B5CF6", "icon": "brain", "consistency": 0.45},
        ]
        for h in habit_defs:
            habit = Habit(user_id=user.id, name=h["name"], color=h["color"], icon=h["icon"], frequency="daily")
            db.session.add(habit)
            db.session.flush()
            for i in range(30):
                day = (now - timedelta(days=i)).date()
                if random.random() < h["consistency"]:
                    db.session.add(HabitLog(habit_id=habit.id, date=day))

        # --- Notas ---
        notes = [
            {"content": "Ligar para o dentista e remarcar a consulta.", "color": "#F1F0FE", "pinned": True},
            {"content": "Ideia: revisar o orçamento do mês antes do dia 30.", "color": "#EDFCFA", "pinned": False},
            {"content": "Comprar presente de aniversário para a Marina.", "color": "#FEF3E2", "pinned": False},
            {"content": "Livro recomendado pelo João: 'Deep Work'.", "color": "#FEEBEE", "pinned": False},
        ]
        for n in notes:
            db.session.add(Note(user_id=user.id, **n))

        db.session.commit()
        print(f"Seed concluído: {events_created} eventos, {tasks_created + 1} tarefas, {len(habit_defs)} hábitos.")
        print(f"Login: {DEMO_EMAIL} / senha: {DEMO_PASSWORD}")


if __name__ == "__main__":
    run()
