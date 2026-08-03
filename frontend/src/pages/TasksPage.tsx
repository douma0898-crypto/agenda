import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, ListTodo, Download } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useTasks } from "@/hooks/useTasks";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { Tabs } from "@/components/ui/Tabs";
import { SearchInput } from "@/components/ui/Misc";
import { Button } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";
import { Loading, EmptyState } from "@/components/ui/Primitives";
import { TaskItem } from "@/utils/types";
import { exportService } from "@/services/extraServices";

const STATUS_TABS = [
  { label: "Todas", value: "" },
  { label: "Pendentes", value: "pending" },
  { label: "Em andamento", value: "in_progress" },
  { label: "Concluídas", value: "done" },
];

export default function TasksPage() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [editingTask, setEditingTask] = useState<TaskItem | null | undefined>(undefined);
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: tasks, isLoading } = useTasks({ status: status || undefined, search: search || undefined });

  const isModalOpen = editingTask !== undefined || searchParams.get("new") === "1";

  const closeModal = () => {
    setEditingTask(undefined);
    if (searchParams.get("new")) {
      searchParams.delete("new");
      setSearchParams(searchParams);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-lg font-bold text-slate-800 dark:text-white sm:text-xl">Tarefas</h1>
        <div className="flex items-center gap-2">
          <Dropdown
            align="right"
            trigger={
              <button className="btn-secondary !px-3">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Exportar</span>
              </button>
            }
            options={[
              { label: "Exportar CSV", value: "csv" },
              { label: "Exportar Excel", value: "xlsx" },
              { label: "Exportar PDF", value: "pdf" },
            ]}
            onSelect={(v) => {
              if (v === "csv") exportService.tasksCsv();
              if (v === "xlsx") exportService.tasksXlsx();
              if (v === "pdf") exportService.tasksPdf();
            }}
          />
          <Button onClick={() => setEditingTask(null)} className="!px-3 sm:!px-4">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nova tarefa</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="scrollbar-hide -mx-1 overflow-x-auto px-1">
          <Tabs tabs={STATUS_TABS} active={status} onChange={setStatus} />
        </div>
        <div className="w-full sm:max-w-xs">
          <SearchInput value={search} onChange={setSearch} placeholder="Pesquisar tarefas..." />
        </div>
      </div>

      {isLoading ? (
        <Loading label="Carregando tarefas..." />
      ) : !tasks || tasks.length === 0 ? (
        <EmptyState
          icon={<ListTodo className="h-6 w-6" />}
          title="Nenhuma tarefa por aqui"
          description="Crie sua primeira tarefa para começar a organizar seu dia."
          action={
            <Button onClick={() => setEditingTask(null)}>
              <Plus className="h-4 w-4" /> Nova tarefa
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <AnimatePresence>
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onEdit={setEditingTask} />
            ))}
          </AnimatePresence>
        </div>
      )}

      <TaskFormModal open={isModalOpen} onClose={closeModal} task={editingTask || null} />
    </div>
  );
}
