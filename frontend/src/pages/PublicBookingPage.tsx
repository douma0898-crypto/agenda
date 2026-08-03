import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { CalendarClock, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { bookingService, DayAvailability, PublicBookingInfo } from "@/services/bookingService";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const WEEKDAY_LABEL = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export default function PublicBookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [info, setInfo] = useState<PublicBookingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selectedDay, setSelectedDay] = useState<DayAvailability | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    bookingService
      .getPublicInfo(slug)
      .then((data) => {
        setInfo(data);
        setSelectedDay((current) => {
          if (!current) return data.availability[0] || null;
          return data.availability.find((day) => day.date === current.date) || data.availability[0] || null;
        });
        setSelectedSlot(null);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const selectedSlotLabel = useMemo(() => {
    if (!selectedSlot) return null;
    const d = new Date(selectedSlot);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }, [selectedSlot]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!slug || !selectedSlot) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await bookingService.createBooking(slug, { name, email, start: selectedSlot, notes });
      setDone(true);
    } catch (err: any) {
      setFormError(err?.response?.data?.message || "Não foi possível confirmar o agendamento. Tente outro horário.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
      </div>
    );
  }

  if (notFound || !info) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-slate-50 px-6 text-center dark:bg-slate-950">
        <CalendarClock className="h-8 w-8 text-slate-400" />
        <h1 className="font-display text-lg font-bold text-slate-700 dark:text-slate-200">Link não encontrado</h1>
        <p className="max-w-sm text-sm text-slate-400">
          Esse link de agendamento não existe ou foi desativado pelo proprietário.
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-6 text-center dark:bg-slate-950">
        <CheckCircle2 className="h-12 w-12 text-secondary-500" />
        <h1 className="font-display text-xl font-bold text-slate-700 dark:text-slate-200">Agendamento confirmado!</h1>
        <p className="max-w-sm text-sm text-slate-400">
          Enviamos os detalhes para <span className="font-medium text-slate-600 dark:text-slate-300">{email}</span>.
          {info.owner.name} também foi notificado(a).
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <div className="card mb-5">
          <div className="mb-1 flex items-center gap-2 text-primary-600 dark:text-primary-300">
            <CalendarClock className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Agendar com {info.owner.name}</span>
          </div>
          <h1 className="font-display text-lg font-bold text-slate-800 dark:text-white sm:text-xl">{info.title}</h1>
          {info.description && <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{info.description}</p>}
          <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="h-3.5 w-3.5" /> Duração: {info.slotMinutes} minutos
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Escolha do dia e horário */}
          <div className="card">
            <h2 className="mb-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Escolha um horário</h2>

            {info.availability.length === 0 ? (
              <p className="text-sm text-slate-400">Nenhum horário disponível no momento.</p>
            ) : (
              <>
                <div className="scrollbar-hide mb-4 flex gap-2 overflow-x-auto pb-1">
                  {info.availability.map((day) => {
                    const d = new Date(day.date + "T00:00:00");
                    const active = selectedDay?.date === day.date;
                    return (
                      <button
                        key={day.date}
                        onClick={() => {
                          setSelectedDay(day);
                          setSelectedSlot(null);
                        }}
                        className={`flex shrink-0 flex-col items-center rounded-xl border px-3 py-2 text-xs transition-colors ${
                          active
                            ? "border-primary-500 bg-primary-500/10 text-primary-600 dark:text-primary-300"
                            : "border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-400"
                        }`}
                      >
                        <span className="uppercase">{WEEKDAY_LABEL[d.getDay()]}</span>
                        <span className="font-semibold">{d.getDate()}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-3 gap-2 xs:grid-cols-4">
                  {selectedDay?.slots.map((slot) => (
                    <button
                      key={slot.start}
                      onClick={() => setSelectedSlot(slot.start)}
                      className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                        selectedSlot === slot.start
                          ? "border-primary-500 bg-primary-500 text-white"
                          : "border-slate-200 text-slate-600 hover:border-primary-400 dark:border-white/10 dark:text-slate-300"
                      }`}
                    >
                      {new Date(slot.start).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Formulário de confirmação */}
          <div className="card">
            <h2 className="mb-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Seus dados</h2>
            {!selectedSlot ? (
              <p className="text-sm text-slate-400">Selecione um dia e horário ao lado para continuar.</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="rounded-xl bg-primary-500/10 px-3.5 py-2.5 text-sm font-medium text-primary-600 dark:text-primary-300">
                  Horário selecionado: {selectedSlotLabel}
                </div>
                <Input label="Nome completo" required value={name} onChange={(e) => setName(e.target.value)} />
                <Input label="E-mail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                <Textarea
                  label="Observações (opcional)"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                {formError && <p className="text-xs text-danger-500">{formError}</p>}
                <Button type="submit" className="w-full" loading={submitting}>
                  Confirmar agendamento
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
