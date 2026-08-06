"use client";

import { cn } from "@/lib/cn";

function formatarCentavos(centavos: number) {
  return (centavos / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function CurrencyInput({
  value,
  onChange,
  className,
  placeholder,
}: {
  value: number;
  onChange: (valor: number) => void;
  className?: string;
  placeholder?: string;
}) {
  const centavosAtuais = Math.round((value || 0) * 100);
  const exibicao = centavosAtuais > 0 ? formatarCentavos(centavosAtuais) : "";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const somenteDigitos = e.target.value.replace(/\D/g, "");
    const centavos = somenteDigitos ? parseInt(somenteDigitos, 10) : 0;
    onChange(centavos / 100);
  }

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
        R$
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={exibicao}
        onChange={handleChange}
        placeholder={placeholder || "0,00"}
        className={cn(
          "h-10 w-full rounded-xl border border-border bg-card/60 py-2 pl-9 pr-3 text-sm text-text outline-none transition-colors placeholder:text-muted/60 focus:border-accent/50 focus:ring-2 focus:ring-accent/10",
          className
        )}
      />
    </div>
  );
}
