import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buscarCronogramaPublico } from "@/lib/cronogramaServidor";
import { nomeMesCronograma } from "@/lib/cronogramaApresentacao";
import { PautasCronograma } from "@/components/cronograma/PautasCronograma";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Cronograma proposto | Instaby", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function CronogramaPublicoPage({ params }: { params: { token: string } }) {
  const cronograma = await buscarCronogramaPublico(params.token);
  if (!cronograma) notFound();
  return <main className="min-h-screen bg-base">
    <header className="border-b border-border px-4 py-5"><div className="mx-auto max-w-3xl"><img src="/logo.png" alt="Instaby" className="h-7 w-auto" /></div></header>
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12"><p className="text-xs uppercase tracking-wider text-accent">{cronograma.clienteNome}</p><h1 className="mt-3 text-2xl font-medium text-text sm:text-3xl">Cronograma proposto</h1><p className="mt-2 capitalize text-muted">{nomeMesCronograma(cronograma.mes)}</p><p className="mb-7 mt-4 max-w-xl text-sm leading-relaxed text-muted">Estas são as ideias de conteúdo para o mês. Confira os roteiros e deixe sugestões em cada pauta. As datas são previstas e podem ser ajustadas durante o alinhamento.</p><PautasCronograma pautas={cronograma.pautas} token={params.token} /><p className="mt-8 text-center text-xs text-muted">Planejamento de conteúdo · Instaby Agência</p></div>
  </main>;
}
