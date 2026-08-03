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
    mutationFn: (event: CalendarEvent) => eventService.remove(event.id),
    onSuccess: (_data, event) => {
      invalidate();
      toast(
        (t) => (
          <span className="flex items-center gap-3 text-sm">
            Evento removido
            <button
              onClick={() => {
                toast.dismiss(t.id);
                const payload = {
                  title: event.title,
                  description: event.description,
                  categoryId: event.categoryId,
                  location: event.location,
                  link: event.link,
                  phone: event.phone,
                  contactEmail: event.contactEmail,
                  startAt: event.startAt,
                  endAt: event.endAt,
                  allDay: event.allDay,
                  recurrence: event.recurrence,
                  priority: event.priority,
                  status: event.status,
                  notes: event.notes,
                  estimatedMinutes: event.estimatedMinutes,
                  isFavorite: event.isFavorite,
                  tags: event.tags.map((tag) => tag.name) as unknown as CalendarEvent["tags"],
                  reminders: event.reminders.map((r) => ({ minutesBefore: r.minutesBefore })),
                };
                create.mutate(payload);
              }}
              className="font-semibold text-primary-500 hover:underline"
            >
              Desfazer
            </button>
          </span>
        ),
        { duration: 5000 }
      );
    },
    onError: () => toast.error("Não foi possível remover o evento"),
  });

  return { create, update, move, duplicate, remove };
}
