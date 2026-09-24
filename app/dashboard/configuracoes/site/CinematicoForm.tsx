"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Input, Textarea, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Indicador = { valor: string; legenda: string };
type Pilar = { nome: string; texto: string; indicadores?: Indicador[] };

// Mesmo texto padrão usado no site público (components/landing/LandingPage.tsx)
// quando o campo correspondente ainda não foi preenchido aqui.
const PILARES_PADRAO: Pilar[] = [
  {
    nome: "Tráfego Pago",
    texto:
      "Campanhas no Meta Ads e Google Ads com estratégia, teste e otimização constante — o motor que traz cliente novo pro seu negócio todos os dias.",
  },
  {
    nome: "Criação de Conteúdo",
    texto: "Planejamento e produção de conteúdo com identidade — o que sua marca fala, mostra e posta no dia a dia.",
  },
  {
    nome: "Captação",
    texto: "Fotos e vídeos com direção e equipamento profissional — em estúdio ou externa, prontos pra virar conteúdo e campanha.",
  },
];

const INDICADORES_VAZIOS: Indicador[] = [
  { valor: "", legenda: "" },
  { valor: "", legenda: "" },
  { valor: "", legenda: "" },
];

const NOMES_PILARES = ["Pilar 1 — Carro-chefe (bloco grande)", "Pilar 2", "Pilar 3"];

type ConfigCinematico = {
  siteAberturaTitulo: string | null;
  siteAberturaSubtitulo: string | null;
  sitePilares: Pilar[] | null;
  siteAlbunsTitulo: string | null;
  siteAlbunsTexto: string | null;
};

export default function CinematicoForm({ config }: { config: ConfigCinematico }) {
  const router = useRouter();
  const [aberturaTitulo, setAberturaTitulo] = useState(config.siteAberturaTitulo || "");
  const [aberturaSubtitulo, setAberturaSubtitulo] = useState(config.siteAberturaSubtitulo || "");
  const indicadoresSalvos = config.sitePilares?.[0]?.indicadores;
  const indicadoresIniciais = indicadoresSalvos && indicadoresSalvos.length === 3 ? indicadoresSalvos : INDICADORES_VAZIOS;
  const [pilares, setPilares] = useState<Pilar[]>(
    PILARES_PADRAO.map((padrao, i) => ({
      nome: config.sitePilares?.[i]?.nome || padrao.nome,
      texto: config.sitePilares?.[i]?.texto || padrao.texto,
      indicadores: i === 0 ? indicadoresIniciais : undefined,
    }))
  );
  const [albunsTitulo, setAlbunsTitulo] = useState(config.siteAlbunsTitulo || "");
  const [albunsTexto, setAlbunsTexto] = useState(config.siteAlbunsTexto || "");
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  function atualizarPilar(i: number, campo: "nome" | "texto", valor: string) {
    setPilares((prev) => prev.map((p, idx) => (idx === i ? { ...p, [campo]: valor } : p)));
  }

  function atualizarIndicadorTrafego(i: number, campo: keyof Indicador, valor: string) {
    setPilares((prev) =>
      prev.map((p, idx) =>
        idx === 0 ? { ...p, indicadores: (p.indicadores || INDICADORES_VAZIOS).map((ind, ii) => (ii === i ? { ...ind, [campo]: valor } : ind)) } : p
      )
    );
  }

  async function salvar() {
    setSalvando(true);
    setSalvo(false);
    const indicadoresTrafego = (pilares[0].indicadores || []).filter((i) => i.valor.trim() && i.legenda.trim());
    const pilaresParaSalvar = pilares.map((p, i) => ({
      nome: p.nome,
      texto: p.texto,
      ...(i === 0 ? { indicadores: indicadoresTrafego } : {}),
    }));
    await fetch("/api/configuracao", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteAberturaTitulo: aberturaTitulo || null,
        siteAberturaSubtitulo: aberturaSubtitulo || null,
        sitePilares: pilaresParaSalvar,
        siteAlbunsTitulo: albunsTitulo || null,
        siteAlbunsTexto: albunsTexto || null,
      }),
    });
    setSalvando(false);
    setSalvo(true);
    router.refresh();
    setTimeout(() => setSalvo(false), 2500);
  }

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card/60 p-5">
      <div>
        <p className="mb-1 text-sm font-medium text-text">Abertura cinematográfica (a câmera, antes do Hero)</p>
        <p className="mb-3 text-[11px] leading-relaxed text-muted">
          O título e o subtítulo que aparecem por cima da animação da câmera, na primeira tela do site — antes da
          pessoa começar a rolar a página. O visual da câmera em si (ilustração, cores, movimento) é fixo, só esse
          texto é editável por aqui.
        </p>
        <Label>Título de impacto</Label>
        <Textarea
          value={aberturaTitulo}
          onChange={(e) => setAberturaTitulo(e.target.value)}
          rows={2}
          placeholder="Enquadramos a sua marca."
          className="mb-3"
        />
        <Label>Subtítulo (linha de apoio, menor)</Label>
        <Textarea
          value={aberturaSubtitulo}
          onChange={(e) => setAberturaSubtitulo(e.target.value)}
          rows={2}
          placeholder="Criação de conteúdo, captação e tráfego pago — sob o mesmo foco."
        />
      </div>

      <div className="border-t border-border pt-5">
        <p className="mb-1 text-sm font-medium text-text">Pilares em destaque (logo depois do Hero)</p>
        <p className="mb-4 text-[11px] leading-relaxed text-muted">
          Os 3 blocos que aparecem em destaque assim que o site abre. O primeiro sempre aparece maior (é o
          carro-chefe) — só ele tem espaço pra números/resultados. Os outros dois vêm ao lado, menores.
        </p>
        <div className="flex flex-col gap-3">
          {pilares.map((p, i) => (
            <div key={i} className="rounded-xl border border-border/60 bg-base/40 p-3">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-muted">{NOMES_PILARES[i]}</p>
              <Label>Nome</Label>
              <Input value={p.nome} onChange={(e) => atualizarPilar(i, "nome", e.target.value)} className="mb-2" />
              <Label>Texto</Label>
              <Textarea value={p.texto} onChange={(e) => atualizarPilar(i, "texto", e.target.value)} rows={3} />

              {i === 0 && (
                <div className="mt-3 border-t border-border/40 pt-3">
                  <p className="mb-2 text-xs font-medium text-text">Números/resultados (opcional, até 3)</p>
                  <p className="mb-2 text-[11px] text-muted">
                    Só aparecem quando os dois campos de um indicador estiverem preenchidos. Ex.: "+120" / "campanhas
                    ativas".
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {(p.indicadores || INDICADORES_VAZIOS).map((ind, ii) => (
                      <div key={ii} className="rounded-lg border border-border/60 bg-card/40 p-2">
                        <Input
                          value={ind.valor}
                          onChange={(e) => atualizarIndicadorTrafego(ii, "valor", e.target.value)}
                          placeholder="+120"
                          className="mb-1"
                        />
                        <Input
                          value={ind.legenda}
                          onChange={(e) => atualizarIndicadorTrafego(ii, "legenda", e.target.value)}
                          placeholder="campanhas ativas"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-5">
        <p className="mb-1 text-sm font-medium text-text">Álbuns (título e texto da seção)</p>
        <p className="mb-3 text-[11px] leading-relaxed text-muted">
          Cabeçalho da seção de álbuns — o carrossel usa os mesmos trabalhos que você já cadastra logo abaixo, em
          "Portfólio".
        </p>
        <Label>Título</Label>
        <Input value={albunsTitulo} onChange={(e) => setAlbunsTitulo(e.target.value)} placeholder="Trabalhos que falam por nós." className="mb-3" />
        <Label>Texto de apoio</Label>
        <Textarea
          value={albunsTexto}
          onChange={(e) => setAlbunsTexto(e.target.value)}
          rows={2}
          placeholder="Cada projeto é uma parceria. Mais que posts, entregamos posicionamento, conteúdo e resultado."
        />
      </div>

      <Button onClick={salvar} disabled={salvando} className="w-full">
        {salvo ? <Check size={14} /> : null} {salvando ? "Salvando..." : salvo ? "Salvo!" : "Salvar abertura, pilares e álbuns"}
      </Button>
    </div>
  );
}
