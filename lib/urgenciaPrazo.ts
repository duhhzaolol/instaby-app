import { diaTrabalho } from "@/lib/organizacaoTarefas";

export function urgenciaPrazo(prazo: string | Date | null | undefined): { cor: string; label: string } | null {
  if (!prazo) return null;
  const dia = diaTrabalho(prazo);
  if (!dia) return null;
  const hoje = diaTrabalho(new Date(), false);
  const diffDias = Math.round((Date.parse(`${dia}T12:00:00Z`) - Date.parse(`${hoje}T12:00:00Z`)) / 86400000);

  if (diffDias < 0) return { cor: "#EF4444", label: "vencido" };
  if (diffDias === 0) return { cor: "#F97316", label: "vence hoje" };
  if (diffDias === 1) return { cor: "#F59E0B", label: "vence amanhã" };
  if (diffDias <= 3) return { cor: "#EAB308", label: `vence em ${diffDias} dias` };
  return null; // sem urgência ainda
}
