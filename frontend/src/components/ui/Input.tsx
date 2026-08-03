import { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode, forwardRef } from "react";
import clsx from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => (
    <label className="block w-full">
      {label && <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">{label}</span>}
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}
        <input
          ref={ref}
          className={clsx("input-field", icon && "pl-9", error && "border-danger-500 focus:ring-danger-400/40", className)}
          {...props}
        />
      </div>
      {error && <span className="mt-1 block text-xs text-danger-500">{error}</span>}
    </label>
  )
);
Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => (
    <label className="block w-full">
      {label && <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">{label}</span>}
      <textarea ref={ref} className={clsx("input-field min-h-[90px] resize-y", className)} {...props} />
      {error && <span className="mt-1 block text-xs text-danger-500">{error}</span>}
    </label>
  )
);
Textarea.displayName = "Textarea";
