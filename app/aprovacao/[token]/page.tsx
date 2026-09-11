import { notFound } from "next/navigation";
import { ShieldCheck, Calendar } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { visualDoFormato } from "@/lib/conteudoVisual";
import { AcoesAprovacao } from "./AcoesAprovacao";

export default async function AprovacaoPublicaPage({ params }: { params: { token: string } }) {
  const conteudo = await prisma.conteudo.findUnique({
    where: { tokenAprovacao: params.token },
    include: { cliente: true },
  });
  if (!conteudo) notFound();

  if (!conteudo.visualizadoAprovacaoEm) {
    await prisma.conteudo.update({ where: { id: conteudo.id }, data: { visualizadoAprovacaoEm: new Date() } });
  }

  const { icone: Icon, label } = visualDoFormato(conteudo.formato);
  const jaDecidido = conteudo.status === "aprovado" || conteudo.status === "alteracao_solicitada";

  return (
    <div className="min-h-screen bg-[#0B0D12]">
      <div className="border-b border-white/[0.06] px-4 py-4">
        <div className="mx-auto max-w-lg">
          <img src="/logo.png" alt="Instaby" className="h-6 w-auto" />
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-10">
        <div className="mb-6 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <span className="inline-block h-[1.5px] w-5 bg-[#E63946]" />
            <span className="font-mono text-[11px] uppercase tracking-wide text-[#E63946]">
              aprovação de conteúdo
            </span>
            <span className="inline-block h-[1.5px] w-5 bg-[#E63946]" />
          </div>
          <p className="text-2xl font-medium text-[#F9FAFB]">{conteudo.titulo}</p>
          {conteudo.cliente && <p className="text-sm text-[#6B7280]">{conteudo.cliente.nome}</p>}
        </div>

        <div className="mb-4 flex items-center gap-2 rounded-xl border border-white/[0.06] bg-[#111827]/50 p-4">
          <Icon size={16} className="text-[#E63946]" />
          <span className="text-sm text-[#F9FAFB]">{label}</span>
          {conteudo.dataPublicacao && (
            <span className="ml-auto flex items-center gap-1 text-xs text-[#9CA3AF]">
              <Calendar size={12} /> {new Date(conteudo.dataPublicacao).toLocaleDateString("pt-BR")}
            </span>
          )}
        </div>

        {conteudo.linkArquivos && (
          <a
            href={conteudo.linkArquivos}
            target="_blank"
            className="mb-4 block rounded-xl border border-white/[0.06] bg-[#111827]/50 p-4 text-center text-sm text-[#E63946] hover:underline"
          >
            Ver o material →
          </a>
        )}

        {conteudo.legenda && (
          <div className="mb-4 rounded-xl border border-white/[0.06] bg-[#111827]/50 p-4">
            <p className="mb-1 text-xs uppercase tracking-wide text-[#9CA3AF]">Legenda</p>
            <p className="whitespace-pre-line text-sm text-[#F9FAFB]">{conteudo.legenda}</p>
          </div>
        )}

        {conteudo.objetivo && (
          <div className="mb-6 rounded-xl border border-white/[0.06] bg-[#111827]/50 p-4">
            <p className="mb-1 text-xs uppercase tracking-wide text-[#9CA3AF]">Sobre esse conteúdo</p>
            <p className="text-sm text-[#F9FAFB]">{conteudo.objetivo}</p>
          </div>
        )}

        {jaDecidido ? (
          <div
            className={`rounded-2xl border p-5 text-center ${
              conteudo.status === "aprovado" ? "border-emerald-500/20 bg-emerald-500/5" : "border-amber-500/20 bg-amber-500/5"
            }`}
          >
            <p className={`text-sm ${conteudo.status === "aprovado" ? "text-emerald-300" : "text-amber-300"}`}>
              {conteudo.status === "aprovado" ? "Você já aprovou esse conteúdo." : "Você já pediu uma alteração nesse conteúdo."}
            </p>
          </div>
        ) : (
          <AcoesAprovacao token={params.token} />
        )}

        <div className="mt-8 flex items-center justify-center gap-1.5 text-[10px] text-[#6B7280]">
          <ShieldCheck size={11} /> Instaby Agência
        </div>
      </div>
    </div>
  );
}
