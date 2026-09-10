import Link from "next/link";
import { ArrowLeft, Camera } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { visualDoFormato } from "@/lib/conteudoVisual";

const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function chaveDia(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function CaptacoesPage() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const conteudos = await prisma.conteudo.findMany({
    where: { dataCaptacao: { not: null } },
    include: { cliente: { select: { nome: true, cor: true } } },
    orderBy: { dataCaptacao: "asc" },
  });

  // agrupa por dia, e dentro do dia por cliente
  const porDia: Record<string, Record<string, { clienteNome: string; clienteCor: string | null; itens: typeof conteudos }>> = {};
  conteudos.forEach((c) => {
    if (!c.dataCaptacao) return;
    const chave = chaveDia(c.dataCaptacao);
    const clienteChave = c.cliente?.nome || "Sem cliente";
    (porDia[chave] ||= {});
    (porDia[chave][clienteChave] ||= { clienteNome: clienteChave, clienteCor: c.cliente?.cor || null, itens: [] }).itens.push(c);
  });

  const diasOrdenados = Object.keys(porDia).sort();
  const diasFuturos = diasOrdenados.filter((d) => new Date(d + "T12:00:00") >= hoje);
  const diasPassados = diasOrdenados.filter((d) => new Date(d + "T12:00:00") < hoje);

  function renderizarDia(chave: string) {
    const data = new Date(chave + "T12:00:00");
    const grupos = Object.values(porDia[chave]);
    return (
      <div key={chave} className="mb-4 overflow-hidden rounded-2xl border border-border">
        <div className="bg-card/60 px-4 py-2.5">
          <p className="text-sm font-medium text-text">
            {DIAS_SEMANA[data.getDay()].toUpperCase()} — {data.toLocaleDateString("pt-BR")}
          </p>
        </div>
        <div className="divide-y divide-border">
          {grupos.map((grupo) => (
            <div key={grupo.clienteNome} className="p-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium" style={{ color: grupo.clienteCor || "#9CA3AF" }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: grupo.clienteCor || "#9CA3AF" }} />
                {grupo.clienteNome.toUpperCase()}
              </p>
              <div className="flex flex-col gap-1.5">
                {grupo.itens.map((item) => {
                  const { icone: Icon, cor } = visualDoFormato(item.formato);
                  return (
                    <div key={item.id} className="flex items-center gap-2 text-sm text-text">
                      <Icon size={13} style={{ color: cor }} className="shrink-0" />
                      {item.titulo}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link href="/dashboard/conteudo" className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted hover:text-text">
        <ArrowLeft size={13} /> Conteúdo
      </Link>

      <p className="mb-1 text-lg font-medium text-text">Captações</p>
      <p className="mb-6 text-sm text-muted">
        Tudo que precisa ser gravado, agrupado por dia — pra chegar na captação sabendo o que produzir
      </p>

      {diasFuturos.length === 0 && diasPassados.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card/40 py-16 text-center">
          <Camera size={28} className="mb-3 text-muted" />
          <p className="text-sm text-muted">
            Nenhuma captação com data marcada ainda. Defina a "Data de captação" no conteúdo pra aparecer aqui.
          </p>
        </div>
      ) : (
        <>
          {diasFuturos.map(renderizarDia)}

          {diasPassados.length > 0 && (
            <>
              <p className="mb-3 mt-6 text-xs uppercase tracking-wide text-muted">Já passou</p>
              {diasPassados.reverse().map(renderizarDia)}
            </>
          )}
        </>
      )}
    </div>
  );
}
