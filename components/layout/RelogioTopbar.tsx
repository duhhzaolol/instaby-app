"use client";

import { useEffect, useState } from "react";
import { formatarDataHoraSaoPaulo, FUSO_HORARIO } from "@/lib/dataHora";

const horarioSemSegundos = new Intl.DateTimeFormat("pt-BR", {
  timeZone: FUSO_HORARIO,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function RelogioTopbar() {
  // O primeiro render é igual no servidor e no navegador; o relógio começa ao montar.
  const [agora, setAgora] = useState<Date | null>(null);

  useEffect(() => {
    const atualizar = () => setAgora(new Date());
    atualizar();
    let intervalo: ReturnType<typeof setInterval> | undefined;
    const proximoMinuto = setTimeout(() => {
      atualizar();
      intervalo = setInterval(atualizar, 60_000);
    }, 60_000 - Date.now() % 60_000);
    document.addEventListener("visibilitychange", atualizar);
    return () => {
      clearTimeout(proximoMinuto);
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", atualizar);
    };
  }, []);

  const texto = agora ? formatarDataHoraSaoPaulo(agora) : null;
  const horario = agora ? horarioSemSegundos.format(agora) : "--:--";

  return (
    <time
      dateTime={agora?.toISOString()}
      title="Data e hora atuais — horário de Brasília"
      aria-label={texto ? `${texto.dataCompleta}, ${horario}, horário de Brasília` : "Carregando data e hora"}
      className="min-w-[66px] shrink-0 whitespace-nowrap leading-tight sm:min-w-[144px] lg:text-right"
    >
      <span className="block text-[10px] text-muted sm:text-xs">
        <span className="sm:hidden">{texto?.dataCurta ?? "--/--/----"}</span>
        <span className="hidden sm:inline">{texto?.dataCompleta ?? "Carregando data…"}</span>
      </span>
      <span className="fonte-valores mt-1 block text-xs tabular-nums text-text">
        {horario}
        <span className="hidden font-sans text-[10px] text-muted sm:inline"> · Brasília</span>
      </span>
    </time>
  );
}
