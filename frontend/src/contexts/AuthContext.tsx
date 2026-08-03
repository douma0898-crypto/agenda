import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { authService } from "@/services/authService";
import { User } from "@/utils/types";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (partial: User) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem("accessToken");
      const cached = localStorage.getItem("agenda_user");
      if (cached) setUser(JSON.parse(cached));

      if (token) {
        try {
          const me = await authService.me();
          setUser(me);
          localStorage.setItem("agenda_user", JSON.stringify(me));
        } catch {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("agenda_user");
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    bootstrap();
  }, []);

  const persistSession = (data: { accessToken: string; refreshToken: string; user: User }) => {
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("agenda_user", JSON.stringify(data.user));
    setUser(data.user);
  };

  const login = useCallback(async (email: string, password: string) => {
    const data = await authService.login(email, password);
    persistSession(data);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const data = await authService.register(name, email, password);
    persistSession(data);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("agenda_user");
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const me = await authService.me();
    setUser(me);
    localStorage.setItem("agenda_user", JSON.stringify(me));
  }, []);

  const updateUser = useCallback((partial: User) => {
    setUser(partial);
    localStorage.setItem("agenda_user", JSON.stringify(partial));
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, register, logout, refreshUser, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  return ctx;
}
