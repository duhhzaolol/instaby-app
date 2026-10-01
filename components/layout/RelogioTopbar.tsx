"use client";

import { useEffect, useState } from "react";
import { formatarDataHoraSaoPaulo } from "@/lib/dataHora";

export function RelogioTopbar() {
  // O primeiro render é igual no servidor e no navegador; o relógio começa ao montar.
  const [agora, setAgora] = useState<Date | null>(null);

  useEffect(() => {
    const atualizar = () => setAgora(new Date());
    atualizar();
    const intervalo = setInterval(atualizar, 1000);
    document.addEventListener("visibilitychange", atualizar);
    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", atualizar);
    };
  }, []);

  const texto = agora ? formatarDataHoraSaoPaulo(agora) : null;

  return (
    <time
      dateTime={agora?.toISOString()}
      title="Data e hora atuais — horário de Brasília"
      aria-label={texto ? `${texto.dataCompleta}, ${texto.horario}, horário de Brasília` : "Carregando data e hora"}
      className="shrink-0 whitespace-nowrap text-right leading-tight"
    >
      <span className="block text-[10px] text-muted sm:text-xs">
        <span className="sm:hidden">{texto?.dataCurta ?? "--/--/----"}</span>
        <span className="hidden sm:inline">{texto?.dataCompleta ?? "Carregando data…"}</span>
      </span>
      <span className="fonte-valores block text-xs tabular-nums text-text">
        {texto?.horario ?? "--:--:--"}
        <span className="hidden font-sans text-[10px] text-muted sm:inline"> · Brasília</span>
      </span>
    </time>
  );
}
