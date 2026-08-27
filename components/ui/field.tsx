import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

/** Label + control + hint wrapper for consistent forms. */
export function Field({
  label,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="flex items-center justify-between text-[13px] font-medium text-fg-muted">
        <span>
          {label} {required && <span className="text-accent">*</span>}
        </span>
        {hint && <span className="text-[11px] text-fg-faint">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("field px-4 py-3 text-sm", className)} {...rest} />;
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("field px-4 py-3 text-sm leading-relaxed resize-y", className)} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn("field px-4 py-3 text-sm cursor-pointer", className)} {...rest}>
      {children}
    </select>
  );
}
