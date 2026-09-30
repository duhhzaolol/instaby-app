// Dependências entre tarefas (Etapa 4 v158) — "criar dependências entre tarefas e
// mostrar impactos antes de alterar prazos". Fica server-safe (sem "use client"),
// puro (só recebe dados já carregados, nunca chama o Prisma direto) pra dar pra
// testar e reusar tanto na rota de impacto quanto, futuramente, em qualquer outro
// lugar que precise andar nesse grafo.

export type DependenciaLink = { tarefaId: string; dependeDeId: string };

export type TarefaParaDependencia = {
  id: string;
  titulo: string;
  prazo: Date | null;
  status: string;
};

// Partindo de `tarefaId` (a tarefa cujo prazo está mudando pra `novoPrazo`),
// encontra TODAS as tarefas que dependem dela — direta ou transitivamente,
// "dependente do dependente" — e devolve só as que ficariam com prazo
// problemático (prazo já definido, tarefa ainda não concluída, e prazo no mesmo
// dia ou antes do novo prazo de quem ela depende — ou seja, sem folga nenhuma
// depois que a tarefa precedente atrasar). NUNCA impede a mudança — só calcula
// pra mostrar antes de confirmar (ver Tarefa.dependeDe no schema).
export function calcularImpactoPrazo(
  tarefaId: string,
  novoPrazo: Date,
  todasDependencias: DependenciaLink[],
  tarefasPorId: Map<string, TarefaParaDependencia>
): TarefaParaDependencia[] {
  const dependentesDe = new Map<string, string[]>();
  for (const d of todasDependencias) {
    if (!dependentesDe.has(d.dependeDeId)) dependentesDe.set(d.dependeDeId, []);
    dependentesDe.get(d.dependeDeId)!.push(d.tarefaId);
  }

  const visitados = new Set<string>([tarefaId]);
  const fila = [tarefaId];
  const impactadas: TarefaParaDependencia[] = [];

  while (fila.length > 0) {
    const atual = fila.shift()!;
    for (const depId of dependentesDe.get(atual) || []) {
      if (visitados.has(depId)) continue;
      visitados.add(depId);
      fila.push(depId);
      const tarefa = tarefasPorId.get(depId);
      if (tarefa && tarefa.status !== "feito" && tarefa.prazo && tarefa.prazo <= novoPrazo) {
        impactadas.push(tarefa);
      }
    }
  }

  return impactadas;
}

// Verifica se ligar "novaTarefaId depende de novoDependeDeId" fecharia um ciclo
// (ex.: A depende de B que já depende de A, direta ou transitivamente) — chamado
// ao CRIAR uma dependência nova, antes de gravar. Não é pedido explícito da
// especificação, mas uma dependência circular não tem leitura possível de
// "impacto de prazo" (as duas tarefas ficariam esperando uma pela outra pra
// sempre), então travar isso na criação evita dado sem sentido.
export function criariCiclo(
  novaTarefaId: string,
  novoDependeDeId: string,
  dependenciasExistentes: DependenciaLink[]
): boolean {
  if (novaTarefaId === novoDependeDeId) return true; // depender de si mesma conta como ciclo

  const dependeDeMap = new Map<string, string[]>();
  for (const d of dependenciasExistentes) {
    if (!dependeDeMap.has(d.tarefaId)) dependeDeMap.set(d.tarefaId, []);
    dependeDeMap.get(d.tarefaId)!.push(d.dependeDeId);
  }

  const visitados = new Set<string>();
  const fila = [novoDependeDeId];
  while (fila.length > 0) {
    const atual = fila.shift()!;
    if (atual === novaTarefaId) return true;
    if (visitados.has(atual)) continue;
    visitados.add(atual);
    fila.push(...(dependeDeMap.get(atual) || []));
  }
  return false;
}
