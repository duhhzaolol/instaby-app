"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Trash2, Pencil, Phone, Mail } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export type ContatoData = {
  id: string;
  nome: string;
  cargo: string | null;
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  principal: boolean;
  financeiro: boolean;
  aprovacaoConteudo: boolean;
  contratos: boolean;
};

const FLAGS = [
  { chave: "principal", label: "Contato principal" },
  { chave: "financeiro", label: "Financeiro" },
  { chave: "aprovacaoConteudo", label: "Aprovação de conteúdo" },
  { chave: "contratos", label: "Assina contratos" },
] as const;

export default function ContatosTab({ clienteId, contatos, contatoAntigo }: { clienteId: string; contatos: ContatoData[]; contatoAntigo: string | null }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<ContatoData>>({});
  const [enviando, setEnviando] = useState(false);

  function abrirNovo() {
    setForm({});
    setEditandoId(null);
    setAberto(true);
  }

  function abrirEditar(c: ContatoData) {
    setForm(c);
    setEditandoId(c.id);
    setAberto(true);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome?.trim()) return;
    setEnviando(true);

    if (editandoId) {
      await fetch(`/api/contatos/${editandoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch(`/api/clientes/${clienteId}/contatos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }

    setEnviando(false);
    setAberto(false);
    router.refresh();
  }

  async function excluir(id: string) {
    if (!confirm("Excluir esse contato?")) return;
    await fetch(`/api/contatos/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      {contatoAntigo && contatos.length === 0 && (
        <div className="mb-4 rounded-xl border border-border bg-card/40 p-4">
          <p className="text-xs text-muted">Contato do cadastro (edite em "Editar cliente")</p>
          <p className="text-sm text-text">{contatoAntigo}</p>
        </div>
      )}

      <div className="mb-4 flex flex-col gap-2">
        {contatos.map((c) => (
          <Card key={c.id} hoverable={false} className="p-4">
            <div className="mb-1 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-text">{c.nome}</p>
                {c.cargo && <p className="text-xs text-muted">{c.cargo}</p>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => abrirEditar(c)} className="text-muted hover:text-text">
                  <Pencil size={13} />
                </button>
                <button onClick={() => excluir(c.id)} className="text-muted hover:text-red-400">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            <div className="mb-2 flex flex-wrap gap-3 text-xs text-muted">
              {c.whatsapp && (
                <span className="flex items-center gap-1">
                  <Phone size={11} /> {c.whatsapp}
                </span>
              )}
              {c.email && (
                <span className="flex items-center gap-1">
                  <Mail size={11} /> {c.email}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {FLAGS.filter((f) => c[f.chave]).map((f) => (
                <span key={f.chave} className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] text-accent">
                  {f.label}
                </span>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {!aberto ? (
        <button
          onClick={abrirNovo}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-card/40 py-3 text-sm text-muted hover:border-accent/40 hover:text-text"
        >
          <Plus size={15} /> {contatos.length === 0 ? "Adicionar contato" : "Adicionar mais um contato"}
        </button>
      ) : (
        <form onSubmit={salvar} className="rounded-2xl border border-border bg-card/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-text">{editandoId ? "Editar contato" : "Novo contato"}</p>
            <button type="button" onClick={() => setAberto(false)} className="text-muted hover:text-text">
              <X size={16} />
            </button>
          </div>

          <div className="mb-3 grid grid-cols-2 gap-2">
            <div>
              <Label>Nome</Label>
              <Input required value={form.nome || ""} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div>
              <Label>Cargo</Label>
              <Input value={form.cargo || ""} onChange={(e) => setForm({ ...form, cargo: e.target.value })} />
            </div>
          </div>

          <div className="mb-3 grid grid-cols-2 gap-2">
            <div>
              <Label>WhatsApp</Label>
              <Input value={form.whatsapp || ""} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>

          <p className="mb-1.5 text-xs text-muted">Responsável por</p>
          <div className="mb-4 flex flex-wrap gap-3">
            {FLAGS.map((f) => (
              <label key={f.chave} className="flex items-center gap-1.5 text-xs text-text">
                <input
                  type="checkbox"
                  checked={!!form[f.chave]}
                  onChange={(e) => setForm({ ...form, [f.chave]: e.target.checked })}
                />
                {f.label}
              </label>
            ))}
          </div>

          <Button type="submit" disabled={enviando} className="w-full">
            {enviando ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      )}
    </div>
  );
}
