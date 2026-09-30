import Link from "next/link";
import { ChevronLeft, ChevronRight, PackageSearch, Repeat } from "lucide-react";
import { calcularEntregasDoMes, BUCKETS_ENTREGA, BUCKET_ENTREGA_LABEL, EntregaServico, ServicoContratadoParaEntrega, TarefaParaEntrega } from "@/lib/entregas";

const NOMES_MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// Aba "Entregas" (Etapa 3 v157) — controle mensal do exemplo da especificação
// ("8 reels contratados, 3 publicados, 2 aprovados..."). Fica de propósito como
// SERVER COMPONENT puro (sem "use client"): navegação de mês é por link com
// searchParam (?entregasMes=AAAA-MM, ver page.tsx) e o detalhe por serviço abre
// com <details> nativo — nenhuma das duas coisas precisa de JS no cliente.
export function EntregasTab({
  servicosContratados,
  tarefas,
  ano,
  mes,
  podeVerCatalogo,
}: {
  servicosContratados: ServicoContratadoParaEntrega[];
  tarefas: TarefaParaEntrega[];
  ano: number;
  mes: number; // 0-11
  podeVerCatalogo: boolean;
}) {
  const entregas = calcularEntregasDoMes({ servicosContratados, tarefas, ano, mes });
  const anterior = mes === 0 ? { ano: ano - 1, mes: 11 } : { ano, mes: mes - 1 };
  const seguinte = mes === 11 ? { ano: ano + 1, mes: 0 } : { ano, mes: mes + 1 };
  const hrefMes = (a: number, m: number) => `?aba=entregas&entregasMes=${a}-${String(m + 1).padStart(2, "0")}`;

  const totalServicosContratados = servicosContratados.length;
  const totalRastreados = entregas.length;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <Link
          href={hrefMes(anterior.ano, anterior.mes)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:text-text"
        >
          <ChevronLeft size={14} />
        </Link>
        <p className="text-sm font-medium text-text">
          {NOMES_MESES[mes]} de {ano}
        </p>
        <Link
          href={hrefMes(seguinte.ano, seguinte.mes)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:text-text"
        >
          <ChevronRight size={14} />
        </Link>
      </div>
      <p className="mb-4 text-center text-[11px] text-muted">
        Contagem por tarefa, não por versão — uma correção ou nova versão não vira uma entrega a mais.
      </p>

      {totalRastreados === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 p-6 text-center">
          <PackageSearch className="mx-auto mb-2 text-muted" size={22} />
          <p className="text-sm text-text">
            {totalServicosContratados === 0
              ? "Esse cliente ainda não tem serviços contratados."
              : "Nenhum serviço contratado está configurado pra rastrear entregas ainda."}
          </p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-muted">
            {totalServicosContratados > 0 &&
              (podeVerCatalogo ? (
                <>
                  Defina a "categoria de entrega" de cada serviço em{" "}
                  <Link href="/dashboard/servicos" className="text-accent hover:underline">
                    Catálogo de Serviços
                  </Link>{" "}
                  pra esse painel começar a contar (ex: "Reels" → Criar Reel).
                </>
              ) : (
                'Peça pra um administrador definir a "categoria de entrega" dos serviços contratados, em Catálogo de Serviços.'
              ))}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {entregas.map((e) => (
            <CardEntrega key={e.servicoContratadoId} entrega={e} />
          ))}
        </div>
      )}
    </div>
  );
}

function CardEntrega({ entrega }: { entrega: EntregaServico }) {
  const temTarefas = BUCKETS_ENTREGA.some((b) => entrega.buckets[b].tarefas.length > 0);

  return (
    <div className="rounded-xl border border-border bg-card/60 p-4">
      <div className="mb-1 flex items-start justify-between gap-2">
        <p className="text-sm text-text">{entrega.servicoNome}</p>
        <span className={`shrink-0 text-sm font-medium ${entrega.saldo < 0 ? "text-red-400" : "text-text"}`}>
          Saldo: {entrega.saldo > 0 ? `+${entrega.saldo}` : entrega.saldo}
        </span>
      </div>
      <p className="mb-3 text-xs text-muted">
        {entrega.quantidadeContratada} contratado{entrega.quantidadeContratada !== 1 ? "s" : ""}
        {entrega.rolloverAnterior > 0 && (
          <span className="text-accent">
            {" "}
            <Repeat size={9} className="inline" /> +{entrega.rolloverAnterior} do mês anterior = {entrega.quantidadeEfetiva}
          </span>
        )}
        {" · "}
        {entrega.totalNoMes} no total esse mês
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {BUCKETS_ENTREGA.map((b) => (
          <div key={b} className="rounded-lg bg-base/50 p-2 text-center">
            <p className="text-lg font-semibold text-text">{entrega.buckets[b].count}</p>
            <p className="text-[10px] text-muted">{BUCKET_ENTREGA_LABEL[b]}</p>
          </div>
        ))}
      </div>

      {temTarefas && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-accent">Ver tarefas desse mês</summary>
          <div className="mt-2 flex flex-col gap-1.5">
            {BUCKETS_ENTREGA.flatMap((b) =>
              entrega.buckets[b].tarefas.map((t) => (
                <p key={t.id} className="text-xs text-muted">
                  <span className="text-text/80">{t.titulo}</span> — {t.detalhe}
                  {t.prazo && ` · ${new Date(t.prazo).toLocaleDateString("pt-BR")}`}
                </p>
              ))
            )}
          </div>
        </details>
      )}
    </div>
  );
}
