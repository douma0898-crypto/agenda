import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUIStore } from "@/contexts/useUIStore";

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || el.isContentEditable;
}

/**
 * Atalhos globais:
 *  - ⌘K / Ctrl+K → command palette (já tratado no próprio componente)
 *  - N            → novo evento
 *  - T             → nova tarefa
 *  - G depois D      → ir para Dashboard
 *  - G depois C       → ir para Calendário
 *  - G depois T        → ir para Tarefas
 *  - Esc                → fecha modais abertos
 */
export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const { openEventModal, closeEventModal, closeCommandPalette, eventModal } = useUIStore();

  useEffect(() => {
    let awaitingG = false;
    let gTimeout: ReturnType<typeof setTimeout> | null = null;

    const handler = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;

      if (awaitingG) {
        awaitingG = false;
        if (gTimeout) clearTimeout(gTimeout);
        const key = e.key.toLowerCase();
        if (key === "d") navigate("/");
        if (key === "a") navigate("/analytics");
        if (key === "c") navigate("/calendar");
        if (key === "t") navigate("/tasks");
        if (key === "h") navigate("/habits");
        return;
      }

      switch (e.key.toLowerCase()) {
        case "g":
          awaitingG = true;
          gTimeout = setTimeout(() => (awaitingG = false), 1200);
          break;
        case "n":
          e.preventDefault();
          openEventModal();
          break;
        case "t":
          e.preventDefault();
          navigate("/tasks?new=1");
          break;
        case "escape":
          if (eventModal.open) closeEventModal();
          closeCommandPalette();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate, openEventModal, closeEventModal, closeCommandPalette, eventModal.open]);
}
