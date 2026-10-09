export type AbaCliente = { valor: string; label: string };

export type AreaCliente = {
  valor: string;
  label: string;
  abas: AbaCliente[];
};

const AREAS_CLIENTE = [
  { valor: "visao_geral", label: "Visão geral", abas: ["visao_geral"] },
  { valor: "producao", label: "Produção", abas: ["tarefas", "cronograma", "entregas", "solicitacoes", "horas"] },
  { valor: "dados", label: "Dados do cliente", abas: ["contatos", "links", "arquivos", "acessos", "onboarding"] },
  { valor: "comercial", label: "Comercial", abas: ["servicos", "orcamentos", "contratos"] },
  { valor: "financeiro", label: "Financeiro", abas: ["financeiro"] },
  { valor: "resultados", label: "Resultados", abas: ["trafego", "relatorios"] },
] as const;

/** Recebe somente as abas que o servidor já autorizou para a pessoa. */
export function agruparAbasCliente(abas: AbaCliente[]): AreaCliente[] {
  const porValor = new Map(abas.map((aba) => [aba.valor, aba]));
  const valoresConhecidos = new Set<string>(AREAS_CLIENTE.flatMap((area) => [...area.abas]));
  const adicionais = abas.filter((aba) => !valoresConhecidos.has(aba.valor));

  return AREAS_CLIENTE.map((area) => ({
    valor: area.valor,
    label: area.label,
    abas: [
      ...area.abas.flatMap((valor) => {
        const aba = porValor.get(valor);
        return aba ? [aba] : [];
      }),
      // Uma nova seção continua acessível até ganhar um grupo específico.
      ...(area.valor === "dados" ? adicionais : []),
    ],
  })).filter((area) => area.abas.length > 0);
}

/** Trocar de seção conserva o mês consultado e os demais filtros da URL. */
export function hrefAbaCliente(clienteId: string, aba: string, consultaAtual: string): string {
  const consulta = new URLSearchParams(consultaAtual);
  consulta.set("aba", aba);
  return `/dashboard/clientes/${encodeURIComponent(clienteId)}?${consulta.toString()}`;
}
