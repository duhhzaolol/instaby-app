export function urgenciaPrazo(prazo: string | Date | null | undefined): { cor: string; label: string } | null {
  if (!prazo) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dia = new Date(prazo);
  dia.setHours(0, 0, 0, 0);
  const diffDias = Math.round((dia.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDias < 0) return { cor: "#EF4444", label: "vencido" };
  if (diffDias === 0) return { cor: "#F97316", label: "vence hoje" };
  if (diffDias === 1) return { cor: "#F59E0B", label: "vence amanhã" };
  if (diffDias <= 3) return { cor: "#EAB308", label: `vence em ${diffDias} dias` };
  return null; // sem urgência ainda
}
