import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { notificationService, habitService, noteService } from "@/services/extraServices";
import { Habit, Note } from "@/utils/types";

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationService.list(),
    refetchInterval: 60_000,
  });
}

export function useNotificationMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["notifications"] });

  const markRead = useMutation({ mutationFn: (id: string) => notificationService.markRead(id), onSuccess: invalidate });
  const markAllRead = useMutation({ mutationFn: () => notificationService.markAllRead(), onSuccess: invalidate });
  const remove = useMutation({ mutationFn: (id: string) => notificationService.remove(id), onSuccess: invalidate });

  return { markRead, markAllRead, remove };
}

export function useHabits() {
  return useQuery({ queryKey: ["habits"], queryFn: () => habitService.list() });
}

export function useHabitMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["habits"] });

  const create = useMutation({
    mutationFn: (payload: Partial<Habit>) => habitService.create(payload),
    onSuccess: () => {
      invalidate();
      toast.success("Hábito criado");
    },
  });
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Habit> }) => habitService.update(id, payload),
    onSuccess: invalidate,
  });
  const toggleToday = useMutation({
    mutationFn: (id: string) => habitService.toggleToday(id),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => habitService.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Hábito removido");
    },
  });

  return { create, update, toggleToday, remove };
}

export function useNotes() {
  return useQuery({ queryKey: ["notes"], queryFn: () => noteService.list() });
}

export function useNoteMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["notes"] });

  const create = useMutation({ mutationFn: (payload: Partial<Note>) => noteService.create(payload), onSuccess: invalidate });
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Note> }) => noteService.update(id, payload),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: (id: string) => noteService.remove(id), onSuccess: invalidate });

  return { create, update, remove };
}
