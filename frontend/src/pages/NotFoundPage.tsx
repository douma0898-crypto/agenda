import { Link } from "react-router-dom";
import { CalendarX2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 dark:bg-white/[0.06] text-primary-500">
        <CalendarX2 className="h-8 w-8" />
      </div>
      <h1 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Página não encontrada</h1>
      <p className="max-w-sm text-sm text-slate-400">O compromisso que você procura não está nesta agenda.</p>
      <Link to="/">
        <Button>Voltar para o início</Button>
      </Link>
    </div>
  );
}
