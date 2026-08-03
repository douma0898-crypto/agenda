import { useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { KeyRound, Mail } from "lucide-react";
import { authService } from "@/services/authService";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch {
      toast.error("Não foi possível processar sua solicitação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-canvas-light to-secondary-50 dark:from-canvas-dark dark:via-canvas-dark dark:to-primary-900/20 px-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md card">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-lg">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Recuperar senha</h1>
          <p className="mt-1 text-sm text-slate-400">Informe seu e-mail e enviaremos instruções de recuperação</p>
        </div>

        {sent ? (
          <p className="rounded-xl bg-success-500/10 p-4 text-center text-sm text-success-600 dark:text-success-400">
            Se este e-mail existir em nossa base, você receberá as instruções em instantes.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="E-mail"
              type="email"
              icon={<Mail className="h-4 w-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" loading={loading} className="w-full">
              Enviar instruções
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-400">
          <Link to="/login" className="font-semibold text-primary-500 hover:underline">
            Voltar para o login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
