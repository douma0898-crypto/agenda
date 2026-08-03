# Agenda App — Backend (Flask API)

API REST para o aplicativo de agenda: autenticação JWT, eventos, categorias,
tarefas e analytics do dashboard.

## Stack

Python · Flask · SQLAlchemy · SQLite · Flask-JWT-Extended · Flask-CORS · Flask-Migrate

## Como rodar

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt
cp .env.example .env
```

- Para usar PostgreSQL, configure `DATABASE_URL` em `.env` com a string de conexão do seu banco:
  `postgresql://usuario:senha@host:porta/nome_do_banco`
- Se preferir manter SQLite local, deixe `DATABASE_URL` em branco ou removido; o app usará `backend/database/agenda.db`.

```bash
# cria as tabelas e popula com dados de demonstração
python seed.py

# inicia o servidor de desenvolvimento em http://localhost:5000
python run.py
```

Login de demonstração criado pelo seed: **demo@agenda.app** / **demo123456**

### Usando migrations (opcional, alternativa ao seed)

```bash
flask --app run.py db init
flask --app run.py db migrate -m "initial"
flask --app run.py db upgrade
```

## Estrutura

```
backend/
├── app/
│   ├── __init__.py          # application factory
│   ├── extensions.py        # db, jwt, migrate, cors
│   ├── config/               # configurações por ambiente
│   ├── models/                # User, Category, Event, Task, TaskChecklist, Reminder, Tag, Attachment
│   ├── routes/                 # blueprints (auth, categories, events, tasks, dashboard)
│   ├── services/               # regras de negócio (recorrência, conflitos de horário)
│   ├── middlewares/            # autenticação
│   └── utils/                   # respostas padronizadas, paginação, validação, erros
├── database/                # arquivo agenda.db (SQLite)
├── run.py                   # entry point
└── seed.py                  # popula o banco com dados de demonstração
```

## Endpoints principais

Todas as rotas (exceto `/auth/register`, `/auth/login`, `/auth/forgot-password`
e `/health`) exigem o header `Authorization: Bearer <accessToken>`.

### Auth
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/register` | Cria conta |
| POST | `/api/auth/login` | Autentica e retorna tokens |
| POST | `/api/auth/refresh` | Renova o access token |
| GET | `/api/auth/me` | Dados do usuário logado |
| PUT | `/api/auth/me` | Atualiza perfil/preferências |
| POST | `/api/auth/change-password` | Altera senha |
| POST | `/api/auth/forgot-password` | Fluxo de recuperação (estrutura pronta) |

### Categorias
`GET|POST /api/categories`, `PUT|DELETE /api/categories/<id>`

### Eventos
`GET|POST /api/events`, `GET|PUT|DELETE /api/events/<id>`,
`PATCH /api/events/<id>/move` (drag-and-drop/resize),
`POST /api/events/<id>/duplicate`

Filtros suportados em `GET /api/events`: `start`, `end` (ISO datetime, para o
range visível no calendário — expande recorrências automaticamente),
`categoryId`, `status`, `favorite`, `search`.

### Tarefas
`GET|POST /api/tasks`, `PUT|DELETE /api/tasks/<id>`,
`PATCH /api/tasks/<id>/complete`, `POST /api/tasks/<id>/duplicate`

### Dashboard
`GET /api/dashboard/summary` — agenda do dia, próximos eventos, atrasados,
contadores de tarefas.
`GET /api/dashboard/analytics` — evolução mensal (6 meses: horas produtivas,
eventos, tarefas concluídas, foco médio), distribuição de horas por
categoria (30 dias), tendência de tarefas criadas vs concluídas (8 semanas)
e resumo do mês corrente.

### Notificações
`GET /api/notifications` (gera notificações de lembretes vencidos automaticamente),
`PATCH /api/notifications/<id>/read`, `PATCH /api/notifications/read-all`,
`DELETE /api/notifications/<id>`

### Hábitos
`GET|POST /api/habits`, `PUT|DELETE /api/habits/<id>`,
`POST /api/habits/<id>/toggle` (marca/desmarca conclusão do dia),
`GET /api/habits/<id>/stats` (streak + histórico de 30 dias)

### Notas rápidas
`GET|POST /api/notes`, `PUT|DELETE /api/notes/<id>`

### Anexos
`POST /api/attachments` (multipart/form-data: `file` + `eventId` ou `taskId`),
`GET /api/attachments/download/<stored_name>`, `DELETE /api/attachments/<id>`

### Exportação
`GET /api/export/events.csv|.xlsx|.pdf`, `GET /api/export/tasks.csv|.xlsx|.pdf`

### Importação
`POST /api/import/events.csv` (multipart/form-data: `file`, mesmo formato do export)

### Backup
`GET /api/backup/export` (baixa JSON com categorias/eventos/tarefas),
`POST /api/backup/restore` (multipart/form-data: `file`, restauração aditiva)

### Integrações
`GET /api/integrations/google-calendar/status|connect`,
`POST /api/integrations/google-calendar/disconnect` — estrutura pronta,
requer `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` no `.env` para ativar de fato.

## Próximos passos sugeridos (fora do escopo deste MVP)

- OAuth2 completo do Google Calendar (hoje: estrutura de endpoints pronta)
- Rate limiting e throttling por IP/usuário
- Envio de e-mail real no fluxo de recuperação de senha
- Notificações push (hoje: apenas notificações in-app via polling)
