import { InputHTMLAttributes, LabelHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-xl border border-border bg-card/60 px-3 text-sm text-text outline-none transition-colors placeholder:text-muted/60 focus:border-accent/50 focus:ring-2 focus:ring-accent/10",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border border-border bg-card/60 px-3 py-2 text-sm text-text outline-none transition-colors placeholder:text-muted/60 focus:border-accent/50 focus:ring-2 focus:ring-accent/10",
        className
      )}
      {...props}
    />
  );
}

export function Label({ children, className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-xs font-medium text-muted", className)} {...props}>{children}</label>;
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-xl border border-border bg-card/60 px-3 text-sm text-text outline-none transition-colors focus:border-accent/50 focus:ring-2 focus:ring-accent/10",
        className
      )}
      {...props}
    />
  );
}
