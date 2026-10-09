import Link from "next/link";
import {
  resumirCronograma,
  type TarefaCronograma,
} from "@/lib/cronogramaAgenda";
import { linkAgenda, type FiltrosAgenda } from "@/lib/agenda";
import { diaTrabalho, ehPlanejamento } from "@/lib/organizacaoTarefas";

type TarefaResumo = TarefaCronograma & {
  cliente: { id: string; nome: string; cor: string | null } | null;
};

export function ResumoMensalAgenda({
  tarefas,
  mesChave,
  clienteNome,
  filtros,
}: {
  tarefas: TarefaResumo[];
  mesChave: string;
  clienteNome?: string;
  filtros: FiltrosAgenda;
}) {
  const resumo = resumirCronograma(tarefas, mesChave);
  const porCliente = new Map<
    string,
    { nome: string; tarefas: TarefaResumo[] }
  >();
  for (const t of tarefas) {
    if (!t.cliente) continue;
    if (!porCliente.has(t.cliente.id))
      porCliente.set(t.cliente.id, { nome: t.cliente.nome, tarefas: [] });
    porCliente.get(t.cliente.id)!.tarefas.push(t);
  }
  const linhas = Array.from(porCliente)
    .map(([id, c]) => ({
      id,
      nome: c.nome,
      tarefas: c.tarefas.filter(
        (t) =>
          !ehPlanejamento(t) && t.prazo &&
          diaTrabalho(t.prazo).slice(0, 7) === mesChave,
      ).length,
      ...resumirCronograma(c.tarefas, mesChave),
    }))
    .filter((c) => c.tarefas || c.planejados || c.publicados || c.concluidas)
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const indicadores = [
    {
      chave: "planejados" as const,
      label: "Postagens planejadas",
      cor: "#60A5FA",
      datas: "postagem",
    },
    {
      chave: "publicados" as const,
      label: "Publicados no mês",
      cor: "#34D399",
      datas: "publicado",
    },
    {
      chave: "pendentes" as const,
      label: "Ainda por publicar",
      cor: "#FBBF24",
      datas: "postagem",
    },
    {
      chave: "concluidas" as const,
      label: "Tarefas concluídas",
      cor: "#A3E635",
      datas: "trabalho",
    },
  ];
  return (
    <section
      aria-label="Resumo mensal do cronograma"
      className="mb-5 rounded-2xl border border-border bg-card/30 p-3 sm:p-4"
    >
      <p className="mb-2 text-sm font-medium text-text">
        Resumo do mês
        {clienteNome ? ` · ${clienteNome}` : " · todos os clientes"}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {indicadores.map((i) => (
          <div
            key={i.chave}
            className="rounded-xl border border-border bg-base/40 px-3 py-2"
          >
            <p className="text-[11px] text-muted">{i.label}</p>
            <p className="mt-1 text-xl font-semibold" style={{ color: i.cor }}>
              {resumo[i.chave]}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-muted">
        Postagens usam o dia planejado; publicados usam a data registrada de
        publicação. Tarefas concluídas usam o prazo de produção. O resumo
        considera o mês inteiro do cliente, mesmo quando você filtra a
        visualização.
      </p>
      {!resumo.planejados && (
        <p className="mt-1 text-xs text-muted">
          Os dias de postagem deste mês ainda não foram definidos. Você pode
          preencher o dia planejado nos detalhes de cada conteúdo, sem informar
          horário.
        </p>
      )}
      {!clienteNome && linhas.length > 0 && (
        <details className="mt-3 border-t border-border pt-2">
          <summary className="cursor-pointer text-xs font-medium text-text">
            Ver resumo por cliente
          </summary>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs">
              <caption className="sr-only">Resumo mensal por cliente</caption>
              <thead className="text-muted">
                <tr>
                  <th scope="col" className="py-2 pr-3">
                    Cliente
                  </th>
                  <th scope="col" className="pr-3">
                    Tarefas do mês
                  </th>
                  <th scope="col" className="pr-3">
                    Planejadas
                  </th>
                  <th scope="col" className="pr-3">
                    Publicadas
                  </th>
                  <th scope="col" className="pr-3">
                    Por publicar
                  </th>
                  <th scope="col">Tarefas concluídas</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((c) => (
                  <tr
                    key={c.id}
                    className="border-t border-border/50 text-text"
                  >
                    <th scope="row" className="py-2 pr-3 font-normal">
                      <Link
                        href={linkAgenda(filtros, { cliente: c.id })}
                        className="hover:text-accent"
                      >
                        {c.nome}
                      </Link>
                    </th>
                    <td>{c.tarefas}</td>
                    <td>{c.planejados}</td>
                    <td>{c.publicados}</td>
                    <td>{c.pendentes}</td>
                    <td>{c.concluidas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </section>
  );
}
