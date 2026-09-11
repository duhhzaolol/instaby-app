export const ESTAGIOS_OPORTUNIDADE: { valor: string; label: string; cor: string }[] = [
  { valor: "novo_lead", label: "Novo lead", cor: "#9CA3AF" },
  { valor: "contato_feito", label: "Contato feito", cor: "#3B82F6" },
  { valor: "reuniao", label: "Reunião", cor: "#A855F7" },
  { valor: "proposta_enviada", label: "Proposta enviada", cor: "#EAB308" },
  { valor: "negociacao", label: "Negociação", cor: "#F97316" },
  { valor: "ganho", label: "Ganho", cor: "#22C55E" },
  { valor: "perdido", label: "Perdido", cor: "#EF4444" },
];

export function visualDoEstagio(valor: string) {
  return ESTAGIOS_OPORTUNIDADE.find((e) => e.valor === valor) || ESTAGIOS_OPORTUNIDADE[0];
}
