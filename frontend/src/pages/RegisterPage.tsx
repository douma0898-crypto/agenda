import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { CalendarHeart, Mail, Lock, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await registerUser(name, email, password);
      toast.success("Conta criada com sucesso!");
      navigate("/");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Não foi possível criar a conta");
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
          <h1 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Crie sua conta</h1>
          <p className="mt-1 text-sm text-slate-400">Comece a organizar sua rotina em minutos</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nome" icon={<User className="h-4 w-4" />} value={name} onChange={(e) => setName(e.target.value)} required />
          <Input
            label="E-mail"
            type="email"
            icon={<Mail className="h-4 w-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Senha"
            type="password"
            icon={<Lock className="h-4 w-4" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />

          <Button type="submit" loading={loading} className="w-full">
            Criar conta
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Já tem uma conta?{" "}
          <Link to="/login" className="font-semibold text-primary-500 hover:underline">
            Entrar
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
