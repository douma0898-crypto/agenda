import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { MobileNav } from "./MobileNav";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { EventFormModal } from "@/components/calendar/EventFormModal";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export function AppLayout() {
  useKeyboardShortcuts();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto px-4 pb-24 pt-4 sm:px-5 sm:pt-6 md:px-6 md:pb-8 [padding-bottom:calc(6rem+env(safe-area-inset-bottom))] md:[padding-bottom:2rem]">
          <div className="mx-auto w-full max-w-6xl animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
      <MobileNav />
      <CommandPalette />
      <EventFormModal />
    </div>
  );
}
