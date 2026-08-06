import { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card/40 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
        <Icon size={20} />
      </div>
      <p className="text-sm font-medium text-text">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-muted">{description}</p>
    </div>
  );
}
