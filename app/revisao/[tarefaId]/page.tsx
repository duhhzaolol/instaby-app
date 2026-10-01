import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CATEGORIAS_COM_REVISAO } from "@/lib/categoriaTarefaVisual";
import { STATUS_CONTEUDO_VALIDOS, STATUS_CONTEUDO_LABELS } from "@/lib/revisaoConteudo";
import { RevisaoInterativa } from "./RevisaoInterativa";
export const dynamic = "force-dynamic";

// Página pública de revisão/aprovação de conteúdo (Etapa 2 v153) — mesmo padrão
// de app/relatorio/[id]/page.tsx: link direto (UUID da própria tarefa), sem login,
// porque não existe conta de cliente nesse sistema. Busca tudo direto aqui
// (server component) e já filtra fora qualquer comentário interno na própria
// consulta — nunca chega no navegador do cliente pra depois ser escondido na tela,
// o filtro é antes disso.
export default async function RevisaoPublicaPage({ params }: { params: { tarefaId: string } }) {
  const tarefa = await prisma.tarefa.findUnique({
    where: { id: params.tarefaId },
    include: {
      cliente: { select: { nome: true, cor: true, logoUrl: true } },
      versoes: {
        orderBy: { numero: "desc" },
        include: {
          aprovadoPorContato: { select: { nome: true } },
          comentarios: {
            where: { interno: false },
            orderBy: { createdAt: "asc" },
            include: { usuario: { select: { nome: true } }, contato: { select: { nome: true } } },
          },
        },
      },
    },
  });

  if (!tarefa || !tarefa.clienteId || !CATEGORIAS_COM_REVISAO.includes((tarefa.categoria || "") as any)) {
    notFound();
  }

  const versoesPublicas = tarefa.versoes.map((v) => ({
    id: v.id,
    numero: v.numero,
    linkVideo: v.linkVideo,
    linkImagem: v.linkImagem,
    legenda: v.legenda,
    aprovadoEm: v.aprovadoEm ? v.aprovadoEm.toISOString() : null,
    alteracoesSolicitadasEm: v.alteracoesSolicitadasEm?.toISOString() || null,
    aprovadorNome: v.aprovadoPorContato?.nome || v.aprovadoPorNomeLivre || null,
    comentarios: v.comentarios.map((c) => ({
      id: c.id,
      texto: c.texto,
      createdAt: c.createdAt.toISOString(),
      autorNome: c.usuario?.nome || c.contato?.nome || c.autorNomeLivre || "Alguém",
      momentoVideoSegundos: c.momentoVideoSegundos,
      pontoImagemX: c.pontoImagemX,
      pontoImagemY: c.pontoImagemY,
    })),
  }));

  const etapaAtualIdx = tarefa.statusConteudo ? STATUS_CONTEUDO_VALIDOS.indexOf(tarefa.statusConteudo as any) : -1;

  return (
    <div className="min-h-screen bg-base">
      <div className="border-b border-border px-4 py-4">
        <div className="mx-auto max-w-2xl">
          <img src="/logo.png" alt="Instaby" className="h-6 w-auto" />
        </div>
      </div>

      <div className="border-b border-border bg-gradient-to-br from-base via-card/40 to-base px-4 py-10">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <span className="inline-block h-[1.5px] w-5 bg-accent" />
            <span className="font-mono text-[11px] uppercase tracking-wide text-accent">revisão de conteúdo</span>
            <span className="inline-block h-[1.5px] w-5 bg-accent" />
          </div>
          <p className="text-2xl font-medium leading-tight text-text sm:text-3xl">{tarefa.titulo}</p>
          <p className="mt-1 flex items-center justify-center gap-2 text-sm text-muted">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tarefa.cliente!.cor || "#9CA3AF" }} />
            {tarefa.cliente!.nome}
          </p>

          {etapaAtualIdx >= 0 && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5">
              {STATUS_CONTEUDO_VALIDOS.map((s, i) => (
                <span
                  key={s}
                  className={`rounded-full border px-2.5 py-1 text-[11px] ${
                    i === etapaAtualIdx
                      ? "border-accent/30 bg-accent/10 text-accent"
                      : i < etapaAtualIdx
                      ? "border-border text-text/60"
                      : "border-border text-muted"
                  }`}
                >
                  {STATUS_CONTEUDO_LABELS[s]}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8">
        {versoesPublicas.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card/50 p-6 text-center text-sm text-muted">
            Ainda não há material enviado pra revisão aqui.
          </p>
        ) : (
          <RevisaoInterativa tarefaId={tarefa.id} versoes={versoesPublicas} publicacaoSugeridaEm={tarefa.publicacaoSugeridaEm?.toISOString() || null} />
        )}
      </div>

      <div className="flex items-center justify-center gap-1.5 pb-8 pt-2 text-[10px] text-muted">
        <ShieldCheck size={11} /> Página de revisão confidencial — Instaby Agência
      </div>
    </div>
  );
}
