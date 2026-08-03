import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { eventService, EventFilters } from "@/services/eventService";
import { CalendarEvent } from "@/utils/types";

export function useEvents(filters: EventFilters) {
  return useQuery({
    queryKey: ["events", filters],
    queryFn: () => eventService.list(filters),
    staleTime: 30_000,
  });
}

export function useEventMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["events"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const create = useMutation({
    mutationFn: (payload: Partial<CalendarEvent>) => eventService.create(payload),
    onSuccess: () => {
      invalidate();
      toast.success("Evento criado");
    },
    onError: () => toast.error("Não foi possível criar o evento"),
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CalendarEvent> }) => eventService.update(id, payload),
    onSuccess: () => {
      invalidate();
      toast.success("Evento atualizado");
    },
    onError: () => toast.error("Não foi possível atualizar o evento"),
  });

  const move = useMutation({
    mutationFn: ({ id, startAt, endAt }: { id: string; startAt: string; endAt: string }) => eventService.move(id, startAt, endAt),
    onSuccess: invalidate,
    onError: () => toast.error("Não foi possível mover o evento"),
  });

  const duplicate = useMutation({
    mutationFn: (id: string) => eventService.duplicate(id),
    onSuccess: () => {
      invalidate();
      toast.success("Evento duplicado");
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => eventService.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Evento removido");
    },
    onError: () => toast.error("Não foi possível remover o evento"),
  });

  return { create, update, move, duplicate, remove };
}
