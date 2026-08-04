import { useEffect, useState } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute, PublicOnlyRoute } from "@/components/layout/RouteGuards";
import { AppLayout } from "@/components/layout/AppLayout";
import { SplashScreen } from "@/components/layout/SplashScreen";

import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import DashboardPage from "@/pages/DashboardPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import CalendarPage from "@/pages/CalendarPage";
import TasksPage from "@/pages/TasksPage";
import CategoriesPage from "@/pages/CategoriesPage";
import HabitsPage from "@/pages/HabitsPage";
import FocusPage from "@/pages/FocusPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFoundPage from "@/pages/NotFoundPage";
import PublicBookingPage from "@/pages/PublicBookingPage";
import BookingAdminPage from "@/pages/BookingAdminPage";
import CollaborationPage from "@/pages/CollaborationPage";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1700);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { borderRadius: "12px", fontSize: "14px" },
          }}
        />
        <AnimatePresence mode="wait">
          {showSplash ? (
            <SplashScreen key="splash" />
          ) : (
            <HashRouter key="app">
              <Routes>
                <Route path="/agendar/:slug" element={<PublicBookingPage />} />

                <Route element={<PublicOnlyRoute />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                </Route>

                <Route element={<ProtectedRoute />}>
                  <Route element={<AppLayout />}>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/analytics" element={<AnalyticsPage />} />
                    <Route path="/calendar" element={<CalendarPage />} />
                    <Route path="/tasks" element={<TasksPage />} />
                    <Route path="/habits" element={<HabitsPage />} />
                    <Route path="/focus" element={<FocusPage />} />
                    <Route path="/categories" element={<CategoriesPage />} />
                    <Route path="/agendamentos" element={<BookingAdminPage />} />
                    <Route path="/colaboracao" element={<CollaborationPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </Route>
                </Route>

                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </HashRouter>
          )}
        </AnimatePresence>
      </AuthProvider>
    </ThemeProvider>
  );
}
