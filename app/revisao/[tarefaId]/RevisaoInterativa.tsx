"use client";

import { useRef, useState } from "react";
import { Video, Image as ImageIcon, Send, CheckCircle2, X } from "lucide-react";

type ComentarioPublico = {
  id: string;
  texto: string;
  createdAt: string;
  autorNome: string;
  momentoVideoSegundos: number | null;
  pontoImagemX: number | null;
  pontoImagemY: number | null;
};

type VersaoPublica = {
  id: string;
  numero: number;
  linkVideo: string | null;
  linkImagem: string | null;
  legenda: string | null;
  aprovadoEm: string | null;
  aprovadorNome: string | null;
  comentarios: ComentarioPublico[];
};

function formatarMomento(seg: number) {
  const min = Math.floor(seg / 60);
  const s = Math.floor(seg % 60)
    .toString()
    .padStart(2, "0");
  return `${min}:${s}`;
}

// Guarda o "seu nome" localmente nesse navegador (não existe conta de cliente
// nesse sistema) só pra não pedir de novo a cada comentário/aprovação na mesma
// visita — nunca é enviado a lugar nenhum além das próprias rotas de comentário
// e aprovação dessa tarefa.
function nomeSalvo(): string {
  try {
    return localStorage.getItem("instaby_revisao_nome") || "";
  } catch {
    return "";
  }
}
function salvarNome(nome: string) {
  try {
    localStorage.setItem("instaby_revisao_nome", nome);
  } catch {
    /* ignora — só é conveniência, funciona sem isso também */
  }
}

export function RevisaoInterativa({ tarefaId, versoes }: { tarefaId: string; versoes: VersaoPublica[] }) {
  const atual = versoes[0];
  const antigas = versoes.slice(1);

  return (
    <div className="flex flex-col gap-4">
      <VersaoAtual tarefaId={tarefaId} versao={atual} />
      {antigas.length > 0 && (
        <div className="rounded-2xl border border-border bg-card/30 p-4">
          <p className="mb-2 text-xs uppercase tracking-wide text-muted">Versões anteriores</p>
          <div className="flex flex-col gap-2">
            {antigas.map((v) => (
              <p key={v.id} className="text-xs text-muted">
                Versão {v.numero}
                {v.legenda ? ` — "${v.legenda.slice(0, 80)}${v.legenda.length > 80 ? "…" : ""}"` : ""} — substituída
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function VersaoAtual({ tarefaId, versao }: { tarefaId: string; versao: VersaoPublica }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const imagemRef = useRef<HTMLImageElement>(null);

  const [videoOk, setVideoOk] = useState(true);
  const [imagemOk, setImagemOk] = useState(true);

  const [momento, setMomento] = useState<number | null>(null);
  const [momentoTexto, setMomentoTexto] = useState("");
  const [ponto, setPonto] = useState<{ x: number; y: number } | null>(null);

  const [nome, setNome] = useState(nomeSalvo());
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [comentarios, setComentarios] = useState(versao.comentarios);

  const [nomeAprovacao, setNomeAprovacao] = useState(nomeSalvo());
  const [aprovando, setAprovando] = useState(false);
  const [aprovado, setAprovado] = useState(!!versao.aprovadoEm);
  const [aprovadorNome, setAprovadorNome] = useState(versao.aprovadorNome);
  const [aprovadoEm, setAprovadoEm] = useState(versao.aprovadoEm);

  function usarTempoAtual() {
    const t = videoRef.current?.currentTime;
    if (t === undefined) return;
    setMomento(t);
    setMomentoTexto(formatarMomento(t));
  }

  function aplicarMomentoManual(v: string) {
    setMomentoTexto(v);
    const partes = v.split(":");
    if (partes.length === 2) {
      const min = Number(partes[0]);
      const seg = Number(partes[1]);
      if (!isNaN(min) && !isNaN(seg)) {
        setMomento(min * 60 + seg);
        return;
      }
    }
    setMomento(null);
  }

  function clicarImagem(e: React.MouseEvent<HTMLImageElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;
    setPonto({ x, y });
  }

  async function enviarComentario(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim() || !nome.trim()) return;
    setEnviando(true);
    salvarNome(nome.trim());
    const res = await fetch(`/api/tarefas/${tarefaId}/versoes/${versao.id}/comentarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        texto: texto.trim(),
        autorNome: nome.trim(),
        momentoVideoSegundos: momento,
        pontoImagemX: ponto?.x ?? null,
        pontoImagemY: ponto?.y ?? null,
      }),
    });
    setEnviando(false);
    if (!res.ok) {
      const d = await res.json().catch(() => null);
      alert(d?.erro || "Não consegui enviar esse comentário.");
      return;
    }
    const criado = await res.json();
    setComentarios((c) => [
      ...c,
      {
        id: criado.id,
        texto: criado.texto,
        createdAt: criado.createdAt,
        autorNome: nome.trim(),
        momentoVideoSegundos: criado.momentoVideoSegundos,
        pontoImagemX: criado.pontoImagemX,
        pontoImagemY: criado.pontoImagemY,
      },
    ]);
    setTexto("");
    setMomento(null);
    setMomentoTexto("");
    setPonto(null);
  }

  async function aprovar() {
    if (!nomeAprovacao.trim()) {
      alert("Informe seu nome pra aprovar.");
      return;
    }
    setAprovando(true);
    salvarNome(nomeAprovacao.trim());
    const res = await fetch(`/api/tarefas/${tarefaId}/versoes/${versao.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aprovadoPorNomeLivre: nomeAprovacao.trim() }),
    });
    setAprovando(false);
    if (!res.ok) {
      const d = await res.json().catch(() => null);
      alert(d?.erro || "Não consegui registrar sua aprovação.");
      return;
    }
    const atualizada = await res.json();
    setAprovado(true);
    setAprovadorNome(nomeAprovacao.trim());
    setAprovadoEm(atualizada.aprovadoEm);
  }

  return (
    <div className="rounded-2xl border border-border bg-card/50 p-5">
      <p className="mb-3 text-xs uppercase tracking-wide text-muted">Versão {versao.numero}</p>

      {versao.linkVideo && videoOk && (
        <div className="mb-3">
          <video ref={videoRef} src={versao.linkVideo} controls onError={() => setVideoOk(false)} className="w-full rounded-xl bg-black" />
        </div>
      )}
      {versao.linkImagem && imagemOk && (
        <div className="mb-3 relative">
          <img
            ref={imagemRef}
            src={versao.linkImagem}
            onError={() => setImagemOk(false)}
            onClick={clicarImagem}
            className="w-full cursor-crosshair rounded-xl"
          />
          {ponto && (
            <span
              className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent bg-accent/40"
              style={{ left: `${ponto.x}%`, top: `${ponto.y}%` }}
            />
          )}
        </div>
      )}
      {((versao.linkVideo && !videoOk) || (versao.linkImagem && !imagemOk)) && (
        <div className="mb-3 flex flex-wrap gap-2">
          {versao.linkVideo && !videoOk && (
            <a href={versao.linkVideo} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text hover:bg-hover">
              <Video size={12} /> Abrir vídeo
            </a>
          )}
          {versao.linkImagem && !imagemOk && (
            <a href={versao.linkImagem} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text hover:bg-hover">
              <ImageIcon size={12} /> Abrir imagem
            </a>
          )}
        </div>
      )}
      {versao.legenda && (
        <div className="mb-4 rounded-xl border border-border bg-base px-4 py-3">
          <p className="mb-1 text-[11px] uppercase tracking-wide text-muted">Legenda proposta</p>
          <p className="whitespace-pre-wrap text-sm text-text">{versao.legenda}</p>
        </div>
      )}

      {/* Aprovação */}
      {aprovado ? (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400">
          <CheckCircle2 size={16} />
          Aprovado por {aprovadorNome}
          {aprovadoEm ? ` em ${new Date(aprovadoEm).toLocaleString("pt-BR")}` : ""}
        </div>
      ) : (
        <div className="mb-4 rounded-xl border border-accent/20 bg-accent/5 p-4">
          <p className="mb-2 text-sm font-medium text-text">Está tudo certo com essa versão?</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={nomeAprovacao}
              onChange={(e) => setNomeAprovacao(e.target.value)}
              placeholder="Seu nome"
              className="h-10 flex-1 rounded-lg border border-border bg-base px-3 text-sm text-text outline-none placeholder:text-muted focus:border-accent/50"
            />
            <button
              onClick={aprovar}
              disabled={aprovando}
              className="h-10 shrink-0 rounded-lg bg-accent px-4 text-sm font-medium text-white disabled:opacity-50"
            >
              {aprovando ? "Aprovando..." : "Aprovar esta versão"}
            </button>
          </div>
        </div>
      )}

      {/* Comentários compartilhados */}
      <div className="border-t border-border pt-4">
        <p className="mb-2 text-sm font-medium text-text">Comentários</p>
        <div className="mb-3 flex flex-col gap-2">
          {comentarios.length === 0 && <p className="text-xs text-muted">Nenhum comentário ainda.</p>}
          {comentarios.map((c) => (
            <div key={c.id} className="rounded-lg bg-base px-3 py-2">
              <p className="mb-0.5 flex items-center justify-between text-[11px] text-muted">
                <span className="font-medium text-text/80">
                  {c.autorNome}
                  {c.momentoVideoSegundos !== null ? ` · aos ${formatarMomento(c.momentoVideoSegundos)}` : ""}
                  {c.pontoImagemX !== null ? " · num ponto da imagem" : ""}
                </span>
                <span>{new Date(c.createdAt).toLocaleString("pt-BR")}</span>
              </p>
              <p className="whitespace-pre-wrap text-sm text-text">{c.texto}</p>
            </div>
          ))}
        </div>

        <form onSubmit={enviarComentario} className="flex flex-col gap-2">
          {(momento !== null || ponto) && (
            <p className="flex items-center gap-1.5 text-[11px] text-accent">
              {momento !== null ? `Comentário no momento ${formatarMomento(momento)} do vídeo` : "Comentário num ponto da imagem"}
              <button
                type="button"
                onClick={() => {
                  setMomento(null);
                  setMomentoTexto("");
                  setPonto(null);
                }}
                className="text-muted hover:text-text"
              >
                <X size={11} />
              </button>
            </p>
          )}
          {versao.linkVideo && videoOk && (
            <div className="flex items-center gap-1.5">
              <input
                value={momentoTexto}
                onChange={(e) => aplicarMomentoManual(e.target.value)}
                placeholder="mm:ss (opcional)"
                className="h-9 w-28 rounded-lg border border-border bg-base px-2 text-xs text-text outline-none focus:border-accent/50"
              />
              <button
                type="button"
                onClick={usarTempoAtual}
                className="h-9 rounded-lg border border-border px-2.5 text-xs text-muted hover:text-text"
              >
                Usar momento atual do vídeo
              </button>
            </div>
          )}
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Seu nome"
            className="h-10 w-full rounded-lg border border-border bg-base px-3 text-sm text-text outline-none placeholder:text-muted focus:border-accent/50"
          />
          <div className="flex gap-1.5">
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Escreva seu comentário..."
              className="h-10 w-full flex-1 rounded-lg border border-border bg-base px-3 text-sm text-text outline-none placeholder:text-muted focus:border-accent/50"
            />
            <button
              type="submit"
              disabled={enviando || !texto.trim() || !nome.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-white disabled:opacity-40"
            >
              <Send size={14} />
            </button>
          </div>
          {versao.linkImagem && imagemOk && (
            <p className="text-[11px] text-muted">Dica: clique num ponto da imagem acima pra comentar exatamente ali.</p>
          )}
        </form>
      </div>
    </div>
  );
}
