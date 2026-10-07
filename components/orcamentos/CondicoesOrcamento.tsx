import type { CondicoesOrcamento as Condicoes } from "@/lib/apresentacaoOrcamento";

export default function CondicoesOrcamento({
  condicoes,
  variant = "normal",
  className = "",
}: {
  condicoes?: Condicoes;
  variant?: "normal" | "dark";
  className?: string;
}) {
  const campos = [
    { titulo: "Pagamento", texto: condicoes?.pagamento },
    { titulo: "Prazo de entrega", texto: condicoes?.prazoEntrega },
    { titulo: "Observações", texto: condicoes?.observacoes },
  ].filter((campo) => campo.texto?.trim());

  if (campos.length === 0) return null;

  const escuro = variant === "dark";

  return (
    <section className={`min-w-0 border-t pt-5 ${escuro ? "border-white/[0.06]" : "border-border"} ${className}`}>
      <h2 className={`mb-4 text-sm font-medium ${escuro ? "text-[#F9FAFB]" : "text-text"}`}>
        Condições da proposta
      </h2>
      <dl className="space-y-4">
        {campos.map(({ titulo, texto }) => (
          <div key={titulo} className="min-w-0">
            <dt className={`mb-1 text-xs font-medium ${escuro ? "text-[#F9FAFB]" : "text-text"}`}>{titulo}</dt>
            <dd className={`whitespace-pre-wrap break-words text-sm leading-relaxed [overflow-wrap:anywhere] ${escuro ? "text-[#c2c0b6]" : "text-muted"}`}>
              {texto}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
