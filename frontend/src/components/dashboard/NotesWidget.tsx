import { useState } from "react";
import { Plus, Pin, Trash2, StickyNote } from "lucide-react";
import { useNotes, useNoteMutations } from "@/hooks/useExtras";
import { EmptyState, Skeleton } from "@/components/ui/Primitives";

const NOTE_COLORS = ["#F1F0FE", "#EDFCFA", "#FEF3E2", "#FEEBEE", "#EAF6FF"];

export function NotesWidget() {
  const { data: notes, isLoading } = useNotes();
  const { create, update, remove } = useNoteMutations();
  const [draft, setDraft] = useState("");

  const addNote = () => {
    if (!draft.trim()) return;
    create.mutate({ content: draft.trim(), color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)] });
    setDraft("");
  };

  return (
    <div className="card">
      <h3 className="mb-3 flex items-center gap-1.5 font-display font-semibold text-slate-700 dark:text-slate-200">
        <StickyNote className="h-4 w-4" /> Notas rápidas
      </h3>

      <div className="mb-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addNote()}
          placeholder="Escrever uma nota..."
          className="input-field flex-1 text-sm"
        />
        <button onClick={addNote} className="btn-secondary !px-3">
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : !notes || notes.length === 0 ? (
        <EmptyState title="Nenhuma nota ainda" description="Anote lembretes rápidos aqui." />
      ) : (
        <div className="space-y-2">
          {notes.slice(0, 6).map((note) => (
            <div
              key={note.id}
              className="group flex items-start gap-2 rounded-xl p-2.5 text-sm"
              style={{ backgroundColor: note.color }}
            >
              <p className="flex-1 whitespace-pre-wrap break-words text-slate-700">{note.content}</p>
              <button
                onClick={() => update.mutate({ id: note.id, payload: { pinned: !note.pinned } })}
                className={`opacity-0 transition-opacity group-hover:opacity-100 ${note.pinned ? "!opacity-100 text-primary-600" : "text-slate-400"}`}
              >
                <Pin className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => remove.mutate(note.id)} className="text-slate-400 opacity-0 transition-opacity hover:text-danger-500 group-hover:opacity-100">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
