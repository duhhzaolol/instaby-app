"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  CheckCircle2,
  MessageSquare,
  Play,
  Send,
  ExternalLink,
} from "lucide-react";
import {
  dataHoraPublicacao,
  formatarTempoVideo,
  idArquivoDrive,
  segundosDoTempo,
  videoParaRevisao,
} from "@/lib/midiaRevisao";

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
  alteracoesSolicitadasEm: string | null;
  comentarios: ComentarioPublico[];
};

export function RevisaoInterativa({
  tarefaId,
  versoes,
  publicacaoSugeridaEm,
}: {
  tarefaId: string;
  versoes: VersaoPublica[];
  publicacaoSugeridaEm: string | null;
}) {
  return (
    <div className="flex flex-col gap-4">
      <VersaoAtual
        key={versoes[0].id}
        tarefaId={tarefaId}
        versao={versoes[0]}
        publicacaoSugeridaEm={publicacaoSugeridaEm}
      />
      {versoes.length > 1 && (
        <details className="rounded-2xl border border-border bg-card/30 p-4">
          <summary className="cursor-pointer text-xs text-muted">
            Versões anteriores
          </summary>
          <div className="mt-3 flex flex-col gap-2">
            {versoes.slice(1).map((v) => (
              <p key={v.id} className="text-xs text-muted">
                Versão {v.numero} — substituída
                {v.aprovadoEm ? " · aprovação preservada no histórico" : ""}
              </p>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function VersaoAtual({
  tarefaId,
  versao,
  publicacaoSugeridaEm,
}: {
  tarefaId: string;
  versao: VersaoPublica;
  publicacaoSugeridaEm: string | null;
}) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const comentarioRef = useRef<HTMLTextAreaElement>(null);
  const enviandoRef = useRef(false);
  const envioPendente = useRef<Promise<boolean> | null>(null);
  const [videoErro, setVideoErro] = useState(false);
  const [imagemErro, setImagemErro] = useState(false);
  const [momento, setMomento] = useState<number | null>(null);
  const [momentoTexto, setMomentoTexto] = useState("");
  const [ponto, setPonto] = useState<{ x: number; y: number } | null>(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [comentarios, setComentarios] = useState(versao.comentarios);
  const [decidindo, setDecidindo] = useState(false);
  const [aprovadoEm, setAprovadoEm] = useState(versao.aprovadoEm);
  const [alteracoesEm, setAlteracoesEm] = useState(
    versao.alteracoesSolicitadasEm,
  );
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const driveId = versao.linkVideo ? idArquivoDrive(versao.linkVideo) : null;

  function capturarPausa() {
    if (texto.trim() || enviandoRef.current) return; // conserva o instante do comentário já em edição
    const t = Math.floor(videoRef.current?.currentTime || 0);
    setMomento(t);
    setMomentoTexto(formatarTempoVideo(t));
  }
  function irAoMomento(seg: number) {
    if (!videoRef.current || videoErro) return;
    videoRef.current.currentTime = seg;
    videoRef.current.pause();
    if (!texto.trim()) {
      setMomento(seg);
      setMomentoTexto(formatarTempoVideo(seg));
    }
  }
  async function salvarComentario(): Promise<boolean> {
    if (envioPendente.current) return envioPendente.current;
    if (!texto.trim()) return true;
    const tempo = momentoTexto ? segundosDoTempo(momentoTexto) : momento;
    if (momentoTexto && tempo === null) {
      setErro(
        "Informe o momento no formato 1:15, ou deixe vazio para um comentário geral.",
      );
      return false;
    }
    const rascunho = texto.trim();
    enviandoRef.current = true;
    setEnviando(true);
    setErro("");
    setAviso("");
    const salvar = (async () => {
      try {
        const res = await fetch(
          `/api/tarefas/${tarefaId}/versoes/${versao.id}/comentarios`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              origem: "pagina_revisao",
              texto: rascunho,
              momentoVideoSegundos: tempo,
              pontoImagemX: ponto?.x ?? null,
              pontoImagemY: ponto?.y ?? null,
            }),
          },
        );
        const d = await res.json();
        if (!res.ok)
          throw new Error(
            d.erro || "Não consegui salvar o comentário. Tente novamente.",
          );
        setComentarios((c) => [
          ...c,
          { ...d, autorNome: d.autorNome || "Cliente (pelo link de revisão)" },
        ]);
        setTexto("");
        setPonto(null);
        // Se já pausou novamente durante o envio, o próximo comentário usa essa pausa.
        if (videoRef.current?.paused && !videoErro) {
          const t = Math.floor(videoRef.current.currentTime);
          setMomento(t);
          setMomentoTexto(formatarTempoVideo(t));
        } else {
          setMomento(null);
          setMomentoTexto("");
        }
        setAviso("Comentário salvo.");
        return true;
      } catch (e) {
        setErro(
          e instanceof Error ? e.message : "Não consegui salvar o comentário.",
        );
        return false;
      } finally {
        enviandoRef.current = false;
        setEnviando(false);
        envioPendente.current = null;
      }
    })();
    envioPendente.current = salvar;
    return salvar;
  }
  async function decidir(acao: "aprovar" | "pedir_alteracoes") {
    setDecidindo(true);
    setErro("");
    setAviso("");
    try {
      if (!(await salvarComentario())) return;
      const res = await fetch(`/api/tarefas/${tarefaId}/versoes/${versao.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origem: "pagina_revisao", acao }),
      });
      const d = await res.json();
      if (!res.ok)
        throw new Error(d.erro || "Não consegui registrar sua decisão.");
      setAprovadoEm(d.aprovadoEm);
      setAlteracoesEm(d.alteracoesSolicitadasEm);
      router.refresh();
    } catch (e) {
      setErro(
        e instanceof Error ? e.message : "Não consegui registrar sua decisão.",
      );
    } finally {
      setDecidindo(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card/50 p-4 sm:p-5">
      <p className="mb-3 text-xs uppercase tracking-wide text-muted">
        Versão {versao.numero}
      </p>
      {versao.linkVideo && (
        <div className="mb-4">
          {!videoErro ? (
            <video
              aria-label="Vídeo para revisão"
              ref={videoRef}
              src={videoParaRevisao(versao.linkVideo)}
              controls
              playsInline
              preload="metadata"
              onPause={capturarPausa}
              onPlay={() => {
                if (texto.trim() && !aprovadoEm) void salvarComentario();
              }}
              onError={() => setVideoErro(true)}
              className="max-h-[65vh] w-full rounded-xl bg-black object-contain"
            />
          ) : (
            <div className="rounded-xl border border-border bg-base p-3">
              {driveId && (
                <iframe
                  title="Vídeo no Drive"
                  src={`https://drive.google.com/file/d/${driveId}/preview`}
                  allow="autoplay; fullscreen"
                  allowFullScreen
                  className="mb-2 h-[55vh] w-full rounded-lg bg-black"
                />
              )}
              <p className="text-xs text-muted">
                O vídeo não carregou no reprodutor da página. Você pode abrir o
                arquivo e informar o tempo do comentário abaixo.
              </p>
              <a
                href={versao.linkVideo}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs text-accent"
              >
                <ExternalLink size={13} /> Abrir vídeo no Drive
              </a>
            </div>
          )}
        </div>
      )}
      {versao.linkImagem && !imagemErro && (
        <div className="relative mb-4">
          <img
            src={versao.linkImagem}
            alt="Imagem para revisão"
            onError={() => setImagemErro(true)}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setPonto({
                x: ((e.clientX - rect.left) / rect.width) * 100,
                y: ((e.clientY - rect.top) / rect.height) * 100,
              });
              setMomento(null);
              setMomentoTexto("");
              comentarioRef.current?.focus();
            }}
            className="max-h-[65vh] w-full cursor-crosshair rounded-xl object-contain"
          />
          {ponto && (
            <span
              className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent bg-accent/40"
              style={{ left: `${ponto.x}%`, top: `${ponto.y}%` }}
            />
          )}
        </div>
      )}
      {imagemErro && versao.linkImagem && (
        <a
          href={versao.linkImagem}
          target="_blank"
          rel="noreferrer"
          className="mb-4 inline-block text-sm text-accent"
        >
          Abrir imagem para revisão
        </a>
      )}

      {!aprovadoEm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void salvarComentario();
          }}
          className="mb-4 rounded-xl border border-border bg-base p-4"
        >
          <p className="mb-1 flex items-center gap-2 text-sm font-medium text-text">
            <MessageSquare size={15} /> Comente o que deseja ajustar
          </p>
          {versao.linkVideo && (
            <p className="mb-3 text-xs text-muted">
              Pause o vídeo: o tempo aparece aqui. Escreva e salve o comentário,
              ou continue o vídeo para salvá-lo automaticamente.
            </p>
          )}
          {versao.linkVideo && (
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <label className="text-xs text-muted" htmlFor="momento-revisao">
                Momento do vídeo
              </label>
              <input
                id="momento-revisao"
                value={momentoTexto}
                onChange={(e) => {
                  setMomentoTexto(e.target.value);
                  setMomento(segundosDoTempo(e.target.value));
                  setPonto(null);
                }}
                placeholder="Ex.: 1:15"
                disabled={enviando || decidindo}
                className="h-9 w-24 rounded-lg border border-border bg-card/60 px-2 text-sm text-text"
              />
              <button
                type="button"
                onClick={() => {
                  setMomento(null);
                  setMomentoTexto("");
                  setPonto(null);
                }}
                disabled={enviando || decidindo}
                className="text-xs text-muted underline"
              >
                Comentário geral
              </button>
            </div>
          )}
          {ponto && (
            <p className="mb-2 text-xs text-accent">
              Comentário no ponto selecionado da imagem.
            </p>
          )}
          <textarea
            aria-label="Comentário da revisão"
            ref={comentarioRef}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Ex.: Trocar este take ou ajustar a transição..."
            disabled={enviando || decidindo}
            className="mb-2 w-full rounded-lg border border-border bg-card/60 px-3 py-2 text-sm text-text placeholder:text-muted"
          />
          <button
            type="submit"
            disabled={enviando || decidindo || !texto.trim()}
            className="flex min-h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white disabled:opacity-40"
          >
            <Send size={14} />
            {enviando ? "Salvando comentário..." : "Salvar comentário"}
          </button>
        </form>
      )}
      {erro && (
        <p
          role="alert"
          className="mb-3 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-400"
        >
          {erro}
        </p>
      )}
      {aviso && (
        <p role="status" className="mb-3 text-xs text-emerald-400">
          {aviso}
        </p>
      )}

      {versao.legenda && (
        <div className="mb-4 rounded-xl border border-border bg-base p-4">
          <p className="mb-1 text-xs text-muted">Legenda proposta</p>
          <p className="whitespace-pre-wrap text-sm text-text">
            {versao.legenda}
          </p>
        </div>
      )}
      {publicacaoSugeridaEm && (
        <div className="mb-4 rounded-xl border border-accent/30 bg-accent/5 p-4">
          <p className="mb-1 flex items-center gap-2 text-xs font-medium text-accent">
            <CalendarClock size={15} /> Publicação sugerida
          </p>
          <p className="text-sm font-medium text-text">
            {dataHoraPublicacao(publicacaoSugeridaEm)}
          </p>
          <p className="mt-1 text-xs text-muted">
            Horário de Brasília · proposta para publicação após a aprovação.
          </p>
        </div>
      )}

      <div className="mb-4 border-t border-border pt-4">
        <p className="mb-3 text-sm font-medium text-text">
          Comentários desta versão ({comentarios.length})
        </p>
        <div className="flex flex-col gap-2">
          {!comentarios.length && (
            <p className="text-xs text-muted">
              Os comentários que você salvar aparecem aqui.
            </p>
          )}
          {comentarios.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-border bg-base p-3"
            >
              <div className="mb-1 flex flex-wrap items-center justify-between gap-1 text-xs text-muted">
                <span>{c.autorNome}</span>
                {c.momentoVideoSegundos !== null && (
                  <button
                    type="button"
                    onClick={() => irAoMomento(c.momentoVideoSegundos!)}
                    className="flex items-center gap-1 rounded-md bg-accent/10 px-2 py-1 text-accent"
                    aria-label={`Ir para ${formatarTempoVideo(c.momentoVideoSegundos)} do vídeo`}
                  >
                    <Play size={11} />
                    {formatarTempoVideo(c.momentoVideoSegundos)}
                  </button>
                )}
                {c.pontoImagemX !== null && <span>Ponto da imagem</span>}
              </div>
              <p className="whitespace-pre-wrap break-words text-sm text-text">
                {c.texto}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-4">
        {aprovadoEm ? (
          <p
            role="status"
            className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-400"
          >
            <CheckCircle2 size={18} /> Versão aprovada. A equipe já pode seguir
            com o agendamento.
          </p>
        ) : alteracoesEm ? (
          <p
            role="status"
            className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-400"
          >
            Alterações solicitadas. A equipe recebeu seus comentários e enviará
            uma nova versão para revisão.
          </p>
        ) : (
          <>
            <p className="mb-3 text-sm font-medium text-text">
              Terminou de revisar?
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                onClick={() => void decidir("pedir_alteracoes")}
                disabled={enviando || decidindo}
                className="min-h-12 rounded-xl border border-accent/40 px-4 text-sm font-medium text-accent disabled:opacity-40"
              >
                {decidindo ? "Registrando..." : "Pedir alterações"}
              </button>
              <button
                onClick={() => void decidir("aprovar")}
                disabled={enviando || decidindo}
                className="min-h-12 rounded-xl bg-accent px-4 text-sm font-medium text-white disabled:opacity-40"
              >
                {decidindo ? "Registrando..." : "Aprovar esta versão"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
