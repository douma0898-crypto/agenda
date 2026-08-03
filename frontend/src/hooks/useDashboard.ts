import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { categoryService, dashboardService } from "@/services/categoryService";
import { Category } from "@/utils/types";

export function useCategories() {
  return useQuery({ queryKey: ["categories"], queryFn: () => categoryService.list(), staleTime: 60_000 });
}

export function useCategoryMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["categories"] });

  const create = useMutation({
    mutationFn: (payload: Partial<Category>) => categoryService.create(payload),
    onSuccess: () => {
      invalidate();
      toast.success("Categoria criada");
    },
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Category> }) => categoryService.update(id, payload),
    onSuccess: () => {
      invalidate();
      toast.success("Categoria atualizada");
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => categoryService.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Categoria removida");
    },
  });

  return { create, update, remove };
}

export function useDashboard() {
  return useQuery({ queryKey: ["dashboard"], queryFn: () => dashboardService.summary(), staleTime: 30_000 });
}

export function useDashboardAnalytics() {
  return useQuery({ queryKey: ["dashboard-analytics"], queryFn: () => dashboardService.analytics(), staleTime: 60_000 });
}
