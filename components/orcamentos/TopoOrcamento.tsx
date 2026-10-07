import type { ApresentacaoOrcamento } from "@/lib/apresentacaoOrcamento";

export function TopoOrcamento({
  apresentacao,
  compacto = false,
}: {
  apresentacao: ApresentacaoOrcamento;
  compacto?: boolean;
}) {
  const Titulo = compacto ? "h2" : "h1";
  const tamanhoTitulo = compacto ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl";

  return (
    <section
      aria-label="Apresentação da proposta"
      className={`relative overflow-hidden border-b border-white/[0.06] bg-gradient-to-b from-[#0B0D12] via-[#151822] to-[#0B0D12] px-4 ${compacto ? "py-9" : "py-16"}`}
    >
      <svg aria-hidden="true" viewBox="0 0 800 300" className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.12]">
        <defs>
          <linearGradient id="linhaChartOrcamento" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E63946" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#E63946" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0 220 L100 190 L200 205 L300 130 L400 160 L500 80 L600 110 L700 40 L800 60 L800 300 L0 300 Z" fill="url(#linhaChartOrcamento)" />
        <path d="M0 220 L100 190 L200 205 L300 130 L400 160 L500 80 L600 110 L700 40 L800 60" fill="none" stroke="#E63946" strokeWidth="2" />
      </svg>

      <div className="relative mx-auto max-w-2xl text-center">
        {apresentacao.selo && (
          <div className="mb-4 flex items-center justify-center gap-2">
            <span className="inline-block h-[1.5px] w-5 shrink-0 bg-[#E63946]" />
            <p className="min-w-0 break-words font-mono text-[11px] uppercase tracking-wide text-[#E63946] [overflow-wrap:anywhere]">{apresentacao.selo}</p>
            <span className="inline-block h-[1.5px] w-5 shrink-0 bg-[#E63946]" />
          </div>
        )}
        <Titulo className={`${tamanhoTitulo} whitespace-pre-line break-words font-medium leading-tight text-[#F9FAFB] [overflow-wrap:anywhere]`}>
          {apresentacao.titulo}
        </Titulo>
        {(apresentacao.destaque || apresentacao.complemento) && (
          <p className={`mt-1 ${tamanhoTitulo} whitespace-pre-line break-words font-medium leading-tight [overflow-wrap:anywhere]`}>
            {apresentacao.destaque && <span className="text-[#E63946]">{apresentacao.destaque}</span>}
            {apresentacao.destaque && apresentacao.complemento && " "}
            {apresentacao.complemento && <span className="text-[#F9FAFB]">{apresentacao.complemento}</span>}
          </p>
        )}
        {apresentacao.descricao && (
          <p className="mx-auto mt-4 max-w-md whitespace-pre-line break-words text-sm leading-relaxed text-[#9CA3AF] [overflow-wrap:anywhere]">
            {apresentacao.descricao}
          </p>
        )}
      </div>
    </section>
  );
}
