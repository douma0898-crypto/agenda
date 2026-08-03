import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useCategories } from "@/hooks/useDashboard";
import { useTaskMutations } from "@/hooks/useTasks";
import { ChecklistItem, TaskItem } from "@/utils/types";

interface Props {
  open: boolean;
  onClose: () => void;
  task?: TaskItem | null;
}

interface FormValues {
  title: string;
  description?: string;
  categoryId?: string;
  dueDate?: string;
  priority: string;
  estimatedMinutes?: number;
  isFavorite: boolean;
  tags: string;
}

export function TaskFormModal({ open, onClose, task }: Props) {
  const { data: categories } = useCategories();
  const { create, update } = useTaskMutations();
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newItem, setNewItem] = useState("");

  const { register, handleSubmit, reset } = useForm<FormValues>();

  useEffect(() => {
    if (!open) return;
    if (task) {
      reset({
        title: task.title,
        description: task.description || "",
        categoryId: task.categoryId || "",
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
        priority: task.priority,
        estimatedMinutes: task.estimatedMinutes || undefined,
        isFavorite: task.isFavorite,
        tags: task.tags.map((t) => t.name).join(", "),
      });
      setChecklist(task.checklist);
    } else {
      reset({ title: "", description: "", categoryId: "", dueDate: "", priority: "medium", isFavorite: false, tags: "" });
      setChecklist([]);
    }
  }, [open, task, reset]);

  const addChecklistItem = () => {
    if (!newItem.trim()) return;
    setChecklist((prev) => [...prev, { title: newItem.trim(), done: false, position: prev.length }]);
    setNewItem("");
  };

  const onSubmit = (values: FormValues) => {
    const payload: Partial<TaskItem> = {
      title: values.title,
      description: values.description,
      categoryId: values.categoryId || null,
      dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
      priority: values.priority as TaskItem["priority"],
      estimatedMinutes: values.estimatedMinutes ? Number(values.estimatedMinutes) : undefined,
      isFavorite: values.isFavorite,
      tags: values.tags.split(",").map((t) => t.trim()).filter(Boolean) as unknown as TaskItem["tags"],
      checklist,
    };

    if (task) {
      update.mutate({ id: task.id, payload }, { onSuccess: onClose });
    } else {
      create.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={task ? "Editar tarefa" : "Nova tarefa"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Título" placeholder="Ex: Preparar relatório" {...register("title", { required: true })} />
        <Textarea label="Descrição" {...register("description")} />

        <div className="grid grid-cols-1 gap-3 xs:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-slate-600 dark:text-slate-300">Categoria</span>
            <select className="input-field" {...register("categoryId")}>
              <option value="">Sem categoria</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-slate-600 dark:text-slate-300">Prioridade</span>
            <select className="input-field" {...register("priority")}>
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 gap-3 xs:grid-cols-2">
          <Input label="Data limite" type="date" {...register("dueDate")} />
          <Input label="Tempo estimado (min)" type="number" {...register("estimatedMinutes")} />
        </div>

        <Input label="Tags" placeholder="Separe por vírgula" {...register("tags")} />

        <div>
          <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">Checklist / Subtarefas</span>
          <div className="space-y-1.5">
            {checklist.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-white/[0.06] px-2.5 py-1.5">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() =>
                    setChecklist((prev) => prev.map((c, i) => (i === idx ? { ...c, done: !c.done } : c)))
                  }
                  className="h-4 w-4 rounded accent-primary-500"
                />
                <span className={`flex-1 text-sm ${item.done ? "text-slate-400 line-through" : "text-slate-600 dark:text-slate-300"}`}>
                  {item.title}
                </span>
                <button type="button" onClick={() => setChecklist((prev) => prev.filter((_, i) => i !== idx))}>
                  <X className="h-3.5 w-3.5 text-slate-400 hover:text-danger-500" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addChecklistItem())}
              placeholder="Adicionar item..."
              className="input-field flex-1"
            />
            <Button type="button" variant="secondary" onClick={addChecklistItem}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input type="checkbox" className="h-4 w-4 rounded accent-warning-500" {...register("isFavorite")} />
          Marcar como favorito
        </label>

        <div className="flex justify-end gap-2 border-t border-slate-200/70 dark:border-white/10 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={create.isPending || update.isPending}>
            {task ? "Salvar alterações" : "Criar tarefa"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
