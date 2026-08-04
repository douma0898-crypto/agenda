import { motion } from "framer-motion";
import { CheckCircle2, Circle, Copy, Trash2, Star, Clock } from "lucide-react";
import clsx from "clsx";
import { TaskItem } from "@/utils/types";
import { Badge } from "@/components/ui/Primitives";
import { Dropdown } from "@/components/ui/Dropdown";
import { PRIORITY_COLOR, PRIORITY_LABEL, formatFullDate } from "@/utils/date";
import { useTaskMutations } from "@/hooks/useTasks";
import { MoreVertical } from "lucide-react";

export function TaskCard({ task, onEdit }: { task: TaskItem; onEdit: (task: TaskItem) => void }) {
  const { toggleComplete, duplicate, remove } = useTaskMutations();
  const done = task.status === "done";
  const totalChecklist = task.checklist.length;
  const doneChecklist = task.checklist.filter((c) => c.done).length;

  return (
    <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={clsx("card flex gap-3", done && "opacity-60")}>
      <button onClick={() => toggleComplete.mutate(task.id)} className="mt-0.5 shrink-0 text-primary-500">
        {done ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600" />}
      </button>

      <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onEdit(task)}>
        <div className="flex items-start justify-between gap-2">
          <p className={clsx("truncate text-sm font-medium text-slate-700 dark:text-slate-200", done && "line-through")}>{task.title}</p>
          {task.isFavorite && <Star className="h-3.5 w-3.5 shrink-0 fill-warning-500 text-warning-500" />}
        </div>
        {task.description && <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">{task.description}</p>}

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge color={PRIORITY_COLOR[task.priority]}>{PRIORITY_LABEL[task.priority]}</Badge>
          {task.dueDate && (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="h-3 w-3" /> {formatFullDate(task.dueDate)}
            </span>
          )}
          {totalChecklist > 0 && (
            <span className="text-xs text-slate-400">
              {doneChecklist}/{totalChecklist} subtarefas
            </span>
          )}
          {task.tags.map((tag) => (
            <Badge key={tag.id} color={tag.color}>
              {tag.name}
            </Badge>
          ))}
        </div>
      </div>

      <Dropdown
        trigger={
          <button className="btn-ghost !p-1.5 rounded-full">
            <MoreVertical className="h-4 w-4" />
          </button>
        }
        options={[
          { label: "Duplicar", value: "duplicate", icon: <Copy className="h-3.5 w-3.5" /> },
          { label: "Excluir", value: "delete", icon: <Trash2 className="h-3.5 w-3.5" />, danger: true },
        ]}
        onSelect={(value) => {
          if (value === "duplicate") duplicate.mutate(task.id);
          if (value === "delete") remove.mutate(task.id);
        }}
      />
    </motion.div>
  );
}
