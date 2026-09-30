// Templates evoluídos pra ciclo completo (Etapa 4 v158) — "evoluir os templates
// para gerar ciclos de planejamento, roteiro, captação, edição, aprovação,
// publicação e relatório" + "calcular prazos relativos à data de entrega ou
// publicação". Fica server-safe e puro (sem Prisma aqui dentro) — a rota de API
// e a geração automática mensal (lib/garantirRecorrentes.ts) chamam
// `montarCicloDeTarefas` e depois fazem a criação de verdade, uma tarefa de cada
// vez, encadeando a dependência entre elas.

export type EtapaTemplate = {
  id: string;
  ordem: number;
  titulo: string;
  categoria: string | null;
  diasRelativos: number;
  estimativaHoras: number | null;
};

// prazo da etapa = data-alvo do ciclo (entrega/publicação) + diasRelativos dias
// (negativo = antes da data-alvo, positivo = depois — ex.: relatório costuma vir
// alguns dias DEPOIS da publicação).
export function calcularPrazoEtapa(dataAlvo: Date, diasRelativos: number): Date {
  const d = new Date(dataAlvo);
  d.setDate(d.getDate() + diasRelativos);
  return d;
}

export type TarefaDoCiclo = {
  titulo: string;
  categoria: string | null;
  prazo: Date;
  estimativaHoras: number | null;
};

// Monta os dados de cada tarefa do ciclo, JÁ NA ORDEM de aplicação (por `ordem`)
// — quem chama cria as tarefas nessa mesma ordem e encadeia a dependência entre
// elas (cada uma depende da anterior), então a ordem devolvida aqui importa.
export function montarCicloDeTarefas(etapas: EtapaTemplate[], dataAlvo: Date): TarefaDoCiclo[] {
  return [...etapas]
    .sort((a, b) => a.ordem - b.ordem)
    .map((e) => ({
      titulo: e.titulo,
      categoria: e.categoria,
      prazo: calcularPrazoEtapa(dataAlvo, e.diasRelativos),
      estimativaHoras: e.estimativaHoras,
    }));
}

// Sugestão só pra pré-preencher o formulário de "novo template" com um ponto de
// partida razoável (editável antes de salvar) — nunca aplicada automaticamente.
export const ETAPAS_SUGERIDAS: Omit<EtapaTemplate, "id">[] = [
  { ordem: 0, titulo: "Planejamento", categoria: null, diasRelativos: -14, estimativaHoras: 1 },
  { ordem: 1, titulo: "Roteiro", categoria: null, diasRelativos: -10, estimativaHoras: 1 },
  { ordem: 2, titulo: "Captação", categoria: "gravacao", diasRelativos: -7, estimativaHoras: 3 },
  { ordem: 3, titulo: "Edição", categoria: "reel", diasRelativos: -4, estimativaHoras: 4 },
  { ordem: 4, titulo: "Aprovação", categoria: null, diasRelativos: -2, estimativaHoras: 0.5 },
  { ordem: 5, titulo: "Publicação", categoria: null, diasRelativos: 0, estimativaHoras: 0.5 },
  { ordem: 6, titulo: "Relatório", categoria: null, diasRelativos: 3, estimativaHoras: 1 },
];
