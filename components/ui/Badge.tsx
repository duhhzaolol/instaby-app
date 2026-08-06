import { cn } from "@/lib/cn";

type Tone = "yellow" | "green" | "red" | "gray" | "blue";

const tones: Record<Tone, string> = {
  yellow: "bg-accent/10 text-accent border border-accent/20",
  green: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  red: "bg-red-500/10 text-red-400 border border-red-500/20",
  gray: "bg-white/5 text-muted border border-white/10",
  blue: "bg-sky-500/10 text-sky-400 border border-sky-500/20",
};

export function Badge({ tone = "gray", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}
