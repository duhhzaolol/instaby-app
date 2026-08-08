"use client";

const CORES = [
  "#3B82F6", // azul
  "#A855F7", // roxo
  "#22C55E", // verde
  "#F59E0B", // âmbar
  "#EC4899", // rosa
  "#06B6D4", // ciano
  "#EAB308", // amarelo
  "#E63946", // vermelho (marca)
  "#9CA3AF", // cinza
  "#F9FAFB", // branco
];

export function SeletorCor({ value, onChange }: { value: string; onChange: (cor: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {CORES.map((cor) => (
        <button
          key={cor}
          type="button"
          onClick={() => onChange(cor)}
          className={`h-7 w-7 rounded-full transition-transform ${
            value === cor ? "scale-110 ring-2 ring-white/60 ring-offset-2 ring-offset-card" : ""
          }`}
          style={{ backgroundColor: cor }}
          title={cor}
        />
      ))}
    </div>
  );
}
