"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen, ExternalLink } from "lucide-react";

type Pastas = {
  driveClienteFolderId: string | null;
  driveLogotiposFolderId: string | null;
  driveConteudoFolderId: string | null;
};
const link = (id: string) => `https://drive.google.com/drive/folders/${id}`;
export default function PastasClienteDrive({
  clienteId,
  pastasIniciais,
}: {
  clienteId: string;
  pastasIniciais: Pastas;
}) {
  const router = useRouter();
  const [pastas, setPastas] = useState(pastasIniciais);
  const [url, setUrl] = useState(
    pastas.driveLogotiposFolderId ? link(pastas.driveLogotiposFolderId) : "",
  );
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  async function salvar(criar: boolean) {
    setOcupado(true);
    setErro("");
    setMensagem("");
    try {
      const res = await fetch(`/api/clientes/${clienteId}/pastas-drive`, {
        method: criar ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        ...(criar ? {} : { body: JSON.stringify({ identidadeUrl: url }) }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.erro || "Não consegui salvar a pasta.");
      setPastas(d);
      setUrl(d.driveLogotiposFolderId ? link(d.driveLogotiposFolderId) : "");
      setMensagem(
        criar
          ? "Pastas prontas."
          : "Pasta de identidade salva. O acesso já aparece nas tarefas deste cliente.",
      );
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não consegui salvar a pasta.");
    } finally {
      setOcupado(false);
    }
  }
  return (
    <div className="mb-5 rounded-2xl border border-border bg-card/60 p-4">
      <p className="mb-1 flex items-center gap-2 text-sm font-medium text-text">
        <FolderOpen size={16} /> Pastas do cliente no Drive
      </p>
      <p className="mb-3 text-xs text-muted">
        Guarde os logos com e sem fundo, versões claras e escuras, fontes e
        arquivos da marca na pasta de identidade. O link é o mesmo para todos os
        editores e tarefas deste cliente.
      </p>
      <div className="mb-3 flex flex-wrap gap-2">
        {pastas.driveClienteFolderId && (
          <a
            href={link(pastas.driveClienteFolderId)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs text-text"
          >
            <ExternalLink size={12} /> Pasta do cliente
          </a>
        )}
        {pastas.driveLogotiposFolderId && (
          <a
            href={link(pastas.driveLogotiposFolderId)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs text-text"
          >
            <ExternalLink size={12} /> Identidade do cliente
          </a>
        )}
        {pastas.driveConteudoFolderId && (
          <a
            href={link(pastas.driveConteudoFolderId)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs text-text"
          >
            <ExternalLink size={12} /> Conteúdo e vídeos
          </a>
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void salvar(false);
        }}
      >
        <label
          htmlFor="pasta-identidade"
          className="mb-1 block text-xs text-muted"
        >
          Link da pasta de identidade do cliente
        </label>
        <input
          id="pasta-identidade"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://drive.google.com/drive/folders/..."
          className="mb-2 h-10 w-full rounded-xl border border-border bg-base px-3 text-sm text-text"
        />
        <div className="flex flex-wrap gap-2">
          <button
            disabled={ocupado}
            className="min-h-10 rounded-lg bg-accent px-3 text-xs font-medium text-white disabled:opacity-40"
          >
            {ocupado ? "Preparando..." : "Salvar pasta de identidade"}
          </button>
          {(!pastas.driveClienteFolderId ||
            !pastas.driveLogotiposFolderId ||
            !pastas.driveConteudoFolderId) && (
            <button
              type="button"
              disabled={ocupado}
              onClick={() => void salvar(true)}
              className="min-h-10 rounded-lg border border-border px-3 text-xs text-text disabled:opacity-40"
            >
              Criar pastas automaticamente
            </button>
          )}
        </div>
      </form>
      <p className="mt-2 text-xs text-muted">
        Novos clientes ganham suas pastas automaticamente com o Drive conectado.
        Clientes já cadastrados mantêm as pastas existentes; você também pode
        colar o link de outra pasta de identidade.
      </p>
      {erro && (
        <p role="alert" className="mt-2 text-xs text-red-400">
          {erro}
        </p>
      )}
      {mensagem && (
        <p role="status" className="mt-2 text-xs text-emerald-400">
          {mensagem}
        </p>
      )}
    </div>
  );
}
