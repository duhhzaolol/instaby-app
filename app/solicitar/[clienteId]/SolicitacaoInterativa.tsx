"use client";

import { useState } from "react";
import { Paperclip, X, CheckCircle2, Loader2 } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";
import { CATEGORIAS_SOLICITACAO_PUBLICA, perguntasParaCategoria } from "@/lib/solicitacoes";

type Contato = { id: string; nome: string };

// Guarda "quem está pedindo" localmente nesse navegador (não existe conta de
// cliente nesse sistema) só pra não pedir de novo em cada solicitação — nunca é
// enviado a lugar nenhum além da própria rota de envio. Mesmo padrão já usado em
// app/revisao/[tarefaId]/RevisaoInterativa.tsx.
function nomeSalvo(): string {
  try {
    return localStorage.getItem("instaby_solicitacao_nome") || "";
  } catch {
    return "";
  }
}
function salvarNome(nome: string) {
  try {
    localStorage.setItem("instaby_solicitacao_nome", nome);
  } catch {
    /* ignora — só é conveniência, funciona sem isso também */
  }
}

export function SolicitacaoInterativa({ clienteId, contatos }: { clienteId: string; contatos: Contato[] }) {
  const [categoria, setCategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [prazoDesejado, setPrazoDesejado] = useState("");
  const [anexos, setAnexos] = useState<string[]>([]);
  const [enviandoAnexo, setEnviandoAnexo] = useState(false);
  const [contatoId, setContatoId] = useState("");
  const [nomeLivre, setNomeLivre] = useState(nomeSalvo());
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const perguntas = perguntasParaCategoria(categoria);

  async function enviarAnexo(files: FileList | null) {
    if (!files || files.length === 0) return;
    setEnviandoAnexo(true);
    setErro(null);
    for (const arquivo of Array.from(files)) {
      const form = new FormData();
      form.append("arquivo", arquivo);
      form.append("pasta", "solicitacoes");
      try {
        const res = await fetch("/api/upload-imagem", { method: "POST", body: form });
        const dados = await res.json();
        if (res.ok && dados.url) {
          setAnexos((atual) => [...atual, dados.url]);
        } else {
          setErro(dados?.erro || "Não consegui enviar um dos arquivos.");
        }
      } catch {
        setErro("Não consegui enviar um dos arquivos — confere sua conexão.");
      }
    }
    setEnviandoAnexo(false);
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!categoria || !descricao.trim()) return;
    if (!contatoId && !nomeLivre.trim()) {
      setErro("Diz pra gente quem está pedindo, ali embaixo.");
      return;
    }
    setEnviando(true);
    setErro(null);

    if (!contatoId && nomeLivre.trim()) salvarNome(nomeLivre.trim());

    const res = await fetch(`/api/clientes/${clienteId}/solicitacoes/publica`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoria,
        descricao,
        respostas,
        prazoDesejado: prazoDesejado || null,
        anexos,
        solicitanteContatoId: contatoId || null,
        solicitanteNomeLivre: contatoId ? null : nomeLivre.trim(),
      }),
    });

    setEnviando(false);

    if (!res.ok) {
      const dados = await res.json().catch(() => null);
      setErro(dados?.erro || "Não consegui enviar seu pedido. Tenta de novo em instantes.");
      return;
    }

    setEnviado(true);
  }

  if (enviado) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card/50 p-8 text-center">
        <CheckCircle2 size={32} className="text-accent" />
        <p className="text-base font-medium text-text">Pedido recebido!</p>
        <p className="text-sm text-muted">
          A equipe vai avaliar e confirmar o prazo com você. Obrigado.
        </p>
        <button
          onClick={() => {
            setEnviado(false);
            setCategoria("");
            setDescricao("");
            setRespostas({});
            setPrazoDesejado("");
            setAnexos([]);
          }}
          className="mt-2 text-xs text-accent hover:underline"
        >
          Enviar outro pedido
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-muted">Que tipo de pedido é esse?</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIAS_SOLICITACAO_PUBLICA.map((c) => {
            const ativo = categoria === c.valor;
            return (
              <button
                key={c.valor}
                type="button"
                onClick={() => setCategoria(c.valor)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  ativo ? "bg-accent text-white" : "border border-border bg-card/60 text-muted hover:text-text"
                }`}
              >
                <c.icone size={13} /> {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {categoria && (
        <>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">Conte com detalhes o que você precisa</label>
            <textarea
              autoFocus
              required
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border bg-card/60 px-3.5 py-2.5 text-sm text-text outline-none focus:border-accent/50"
            />
          </div>

          {perguntas.map((p) => (
            <div key={p.chave}>
              <label className="mb-1.5 block text-xs font-medium text-muted">{p.rotulo}</label>
              {p.tipo === "textarea" ? (
                <textarea
                  value={respostas[p.chave] || ""}
                  onChange={(e) => setRespostas((r) => ({ ...r, [p.chave]: e.target.value }))}
                  rows={2}
                  placeholder={p.placeholder}
                  className="w-full rounded-xl border border-border bg-card/60 px-3.5 py-2.5 text-sm text-text outline-none focus:border-accent/50"
                />
              ) : (
                <input
                  value={respostas[p.chave] || ""}
                  onChange={(e) => setRespostas((r) => ({ ...r, [p.chave]: e.target.value }))}
                  placeholder={p.placeholder}
                  className="h-10 w-full rounded-xl border border-border bg-card/60 px-3.5 text-sm text-text outline-none focus:border-accent/50"
                />
              )}
            </div>
          ))}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">Prazo desejado (opcional)</label>
            <DatePicker value={prazoDesejado} onChange={setPrazoDesejado} placeholder="Quando você precisaria" limpavel />
            <p className="mt-1 text-[11px] text-muted">A equipe confirma o prazo de verdade depois de avaliar o pedido.</p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">Anexos (opcional)</label>
            <label className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-card/40 py-3 text-sm text-muted hover:border-accent/40 hover:text-text">
              {enviandoAnexo ? <Loader2 size={14} className="animate-spin" /> : <Paperclip size={14} />}
              {enviandoAnexo ? "Enviando..." : "Anexar imagem de referência"}
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={enviandoAnexo}
                onChange={(e) => enviarAnexo(e.target.files)}
                className="hidden"
              />
            </label>
            {anexos.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {anexos.map((url, i) => (
                  <span key={i} className="flex items-center gap-1.5 rounded-lg border border-border bg-base/60 px-2 py-1 text-[11px] text-muted">
                    Imagem {i + 1}
                    <button type="button" onClick={() => setAnexos((a) => a.filter((_, idx) => idx !== i))} className="text-muted hover:text-red-400">
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">Quem está pedindo?</label>
            {contatos.length > 0 && (
              <select
                value={contatoId}
                onChange={(e) => setContatoId(e.target.value)}
                className="mb-2 h-10 w-full rounded-xl border border-border bg-card/60 px-3 text-sm text-text outline-none focus:border-accent/50"
              >
                <option value="">Meu nome não está na lista</option>
                {contatos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            )}
            {!contatoId && (
              <input
                value={nomeLivre}
                onChange={(e) => setNomeLivre(e.target.value)}
                placeholder="Seu nome"
                className="h-10 w-full rounded-xl border border-border bg-card/60 px-3.5 text-sm text-text outline-none focus:border-accent/50"
              />
            )}
          </div>

          {erro && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{erro}</p>}

          <button
            type="submit"
            disabled={enviando || enviandoAnexo || !descricao.trim()}
            className="h-11 w-full rounded-xl bg-accent text-sm font-semibold text-white disabled:opacity-40"
          >
            {enviando ? "Enviando..." : "Enviar pedido"}
          </button>
        </>
      )}
    </form>
  );
}
