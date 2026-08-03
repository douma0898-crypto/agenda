import { create } from "zustand";
import { CalendarEvent } from "@/utils/types";

interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  commandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;

  eventModal: { open: boolean; event: CalendarEvent | null; initialDate: Date | null };
  openEventModal: (event?: CalendarEvent | null, initialDate?: Date | null) => void;
  closeEventModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  commandPaletteOpen: false,
  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),

  eventModal: { open: false, event: null, initialDate: null },
  openEventModal: (event = null, initialDate = null) =>
    set({ eventModal: { open: true, event, initialDate } }),
  closeEventModal: () => set({ eventModal: { open: false, event: null, initialDate: null } }),
}));
