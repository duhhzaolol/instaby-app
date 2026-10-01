"use client";

import { useEffect, useState } from "react";
import { Video, Image as ImageIcon, Send, CheckCircle2, Copy, Check, CalendarClock, ExternalLink } from "lucide-react";
import { STATUS_CONTEUDO_VALIDOS, STATUS_CONTEUDO_LABELS } from "@/lib/revisaoConteudo";
import { dataHoraPublicacao, formatarTempoVideo } from "@/lib/midiaRevisao";
import { camposPrazo } from "@/lib/agenda";
import { DatePicker } from "@/components/ui/DatePicker";

export type ComentarioRevisaoData = {
  id: string;
  texto: string;
  interno: boolean;
  momentoVideoSegundos: number | null;
  pontoImagemX: number | null;
  pontoImagemY: number | null;
  createdAt: string;
  usuario: { nome: string; fotoUrl?: string | null } | null;
  contato: { nome: string } | null;
  autorNomeLivre?: string | null;
};

export type VersaoConteudoData = {
  id: string;
  numero: number;
  linkVideo: string | null;
  linkImagem: string | null;
  legenda: string | null;
  aprovadoPorContato: { id: string; nome: string } | null;
  aprovadoPorNomeLivre: string | null;
  aprovadoEm: string | null;
  alteracoesSolicitadasEm?: string | null;
  createdAt: string;
  criadoPor: { nome: string; fotoUrl?: string | null } | null;
  comentarios: ComentarioRevisaoData[];
};

type TarefaRevisao = {
  id: string;
  statusConteudo: string | null;
  linkPublicacao: string | null;
  publicadoEm: string | null;
  publicacaoSugeridaEm: string | null;
  versoes: VersaoConteudoData[];
};

function nomeAutor(c: ComentarioRevisaoData): string {
  return c.usuario?.nome || c.contato?.nome || c.autorNomeLivre || "Alguém";
}

function nomeAprovador(v: VersaoConteudoData): string | null {
  return v.aprovadoPorContato?.nome || v.aprovadoPorNomeLivre || null;
}

// Painel interno de revisão/aprovação de conteúdo (Etapa 2 v153) — vive dentro do
// painel de detalhes da tarefa, só pra categoria reel/arte (ver
// CATEGORIAS_COM_REVISAO, checado por quem monta esse componente). Sem estado de
// dados próprio: tudo vem de `tarefa` (passado pelo painel-pai) e qualquer
// mutação chama `recarregar` pra buscar tudo de novo — mesmo padrão já usado nos
// Comentários internos ali do lado, nunca guarda uma cópia paralela que possa
// ficar dessincronizada. Só a versão MAIS RECENTE aceita comentário/aprovação
// novos — versões antigas ficam como histórico somente-leitura (foram
// substituídas, comentar/aprovar nelas não faria sentido).
export function PainelRevisaoConteudo({
  tarefa,
  patch,
  recarregar,
}: {
  tarefa: TarefaRevisao;
  patch: (dados: Record<string, unknown>) => Promise<any>;
  recarregar: () => Promise<void>;
}) {
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [erroLink, setErroLink] = useState("");

  const [novoLinkVideo, setNovoLinkVideo] = useState("");
  const [novoLinkImagem, setNovoLinkImagem] = useState("");
  const [novaLegenda, setNovaLegenda] = useState("");
  const [enviandoVersao, setEnviandoVersao] = useState(false);
  const [formVersaoAberto, setFormVersaoAberto] = useState(tarefa.versoes.length === 0);

  const [novoComentario, setNovoComentario] = useState("");
  const [comentarioInterno, setComentarioInterno] = useState(true);
  const [enviandoComentario, setEnviandoComentario] = useState(false);

  const [nomeAprovacao, setNomeAprovacao] = useState("");
  const [aprovando, setAprovando] = useState(false);

  const [linkPublicacao, setLinkPublicacao] = useState(tarefa.linkPublicacao || "");
  const [dataPublicacao, setDataPublicacao] = useState(() => camposPrazo(tarefa.publicadoEm).data);
  const [horaPublicacao, setHoraPublicacao] = useState(() => camposPrazo(tarefa.publicadoEm).hora);
  const [salvandoPublicacao, setSalvandoPublicacao] = useState(false);

  useEffect(() => {
    const publicada = camposPrazo(tarefa.publicadoEm);
    setDataPublicacao(publicada.data);
    setHoraPublicacao(publicada.hora);
  }, [tarefa.publicadoEm]);

  const ultimaVersao = tarefa.versoes[0] || null; // já vem ordenado numero desc (ver GET /api/tarefas/[id])

  function copiarLink() {
    const url = `${window.location.origin}/revisao/${tarefa.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopiado(true);
      setTimeout(() => setLinkCopiado(false), 2000);
      setErroLink("");
    }).catch(() => setErroLink("Não consegui copiar automaticamente. Abra a página da revisão e copie o endereço."));
  }

  async function mudarStatusConteudo(novo: string) {
    if (novo === tarefa.statusConteudo) return;
    await patch({ statusConteudo: novo });
    await recarregar();
  }

  async function enviarVersao(e: React.FormEvent) {
    e.preventDefault();
    if (!novoLinkVideo.trim() && !novoLinkImagem.trim() && !novaLegenda.trim()) {
      alert("Envie ao menos um link de vídeo/imagem ou a legenda.");
      return;
    }
    setEnviandoVersao(true);
    const res = await fetch(`/api/tarefas/${tarefa.id}/versoes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        linkVideo: novoLinkVideo.trim() || null,
        linkImagem: novoLinkImagem.trim() || null,
        legenda: novaLegenda.trim() || null,
      }),
    });
    setEnviandoVersao(false);
    if (!res.ok) {
      const d = await res.json().catch(() => null);
      alert(d?.erro || "Não consegui enviar essa versão.");
      return;
    }
    setNovoLinkVideo("");
    setNovoLinkImagem("");
    setNovaLegenda("");
    setFormVersaoAberto(false);
    await recarregar();
  }

  async function enviarComentario(e: React.FormEvent) {
    e.preventDefault();
    if (!novoComentario.trim() || !ultimaVersao) return;
    setEnviandoComentario(true);
    const res = await fetch(`/api/tarefas/${tarefa.id}/versoes/${ultimaVersao.id}/comentarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto: novoComentario.trim(), interno: comentarioInterno }),
    });
    setEnviandoComentario(false);
    if (!res.ok) {
      const d = await res.json().catch(() => null);
      alert(d?.erro || "Não consegui enviar esse comentário.");
      return;
    }
    setNovoComentario("");
    await recarregar();
  }

  async function registrarAprovacao() {
    if (!ultimaVersao) return;
    if (!nomeAprovacao.trim()) {
      alert("Informe quem aprovou.");
      return;
    }
    setAprovando(true);
    const res = await fetch(`/api/tarefas/${tarefa.id}/versoes/${ultimaVersao.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aprovadoPorNomeLivre: nomeAprovacao.trim() }),
    });
    setAprovando(false);
    if (!res.ok) {
      const d = await res.json().catch(() => null);
      alert(d?.erro || "Não consegui registrar essa aprovação.");
      return;
    }
    setNomeAprovacao("");
    await recarregar();
  }

  async function salvarPublicacao() {
    setSalvandoPublicacao(true);
    try {
      const atual = camposPrazo(tarefa.publicadoEm);
      const dataFoiAlterada = dataPublicacao !== atual.data || horaPublicacao !== atual.hora;
      const atualizada = await patch({
        linkPublicacao: linkPublicacao.trim() || null,
        ...(tarefa.statusConteudo === "publicado" && {
          publicadoEm: dataPublicacao
            ? dataFoiAlterada ? `${dataPublicacao}T${horaPublicacao || "00:00"}:00-03:00` : tarefa.publicadoEm
            : null,
        }),
      });
      if (atualizada) await recarregar();
    } finally {
      setSalvandoPublicacao(false);
    }
  }

  return (
    <div className="mb-4 border-t border-border pt-3">
      <p className="mb-2 text-xs font-medium text-text">Revisão de conteúdo</p>

      {/* Etapas do fluxo — clicar tenta mover direto pra ali; o servidor recusa
          (com um alert explicando) se faltar alguma coisa, ex.: pedir "Agendado"
          sem a versão atual estar aprovada. */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {STATUS_CONTEUDO_VALIDOS.map((s) => (
          <button
            key={s}
            onClick={() => mudarStatusConteudo(s)}
            className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
              tarefa.statusConteudo === s
                ? s === "publicado"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-accent/30 bg-accent/10 text-accent"
                : "border-border text-muted hover:text-text"
            }`}
          >
            {STATUS_CONTEUDO_LABELS[s]}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={copiarLink}
        className="mb-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-medium text-white hover:opacity-90"
      >
        {linkCopiado ? <Check size={12} /> : <Copy size={12} />}
        {linkCopiado ? "Link copiado" : "Copiar link de revisão pro cliente"}
      </button>
      <a href={`/revisao/${tarefa.id}`} target="_blank" rel="noreferrer" className="mb-3 inline-flex items-center gap-1 text-xs text-muted hover:text-text"><ExternalLink size={12} /> Abrir página de revisão</a>
      {erroLink && <p role="alert" className="mb-3 text-xs text-red-400">{erroLink}</p>}
      <div className="mb-3 rounded-xl border border-border bg-card/60 p-3">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-text"><CalendarClock size={14} /> Dia planejado de postagem</p>
        <p className="mb-2 text-sm text-text">{dataHoraPublicacao(tarefa.publicacaoSugeridaEm) || "Ainda não definido"}</p>
        <p className="text-[11px] text-muted">Edite nos detalhes acima e clique em Salvar alterações. Depois de salvo, aparece para o cliente na revisão. O horário é opcional e usa Brasília.</p>
      </div>

      {/* Publicação — link e data, registrados mesmo quando feita manualmente fora do sistema */}
      {(tarefa.statusConteudo === "agendado" || tarefa.statusConteudo === "publicado") && (
        <div className="mb-3 rounded-lg border border-border bg-card/60 p-3">
          <p className="mb-1 block text-xs text-muted">Link da publicação</p>
          <div className="flex gap-1.5">
            <input
              value={linkPublicacao}
              onChange={(e) => setLinkPublicacao(e.target.value)}
              placeholder="Link do post/reel publicado"
              className="h-9 w-full flex-1 rounded-lg border border-border bg-base px-3 text-xs text-text outline-none focus:border-accent/50"
            />
            <button
              onClick={salvarPublicacao}
              disabled={salvandoPublicacao}
              className="h-9 shrink-0 rounded-lg border border-border px-3 text-xs text-text hover:bg-hover disabled:opacity-50"
            >
              Salvar
            </button>
          </div>
          {tarefa.statusConteudo === "publicado" && <>
            <p className="mb-1 mt-3 block text-xs text-muted">Data real de publicação</p>
            <div className="mb-2 grid grid-cols-2 gap-2">
              <DatePicker value={dataPublicacao} onChange={setDataPublicacao} placeholder="Data real de publicação" limpavel />
              <input type="time" aria-label="Horário opcional da publicação realizada" value={horaPublicacao} onChange={e => setHoraPublicacao(e.target.value)} disabled={!dataPublicacao} className="h-10 w-full rounded-xl border border-border bg-base px-3 text-xs text-text disabled:opacity-40" />
            </div>
            <p className="text-[11px] text-muted">Salve junto com o link no botão Salvar. Esta data define o mês no resumo; sem data, o conteúdo não entra na contagem de publicados. Horário opcional, em Brasília.</p>
            {tarefa.publicadoEm && <p className="mt-1.5 text-[11px] text-muted">Publicado em {dataHoraPublicacao(tarefa.publicadoEm)}</p>}
          </>}
        </div>
      )}

      {/* Versões */}
      <div className="mb-2 flex flex-col gap-2">
        {tarefa.versoes.length === 0 && <p className="text-xs text-muted">Nenhuma versão enviada ainda.</p>}
        {tarefa.versoes.map((v, i) => (
          <div key={v.id} className="rounded-lg border border-border bg-card/60 p-3">
            <p className="mb-1.5 flex items-center justify-between text-[11px] text-muted">
              <span className="font-medium text-text/80">
                Versão {v.numero}
                {i === 0 ? " (atual)" : ""}
              </span>
              <span>
                {v.criadoPor?.nome || "Alguém"} · {new Date(v.createdAt).toLocaleString("pt-BR")}
              </span>
            </p>
            <div className="mb-1.5 flex flex-wrap gap-2">
              {v.linkVideo && (
                <a
                  href={v.linkVideo}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-text hover:bg-hover"
                >
                  <Video size={11} /> Vídeo
                </a>
              )}
              {v.linkImagem && (
                <a
                  href={v.linkImagem}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-text hover:bg-hover"
                >
                  <ImageIcon size={11} /> Imagem
                </a>
              )}
            </div>
            {v.legenda && <p className="mb-1.5 whitespace-pre-wrap text-xs text-text">{v.legenda}</p>}

            {v.aprovadoEm ? (
              <p className="flex items-center gap-1 text-[11px] text-emerald-400">
                <CheckCircle2 size={11} /> Aprovado por {nomeAprovador(v)} em {new Date(v.aprovadoEm).toLocaleString("pt-BR")}
              </p>
            ) : v.alteracoesSolicitadasEm ? (
              <p className="text-[11px] text-amber-400">Cliente pediu alterações em {new Date(v.alteracoesSolicitadasEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}. Envie uma nova versão depois de corrigir.</p>
            ) : i === 0 ? (
              <div className="mt-1.5 flex gap-1.5">
                <input
                  value={nomeAprovacao}
                  onChange={(e) => setNomeAprovacao(e.target.value)}
                  placeholder="Nome de quem aprovou"
                  className="h-8 w-full flex-1 rounded-lg border border-border bg-base px-2 text-xs text-text outline-none focus:border-accent/50"
                />
                <button
                  onClick={registrarAprovacao}
                  disabled={aprovando}
                  className="h-8 shrink-0 rounded-lg bg-emerald-500/90 px-2.5 text-xs font-medium text-white disabled:opacity-50"
                >
                  Aprovar
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-muted">Substituída por uma versão mais nova, sem aprovação registrada.</p>
            )}

            {v.comentarios.length > 0 && (
              <div className="mt-2 flex flex-col gap-1.5 border-t border-border pt-2">
                {v.comentarios.map((c) => (
                  <div key={c.id} className="rounded-lg bg-base px-2 py-1.5">
                    <p className="mb-0.5 flex items-center justify-between text-[10px] text-muted">
                      <span className="font-medium text-text/80">
                        {nomeAutor(c)} {c.momentoVideoSegundos != null && <span className="text-accent">· {formatarTempoVideo(c.momentoVideoSegundos)}</span>} {c.interno && <span className="text-amber-400">· interno</span>}
                      </span>
                      <span>{new Date(c.createdAt).toLocaleString("pt-BR")}</span>
                    </p>
                    <p className="whitespace-pre-wrap text-xs text-text">{c.texto}</p>
                  </div>
                ))}
              </div>
            )}

            {i === 0 && (
              <form onSubmit={enviarComentario} className="mt-2 flex flex-col gap-1.5 border-t border-border pt-2">
                <div className="flex items-center gap-1.5">
                  <input
                    value={novoComentario}
                    onChange={(e) => setNovoComentario(e.target.value)}
                    placeholder="Comentar nessa versão..."
                    disabled={enviandoComentario}
                    className="h-8 w-full flex-1 rounded-lg border border-border bg-base px-2 text-xs text-text outline-none focus:border-accent/50"
                  />
                  <button
                    type="submit"
                    disabled={enviandoComentario || !novoComentario.trim()}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-white disabled:opacity-40"
                  >
                    <Send size={12} />
                  </button>
                </div>
                <label className="flex items-center gap-1.5 text-[11px] text-muted">
                  <input type="checkbox" checked={comentarioInterno} onChange={(e) => setComentarioInterno(e.target.checked)} />
                  Comentário interno (não aparece pro cliente)
                </label>
              </form>
            )}
          </div>
        ))}
      </div>

      {/* Nova versão */}
      {formVersaoAberto ? (
        <form onSubmit={enviarVersao} className="rounded-lg border border-border bg-card/60 p-3">
          <p className="mb-2 text-xs font-medium text-text">Nova versão</p>
          <input
            value={novoLinkVideo}
            onChange={(e) => setNovoLinkVideo(e.target.value)}
            placeholder="Link do vídeo (opcional)"
            className="mb-1.5 h-9 w-full rounded-lg border border-border bg-base px-3 text-xs text-text outline-none focus:border-accent/50"
          />
          <input
            value={novoLinkImagem}
            onChange={(e) => setNovoLinkImagem(e.target.value)}
            placeholder="Link da imagem (opcional)"
            className="mb-1.5 h-9 w-full rounded-lg border border-border bg-base px-3 text-xs text-text outline-none focus:border-accent/50"
          />
          <textarea
            value={novaLegenda}
            onChange={(e) => setNovaLegenda(e.target.value)}
            rows={2}
            placeholder="Legenda proposta (opcional)"
            className="mb-2 w-full rounded-lg border border-border bg-base px-3 py-2 text-xs text-text outline-none focus:border-accent/50"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={enviandoVersao}
              className="h-8 flex-1 rounded-lg bg-accent text-xs font-medium text-white disabled:opacity-50"
            >
              {enviandoVersao ? "Enviando..." : "Enviar versão"}
            </button>
            {tarefa.versoes.length > 0 && (
              <button
                type="button"
                onClick={() => setFormVersaoAberto(false)}
                className="h-8 rounded-lg border border-border px-2.5 text-xs text-muted hover:text-text"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setFormVersaoAberto(true)}
          className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-xs text-muted hover:text-text"
        >
          + Nova versão
        </button>
      )}
    </div>
  );
}
