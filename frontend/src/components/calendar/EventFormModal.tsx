import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Trash2, Star, MapPin, Link as LinkIcon, Phone, Mail, Repeat, Bell, Paperclip, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useUIStore } from "@/contexts/useUIStore";
import { useCategories } from "@/hooks/useDashboard";
import { useEventMutations } from "@/hooks/useEvents";
import { toDateTimeLocalInput, REMINDER_OPTIONS } from "@/utils/date";
import { attachmentService } from "@/services/extraServices";
import { API_BASE_URL } from "@/services/api";
import toast from "react-hot-toast";
import { CalendarEvent, Priority, Recurrence, AttachmentItem } from "@/utils/types";

interface FormValues {
  title: string;
  description?: string;
  categoryId?: string;
  location?: string;
  link?: string;
  phone?: string;
  contactEmail?: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  recurrence: Recurrence;
  priority: Priority;
  status: string;
  notes?: string;
  estimatedMinutes?: number;
  isFavorite: boolean;
  tags: string;
  reminderMinutes: number[];
}

function defaultTimes(initialDate?: Date | null) {
  const start = initialDate ? new Date(initialDate) : new Date();
  start.setMinutes(0, 0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function EventFormModal() {
  const { eventModal, closeEventModal } = useUIStore();
  const { data: categories } = useCategories();
  const { create, update, remove } = useEventMutations();
  const editing = eventModal.event;
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [uploading, setUploading] = useState(false);

  const { register, handleSubmit, reset, control, watch } = useForm<FormValues>();

  useEffect(() => {
    if (!eventModal.open) return;

    if (editing) {
      reset({
        title: editing.title,
        description: editing.description || "",
        categoryId: editing.categoryId || "",
        location: editing.location || "",
        link: editing.link || "",
        phone: editing.phone || "",
        contactEmail: editing.contactEmail || "",
        startAt: toDateTimeLocalInput(editing.startAt),
        endAt: toDateTimeLocalInput(editing.endAt),
        allDay: editing.allDay,
        recurrence: editing.recurrence,
        priority: editing.priority,
        status: editing.status,
        notes: editing.notes || "",
        estimatedMinutes: editing.estimatedMinutes || undefined,
        isFavorite: editing.isFavorite,
        tags: editing.tags.map((t) => t.name).join(", "),
        reminderMinutes: editing.reminders.map((r) => r.minutesBefore),
      });
      setAttachments(editing.attachments || []);
    } else {
      const { start, end } = defaultTimes(eventModal.initialDate);
      reset({
        title: "",
        description: "",
        categoryId: categories?.[0]?.id || "",
        location: "",
        link: "",
        phone: "",
        contactEmail: "",
        startAt: toDateTimeLocalInput(start),
        endAt: toDateTimeLocalInput(end),
        allDay: false,
        recurrence: "none",
        priority: "medium",
        status: "scheduled",
        notes: "",
        estimatedMinutes: undefined,
        isFavorite: false,
        tags: "",
        reminderMinutes: [30],
      });
      setAttachments([]);
    }
  }, [eventModal.open, editing, eventModal.initialDate, reset, categories]);

  const onSubmit = (values: FormValues) => {
    const payload: Partial<CalendarEvent> = {
      title: values.title,
      description: values.description,
      categoryId: values.categoryId || null,
      location: values.location,
      link: values.link,
      phone: values.phone,
      contactEmail: values.contactEmail,
      startAt: new Date(values.startAt).toISOString(),
      endAt: new Date(values.endAt).toISOString(),
      allDay: values.allDay,
      recurrence: values.recurrence,
      priority: values.priority,
      status: values.status as CalendarEvent["status"],
      notes: values.notes,
      estimatedMinutes: values.estimatedMinutes ? Number(values.estimatedMinutes) : undefined,
      isFavorite: values.isFavorite,
      tags: values.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean) as unknown as CalendarEvent["tags"],
      reminders: values.reminderMinutes.map((m) => ({ minutesBefore: m })),
    };

    if (editing) {
      update.mutate({ id: editing.id, payload }, { onSuccess: closeEventModal });
    } else {
      create.mutate(payload, { onSuccess: closeEventModal });
    }
  };

  const watchedReminders = watch("reminderMinutes") || [];

  return (
    <Modal open={eventModal.open} onClose={closeEventModal} title={editing ? "Editar evento" : "Novo evento"} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Título" placeholder="Ex: Reunião com o time" {...register("title", { required: true })} />
        <Textarea label="Descrição" placeholder="Detalhes do evento..." {...register("description")} />

        <div className="grid grid-cols-1 gap-3 xs:grid-cols-2">
          <Input label="Início" type="datetime-local" {...register("startAt", { required: true })} />
          <Input label="Fim" type="datetime-local" {...register("endAt", { required: true })} />
        </div>

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
          <label className="block text-sm">
            <span className="mb-1.5 flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
              <Repeat className="h-3.5 w-3.5" /> Recorrência
            </span>
            <select className="input-field" {...register("recurrence")}>
              <option value="none">Não repetir</option>
              <option value="daily">Diariamente</option>
              <option value="weekly">Semanalmente</option>
              <option value="monthly">Mensalmente</option>
              <option value="yearly">Anualmente</option>
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-slate-600 dark:text-slate-300">Status</span>
            <select className="input-field" {...register("status")}>
              <option value="scheduled">Agendado</option>
              <option value="in_progress">Em andamento</option>
              <option value="done">Concluído</option>
              <option value="canceled">Cancelado</option>
            </select>
          </label>
        </div>

        <Input label="Local" icon={<MapPin className="h-4 w-4" />} placeholder="Ex: Sala de reuniões" {...register("location")} />
        <Input label="Link" icon={<LinkIcon className="h-4 w-4" />} placeholder="https://..." {...register("link")} />

        <div className="grid grid-cols-1 gap-3 xs:grid-cols-2">
          <Input label="Telefone" icon={<Phone className="h-4 w-4" />} {...register("phone")} />
          <Input label="E-mail de contato" icon={<Mail className="h-4 w-4" />} {...register("contactEmail")} />
        </div>

        <Input label="Tags" placeholder="trabalho, urgente, cliente-x" {...register("tags")} />

        <div>
          <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
            <Bell className="h-3.5 w-3.5" /> Lembretes
          </span>
          <Controller
            control={control}
            name="reminderMinutes"
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {REMINDER_OPTIONS.map((opt) => {
                  const active = field.value?.includes(opt.value);
                  return (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() =>
                        field.onChange(
                          active ? field.value.filter((v) => v !== opt.value) : [...(field.value || []), opt.value]
                        )
                      }
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        active
                          ? "border-primary-500 bg-primary-500/10 text-primary-600 dark:text-primary-300"
                          : "border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}
          />
          <p className="mt-1 text-xs text-slate-400">{watchedReminders.length} lembrete(s) selecionado(s)</p>
        </div>

        <div>
          <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
            <Paperclip className="h-3.5 w-3.5" /> Anexos
          </span>
          {!editing && <p className="mb-2 text-xs text-slate-400">Salve o evento primeiro para poder anexar arquivos.</p>}
          {editing && (
            <>
              <div className="space-y-1.5">
                {attachments.map((att) => (
                  <div key={att.id} className="flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-white/[0.06] px-2.5 py-1.5">
                    <Paperclip className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <a
                      href={`${API_BASE_URL}${att.fileUrl.replace("/api", "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 truncate text-sm text-slate-600 dark:text-slate-300 hover:underline"
                    >
                      {att.fileName}
                    </a>
                    <button
                      type="button"
                      onClick={async () => {
                        await attachmentService.remove(att.id);
                        setAttachments((prev) => prev.filter((a) => a.id !== att.id));
                      }}
                    >
                      <X className="h-3.5 w-3.5 text-slate-400 hover:text-danger-500" />
                    </button>
                  </div>
                ))}
              </div>
              <label className="btn-secondary mt-2 inline-flex cursor-pointer text-xs">
                {uploading ? "Enviando..." : "Anexar arquivo"}
                <input
                  type="file"
                  className="hidden"
                  disabled={uploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !editing) return;
                    setUploading(true);
                    try {
                      const uploaded = await attachmentService.upload(file, { eventId: editing.id });
                      setAttachments((prev) => [...prev, uploaded]);
                      toast.success("Arquivo anexado");
                    } catch {
                      toast.error("Não foi possível enviar o arquivo");
                    } finally {
                      setUploading(false);
                      e.target.value = "";
                    }
                  }}
                />
              </label>
            </>
          )}
        </div>

        <Textarea label="Observações" placeholder="Notas adicionais..." {...register("notes")} />

        <div className="grid grid-cols-1 gap-3 xs:grid-cols-2">
          <Input label="Tempo estimado (min)" type="number" {...register("estimatedMinutes")} />
          <label className="flex items-center gap-2 self-end pb-2.5 text-sm">
            <input type="checkbox" className="h-4 w-4 rounded accent-primary-500" {...register("allDay")} />
            Dia inteiro
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input type="checkbox" className="h-4 w-4 rounded accent-warning-500" {...register("isFavorite")} />
          <Star className="h-4 w-4 text-warning-500" /> Marcar como favorito
        </label>

        <div className="flex items-center justify-between border-t border-slate-200/70 dark:border-white/10 pt-4">
          {editing ? (
            <Button
              type="button"
              variant="danger"
              onClick={() => remove.mutate(editing.id, { onSuccess: closeEventModal })}
            >
              <Trash2 className="h-4 w-4" /> Excluir
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={closeEventModal}>
              Cancelar
            </Button>
            <Button type="submit" loading={create.isPending || update.isPending}>
              {editing ? "Salvar alterações" : "Criar evento"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
