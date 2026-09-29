"use client";

// Ícone "estilizado" preto+vermelho, brilhante — aproximação em CSS/SVG do
// estilo que ele mandou como referência (4 imagens: claquete, duas pessoas,
// alvo, cronômetro — todas escuras, com contorno vermelho brilhando, com cara
// de render 3D). Não existe gerador de imagem disponível nesta sessão pra
// replicar o render de verdade — isso aqui é a aproximação possível com
// código: um "palco" escuro FIXO por trás do ícone (não muda com o tema
// claro/escuro do app, de propósito — é o que garante que o brilho vermelho
// sempre apareça bem, do jeito que aparece nas imagens dele, que são sobre
// fundo preto) + glow vermelho ao redor do próprio ícone (drop-shadow,
// acompanha o contorno exato do desenho) + um reflexo "de vidro" no terço de
// cima do palco, pra dar sensação de profundidade/objeto físico.
//
// Aceita tanto ícone do lucide-react quanto de outras libs (ex: react-icons/si,
// usado pros logos de marca que o lucide não tem, como o do Google) — mesmo
// tipo frouxo (`React.ElementType`) que o resto do app já usa pra isso (ver
// IconeFlutuanteMini em FloatingGear.tsx), pra aceitar qualquer uma das duas
// libs sem embate de tipos entre os formatos de prop de cada uma.
export function IconeEstilizado({
  icon: Icon,
  tamanho = 30,
  tamanhoIcone,
  arredondamento = "28%",
  className = "",
}: {
  icon: React.ElementType;
  /** px (número) ou string CSS (ex: "100%", pra preencher um contêiner responsivo já dimensionado por fora) */
  tamanho?: number | string;
  tamanhoIcone?: number;
  arredondamento?: string;
  className?: string;
}) {
  const tIcone = tamanhoIcone ?? (typeof tamanho === "number" ? Math.round(tamanho * 0.5) : 24);
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden ${className}`}
      style={{
        width: tamanho,
        height: tamanho,
        borderRadius: arredondamento,
        background: "linear-gradient(155deg, #333338 0%, #18181b 45%, #030303 100%)",
        boxShadow:
          "inset 0 1px 1px rgba(255,255,255,0.14), inset 0 -6px 10px rgba(0,0,0,0.55), 0 0 0 1px rgba(230,57,70,0.4), 0 0 14px rgba(230,57,70,0.45), 0 4px 10px rgba(0,0,0,0.5)",
      }}
    >
      {/* reflexo de vidro no topo */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-[8%] top-[6%] h-[40%] rounded-full"
        style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0) 100%)" }}
      />
      <Icon
        size={tIcone}
        className="relative text-white"
        style={{ filter: "drop-shadow(0 0 3px rgba(230,57,70,0.95)) drop-shadow(0 0 1px rgba(0,0,0,0.6))" }}
      />
    </span>
  );
}
