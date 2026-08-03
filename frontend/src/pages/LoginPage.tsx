import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { CalendarHeart, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("douma@agenda.com");
  const [password, setPassword] = useState("Douma02");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Bem-vindo de volta!");
      navigate("/");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "E-mail ou senha inválidos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-canvas-light to-secondary-50 dark:from-canvas-dark dark:via-canvas-dark dark:to-primary-900/20 px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md card"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-lg">
            <CalendarHeart className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Bem-vindo de volta</h1>
          <p className="mt-1 text-sm text-slate-400">Entre para continuar organizando sua rotina</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="E-mail"
            type="email"
            icon={<Mail className="h-4 w-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="relative">
            <Input
              label="Senha"
              type={showPassword ? "text" : "password"}
              icon={<Lock className="h-4 w-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-xs font-medium text-primary-500 hover:underline">
              Esqueceu sua senha?
            </Link>
          </div>

          <Button type="submit" loading={loading} className="w-full">
            Entrar
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Ainda não tem uma conta?{" "}
          <Link to="/register" className="font-semibold text-primary-500 hover:underline">
            Criar conta
          </Link>
        </p>

        <p className="mt-4 rounded-xl bg-slate-50 dark:bg-white/[0.06] p-3 text-center text-xs text-slate-400">
          Use a conta de demonstração já preenchida acima, ou crie a sua.
        </p>
      </motion.div>
    </div>
  );
}
