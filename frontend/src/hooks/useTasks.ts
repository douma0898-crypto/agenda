import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { taskService, TaskFilters } from "@/services/taskService";
import { TaskItem } from "@/utils/types";

export function useTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: ["tasks", filters],
    queryFn: () => taskService.list(filters),
    staleTime: 30_000,
  });
}

export function useTaskMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const create = useMutation({
    mutationFn: (payload: Partial<TaskItem>) => taskService.create(payload),
    onSuccess: () => {
      invalidate();
      toast.success("Tarefa criada");
    },
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<TaskItem> }) => taskService.update(id, payload),
    onSuccess: () => {
      invalidate();
      toast.success("Tarefa atualizada");
    },
  });

  const toggleComplete = useMutation({
    mutationFn: (id: string) => taskService.toggleComplete(id),
    onSuccess: invalidate,
  });

  const duplicate = useMutation({
    mutationFn: (id: string) => taskService.duplicate(id),
    onSuccess: () => {
      invalidate();
      toast.success("Tarefa duplicada");
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => taskService.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Tarefa removida");
    },
  });

  return { create, update, toggleComplete, duplicate, remove };
}
