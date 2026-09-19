"use client";

// Grade 3x3 simples pra escolher o ponto de enquadramento (equivalente ao
// object-position do CSS) — junto com uma prévia mostrando como fica o corte
// numa faixa larga (formato parecido com o banner do site).

const PONTOS: { label: string; valor: string }[] = [
  { label: "Topo esquerda", valor: "0% 0%" },
  { label: "Topo centro", valor: "50% 0%" },
  { label: "Topo direita", valor: "100% 0%" },
  { label: "Centro esquerda", valor: "0% 50%" },
  { label: "Centro", valor: "50% 50%" },
  { label: "Centro direita", valor: "100% 50%" },
  { label: "Base esquerda", valor: "0% 100%" },
  { label: "Base centro", valor: "50% 100%" },
  { label: "Base direita", valor: "100% 100%" },
];

export function FocoImagem({
  imagemUrl,
  valor,
  onChange,
}: {
  imagemUrl: string;
  valor: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <div className="grid w-24 shrink-0 grid-cols-3 gap-1">
        {PONTOS.map((p) => (
          <button
            key={p.valor}
            type="button"
            title={p.label}
            onClick={() => onChange(p.valor)}
            className={`h-7 rounded-md border text-[9px] ${
              valor === p.valor
                ? "border-accent bg-accent/20 text-accent"
                : "border-border bg-card/40 text-muted hover:border-accent/30"
            }`}
          >
            •
          </button>
        ))}
      </div>
      <div className="h-16 flex-1 overflow-hidden rounded-lg border border-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imagemUrl} alt="Prévia do enquadramento" className="h-full w-full object-cover" style={{ objectPosition: valor }} />
      </div>
    </div>
  );
}
