import { motion } from "framer-motion";
import { CalendarHeart } from "lucide-react";

export function SplashScreen() {
  return (
    <motion.div
      key="splash"
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.45, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 via-canvas-light to-secondary-50 dark:from-canvas-dark dark:via-canvas-dark dark:to-primary-900/20"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-500 to-secondary-600 shadow-glass dark:shadow-glass-dark sm:h-24 sm:w-24"
      >
        <motion.span
          className="absolute inset-0 rounded-3xl bg-primary-500/40"
          animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <CalendarHeart className="relative h-10 w-10 text-white sm:h-12 sm:w-12" strokeWidth={1.8} />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="mt-6 font-display text-2xl font-bold text-slate-800 dark:text-white sm:text-3xl"
      >
        Agenda
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.5 }}
        className="mt-1.5 text-sm text-slate-400"
      >
        Sua rotina, no controle
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        className="mt-8 flex gap-1.5"
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-2 w-2 rounded-full bg-primary-500"
            animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
