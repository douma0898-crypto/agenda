# Agenda App — Frontend (React + TypeScript)

Interface premium do aplicativo de agenda: dashboard, calendário com
drag-and-drop, tarefas com checklist, categorias, dark/light mode e
command palette (⌘K).

## Stack

React 18 · TypeScript · Vite · Tailwind CSS · React Router · Framer Motion ·
React Hook Form · Axios · TanStack Query · Zustand · Recharts · Lucide Icons ·
React Hot Toast

## Como rodar

Pré-requisito: o backend precisa estar rodando (veja `../backend/README.md`).

```bash
cd frontend
npm install
cp .env.example .env

npm run dev
```

Acesse **http://localhost:5173**. Faça login com a conta de demonstração
criada pelo `seed.py` do backend: **demo@agenda.app** / **demo123456**.

## Estrutura

```
frontend/src/
├── components/
│   ├── ui/            # Button, Input, Modal, Dropdown, Tabs, Badge, etc.
│   ├── layout/          # Sidebar, Navbar, MobileNav, AppLayout, CommandPalette
│   ├── calendar/          # MonthView, EventFormModal
│   ├── tasks/               # TaskCard, TaskFormModal
│   └── dashboard/             # StatCard, MiniCalendar, Charts
├── pages/                # Login, Register, Dashboard, Calendar, Tasks, Categories, Settings
├── hooks/                # useEvents, useTasks, useCategories, useDashboard (React Query)
├── contexts/             # AuthContext, ThemeContext, useUIStore (Zustand)
├── services/              # api.ts (axios) + serviços por domínio
├── utils/                  # types.ts, date.ts
└── styles/index.css          # Tailwind + design tokens (glassmorphism)
```

## Design system

- **Cores**: paleta "Cobalt & Emerald" — primary (azul royal `#3454D1` no claro / periwinkle `#7B96FF` no escuro) e
  secondary (verde-esmeralda `#0F9B8E` no claro / menta `#2DD4C4` no escuro) são reativas ao tema via
  CSS custom properties (`--color-primary-500`, `--color-secondary-500`, etc. em `styles/index.css`),
  então a mesma classe `bg-primary-500` já muda de tom automaticamente ao trocar de tema — não é
  preciso duplicar classes `dark:`. success, danger, warning e info seguem fixos (cores semânticas).
- **Tipografia**: Plus Jakarta Sans (títulos) + Inter (texto).
- **Glassmorphism**: classe utilitária `.glass-panel` (blur + transparência
  + sombra suave), usada em cards, modais e navbar.
- **Dark mode**: classe `dark` no `<html>`, alternável pelo `ThemeContext`
  e persistida em `localStorage`.

## O que funciona hoje

- Autenticação completa (registro, login, refresh automático de token, perfil, troca de senha)
- Dashboard com cabeçalho hero (ações rápidas: novo evento, nova tarefa, modo foco), agenda do dia em formato timeline, próximos eventos, atrasados, mini calendário, notas rápidas e hábitos do dia
- **Configurações reorganizadas** em seções por abas (Perfil, Aparência, Dados, Integrações, Segurança) com navegação lateral no desktop e pílulas roláveis no mobile
- **Aba dedicada de Análises** (`/analytics`) com 8 painéis: evolução mensal (6 meses), distribuição de horas por categoria, tendência de tarefas (8 semanas), resumo do mês, eventos por prioridade, atividade por dia da semana, status das tarefas e consistência de hábitos — populados com dados de exemplo realistas via `seed.py`
- Calendário com visões **Mês, Semana, Dia e Agenda** — drag-and-drop para mover eventos (mês) e mover/redimensionar por arraste na grade de horários (semana/dia)
- Formulário de evento completo (categoria, local, link, contato, recorrência, prioridade, status, lembretes, tags, favorito, **anexos**)
- Tarefas com checklist/subtarefas, prioridade, tags, filtros por status e busca
- Categorias com CRUD e seletor de cor
- **Hábitos**: criação, marcação diária, streak e histórico de 30 dias
- **Modo Foco / Pomodoro**: timer com ciclos de foco e pausas curtas/longas, com **durações personalizáveis** (botão de engrenagem) salvas no navegador
- **Notificações** in-app (sino no navbar), geradas a partir dos lembretes configurados
- **Exportação** de eventos e tarefas em CSV, Excel e PDF; **importação** de eventos via CSV
- **Backup e restauração** completos (JSON) na tela de Configurações
- Estrutura pronta para integração com Google Calendar (ativa credenciais via `.env` no backend)
- **Undo** ao excluir eventos ou tarefas (toast com "Desfazer")
- **Atalhos de teclado**: `N` novo evento, `T` nova tarefa, `G`+`D/C/T/H` navegação rápida, `⌘K`/`Ctrl+K` command palette, `Esc` fecha modais
- Configurações de perfil, tema e senha
- Command palette (⌘K) para navegação e busca rápida
- **Tela de splash animada** com o logo do app, exibida por ~1,7s antes da tela de login/dashboard
- **Gráficos com tooltip translúcido** (efeito vidro fosco, não mais uma caixa branca opaca) e grade/eixos adaptados ao tema; a **Tendência de Tarefas** ganhou um resumo (criadas, concluídas, taxa) e um indicador de "melhorando/piorando" comparando a primeira e a segunda metade do período
- **Responsivo de ponta a ponta**: navbar e cabeçalhos de página adaptam texto/ícones, formulários em modal empilham campos em telas estreitas, calendário de semana/dia rola horizontalmente em vez de espremer, e a navegação mobile usa uma barra inferior com menu "Mais" para caber todas as seções

## Próximos passos sugeridos (fora do escopo deste MVP atual)

- Visão de ano/timeline no calendário (hoje: mês, semana, dia, agenda)
- OAuth2 completo do Google Calendar (hoje: estrutura de endpoints pronta no backend)
- Undo/Redo genérico com histórico completo de ações (hoje: undo apenas para exclusões)
- Testes automatizados (unitários e E2E)
