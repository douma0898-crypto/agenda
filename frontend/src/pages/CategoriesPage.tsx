import { useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, Trash2, Pencil, FolderKanban } from "lucide-react";
import { useCategories, useCategoryMutations } from "@/hooks/useDashboard";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Loading, EmptyState } from "@/components/ui/Primitives";
import { Category } from "@/utils/types";

const COLOR_OPTIONS = ["#3454D1", "#0F9B8E", "#22C55E", "#3B82F6", "#F59E0B", "#EF4444", "#EC4899", "#64748B"];
const ICON_OPTIONS = ["folder", "briefcase", "user", "heart-pulse", "book-open", "wallet", "home", "star"];

interface FormValues {
  name: string;
  color: string;
  icon: string;
  description?: string;
}

export default function CategoriesPage() {
  const { data: categories, isLoading } = useCategories();
  const { create, update, remove } = useCategoryMutations();
  const [editing, setEditing] = useState<Category | null | undefined>(undefined);

  const { register, handleSubmit, reset, watch, setValue } = useForm<FormValues>({
    defaultValues: { name: "", color: COLOR_OPTIONS[0], icon: ICON_OPTIONS[0], description: "" },
  });

  const openForm = (category?: Category | null) => {
    setEditing(category ?? null);
    reset(
      category
        ? { name: category.name, color: category.color, icon: category.icon, description: category.description || "" }
        : { name: "", color: COLOR_OPTIONS[0], icon: ICON_OPTIONS[0], description: "" }
    );
  };

  const onSubmit = (values: FormValues) => {
    if (editing) {
      update.mutate({ id: editing.id, payload: values }, { onSuccess: () => setEditing(undefined) });
    } else {
      create.mutate(values, { onSuccess: () => setEditing(undefined) });
    }
  };

  const selectedColor = watch("color");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-lg font-bold text-slate-800 dark:text-white sm:text-xl">Categorias</h1>
        <Button onClick={() => openForm(null)}>
          <Plus className="h-4 w-4" /> Nova categoria
        </Button>
      </div>

      {isLoading ? (
        <Loading />
      ) : !categories || categories.length === 0 ? (
        <EmptyState icon={<FolderKanban className="h-6 w-6" />} title="Nenhuma categoria criada" description="Categorias ajudam a organizar eventos e tarefas por área da sua vida." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <div key={cat.id} className="card flex items-center gap-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: cat.color }}
              >
                {cat.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{cat.name}</p>
                {cat.description && <p className="truncate text-xs text-slate-400">{cat.description}</p>}
              </div>
              <button onClick={() => openForm(cat)} className="btn-ghost !p-1.5 rounded-full">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => remove.mutate(cat.id)} className="btn-ghost !p-1.5 rounded-full text-danger-500">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={editing !== undefined} onClose={() => setEditing(undefined)} title={editing ? "Editar categoria" : "Nova categoria"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nome" placeholder="Ex: Trabalho" {...register("name", { required: true })} />
          <Textarea label="Descrição" {...register("description")} />

          <div>
            <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">Cor</span>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue("color", color)}
                  className="h-8 w-8 rounded-full ring-offset-2 transition-all"
                  style={{ backgroundColor: color, boxShadow: selectedColor === color ? `0 0 0 2px ${color}` : "none" }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200/70 dark:border-white/10 pt-4">
            <Button type="button" variant="secondary" onClick={() => setEditing(undefined)}>
              Cancelar
            </Button>
            <Button type="submit" loading={create.isPending || update.isPending}>
              {editing ? "Salvar" : "Criar"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
