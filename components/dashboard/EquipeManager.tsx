"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ShieldCheck, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

type MembroEquipe = {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  master: boolean;
  ativo: boolean;
  verFinanceiro: boolean;
  gerenciarFinanceiro: boolean;
  verComercial: boolean; // legado — ver nota em aplicarPreset/abrirEdicao
  verOportunidades: boolean;
  verOrcamentos: boolean;
  verContratos: boolean;
  verCatalogo: boolean;
  gerenciarTrafego: boolean;
  gerenciarEquipe: boolean;
  gerenciarConfiguracoes: boolean;
  verArquivos: boolean;
  todosClientes: boolean;
  clienteIds: string[];
};

const CAPACIDADES: { chave: keyof MembroEquipe; label: string; ajuda: string }[] = [
  { chave: "verFinanceiro", label: "Ver Financeiro", ajuda: "Vê a área Financeiro e valores em R$ no resto do app." },
  { chave: "gerenciarFinanceiro", label: "Lançar cobrança/despesa", ajuda: "Cria e edita cobrança, despesa e contas a pagar/receber." },
];

const CAPACIDADES_DEPOIS_DO_COMERCIAL: { chave: keyof MembroEquipe; label: string; ajuda: string }[] = [
  { chave: "gerenciarTrafego", label: "Tráfego Pago", ajuda: "Campanhas, verba e resultado de tráfego pago." },
  {
    chave: "verArquivos",
    label: "Ver arquivos (Drive)",
    ajuda: "Vê a aba Arquivos dentro de cada cliente — Logotipos e Conteúdo do Drive. Contratos ali dentro continua exigindo a permissão de Contratos também.",
  },
  { chave: "gerenciarConfiguracoes", label: "Configurações", ajuda: "Site, catálogo, automações e outras configurações gerais." },
  { chave: "gerenciarEquipe", label: "Gerenciar equipe", ajuda: "Pode criar, editar e remover outros logins — cuidado ao liberar." },
];

// Antes "Comercial" era um interruptor só pros 4 juntos — agora dá pra marcar
// só o que a pessoa precisa (ex: só Oportunidades, sem ver Financeiro nem
// Contratos fechados).
const SUBPERMISSOES_COMERCIAL: { chave: keyof MembroEquipe; label: string }[] = [
  { chave: "verOportunidades", label: "Oportunidades" },
  { chave: "verOrcamentos", label: "Orçamentos" },
  { chave: "verContratos", label: "Contratos" },
  { chave: "verCatalogo", label: "Catálogo e Pacotes" },
];

const TODAS_CAPACIDADES: (keyof MembroEquipe)[] = [
  "verFinanceiro",
  "gerenciarFinanceiro",
  "verOportunidades",
  "verOrcamentos",
  "verContratos",
  "verCatalogo",
  "gerenciarTrafego",
  "verArquivos",
  "gerenciarConfiguracoes",
  "gerenciarEquipe",
];

function preset(ligadas: (keyof MembroEquipe)[]): Partial<MembroEquipe> {
  const obj: Partial<MembroEquipe> = {};
  for (const chave of TODAS_CAPACIDADES) (obj as any)[chave] = ligadas.includes(chave);
  return obj;
}

// Pontos de partida por cargo — só preenchem os toggles abaixo, nada é travado:
// depois de clicar dá pra ajustar (ligar/desligar) qualquer um antes de salvar.
// Cargo continua sendo um rótulo livre — esses são só os mais comuns na agência.
const PRESETS_CARGO: { nome: string; permissoes: Partial<MembroEquipe> }[] = [
  { nome: "Editor", permissoes: preset(["verArquivos"]) },
  { nome: "Social Media", permissoes: preset(["verCatalogo"]) },
  { nome: "Gestor de Tráfego", permissoes: preset(["gerenciarTrafego", "verCatalogo"]) },
  { nome: "Comercial", permissoes: preset(["verOportunidades", "verOrcamentos", "verContratos", "verCatalogo"]) },
  { nome: "Financeiro", permissoes: preset(["verFinanceiro", "gerenciarFinanceiro"]) },
];

function Toggle({ ligado, onChange }: { ligado: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!ligado)}
      aria-pressed={ligado}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${ligado ? "bg-accent" : "bg-border"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
          ligado ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function formVazio(): Omit<MembroEquipe, "id" | "master"> & { senha: string } {
  return {
    nome: "",
    email: "",
    senha: "",
    cargo: "",
    ativo: true,
    verFinanceiro: false,
    gerenciarFinanceiro: false,
    verComercial: false,
    verOportunidades: false,
    verOrcamentos: false,
    verContratos: false,
    verCatalogo: false,
    gerenciarTrafego: false,
    gerenciarEquipe: false,
    gerenciarConfiguracoes: false,
    verArquivos: false,
    todosClientes: true,
    clienteIds: [],
  };
}

export default function EquipeManager({
  equipeInicial,
  clientes,
}: {
  equipeInicial: MembroEquipe[];
  clientes: { id: string; nome: string }[];
}) {
  const router = useRouter();
  const [equipe, setEquipe] = useState(equipeInicial);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);
  const [form, setForm] = useState(formVazio());
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  function abrirNovo() {
    setForm(formVazio());
    setErro("");
    setCriando(true);
    setEditandoId(null);
  }

  function abrirEdicao(m: MembroEquipe) {
    setForm({
      ...m,
      senha: "",
      // Migração transparente do interruptor antigo: quem já tinha "Comercial"
      // ligado no modo antigo abre aqui já com os 4 específicos marcados
      // (mesmo acesso de antes) — ao salvar, viram os valores de verdade e o
      // flag antigo é desligado (ver salvar()).
      verOportunidades: m.verComercial || m.verOportunidades,
      verOrcamentos: m.verComercial || m.verOrcamentos,
      verContratos: m.verComercial || m.verContratos,
      verCatalogo: m.verComercial || m.verCatalogo,
    });
    setErro("");
    setEditandoId(m.id);
    setCriando(false);
  }

  function fechar() {
    setCriando(false);
    setEditandoId(null);
  }

  async function salvar() {
    setErro("");
    if (!form.nome || (!editandoId && !form.email)) {
      setErro("Preenche nome e e-mail.");
      return;
    }
    setSalvando(true);
    const url = editandoId ? `/api/equipe/${editandoId}` : "/api/equipe";
    const res = await fetch(url, {
      method: editandoId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      // verComercial sempre false daqui em diante: quem passa por esse formulário
      // (novo ou editado) fica só nos 4 específicos, que já vieram certos de
      // abrirEdicao/formVazio — assim o flag antigo vai sendo aposentado aos poucos.
      body: JSON.stringify({ ...form, verComercial: false }),
    });
    setSalvando(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErro(data.erro || "Não deu pra salvar.");
      return;
    }
    fechar();
    router.refresh();
    // Atualização otimista simples — refresh() já traz o dado certo do servidor,
    // isso só evita a tela "piscar" vazia entre o fechar e o refresh chegar.
    const salvo = await res.json().catch(() => null);
    if (salvo) {
      setEquipe((atual) =>
        editandoId
          ? atual.map((m) => (m.id === editandoId ? { ...m, ...salvo, clienteIds: form.clienteIds } : m))
          : [...atual, { ...salvo, clienteIds: form.clienteIds }]
      );
    }
  }

  async function remover(id: string, nome: string) {
    if (!confirm(`Remover o login de ${nome}? Não dá pra desfazer.`)) return;
    const res = await fetch(`/api/equipe/${id}`, { method: "DELETE" });
    if (res.ok) {
      setEquipe((atual) => atual.filter((m) => m.id !== id));
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.erro || "Não deu pra remover.");
    }
  }

  function alternarCliente(id: string) {
    setForm((f) => ({
      ...f,
      clienteIds: f.clienteIds.includes(id) ? f.clienteIds.filter((c) => c !== id) : [...f.clienteIds, id],
    }));
  }

  return (
    <div className="flex flex-col gap-4">
      {equipe.map((m, i) => (
        <Card key={m.id} index={i} className="p-4">
          {editandoId === m.id ? (
            <FormMembro
              form={form}
              setForm={setForm}
              clientes={clientes}
              alternarCliente={alternarCliente}
              erro={erro}
              salvando={salvando}
              editando
              onCancelar={fechar}
              onSalvar={salvar}
            />
          ) : (
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent">
                  {m.nome.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-medium text-text">
                    {m.nome}
                    {m.master && (
                      <span className="flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                        <ShieldCheck size={10} /> Acesso total
                      </span>
                    )}
                    {!m.ativo && (
                      <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400">
                        Inativo
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted">
                    {m.email} · {m.cargo || "Sem cargo definido"}
                  </p>
                  {!m.master && (
                    <p className="mt-1 text-[11px] text-muted/80">
                      {m.todosClientes ? "Todos os clientes" : `${m.clienteIds.length} cliente(s) atribuído(s)`}
                    </p>
                  )}
                </div>
              </div>
              {!m.master && (
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={() => abrirEdicao(m)}>
                    Editar
                  </Button>
                  <button
                    onClick={() => remover(m.id, m.nome)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </Card>
      ))}

      {criando ? (
        <Card className="p-4">
          <FormMembro
            form={form}
            setForm={setForm}
            clientes={clientes}
            alternarCliente={alternarCliente}
            erro={erro}
            salvando={salvando}
            onCancelar={fechar}
            onSalvar={salvar}
          />
        </Card>
      ) : (
        <Button variant="secondary" onClick={abrirNovo} className="self-start">
          <Plus size={15} /> Adicionar membro
        </Button>
      )}
    </div>
  );
}

function FormMembro({
  form,
  setForm,
  clientes,
  alternarCliente,
  erro,
  salvando,
  editando,
  onCancelar,
  onSalvar,
}: {
  form: any;
  setForm: (fn: any) => void;
  clientes: { id: string; nome: string }[];
  alternarCliente: (id: string) => void;
  erro: string;
  salvando: boolean;
  editando?: boolean;
  onCancelar: () => void;
  onSalvar: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-text">{editando ? "Editar membro" : "Novo membro"}</p>
        <button onClick={onCancelar} className="text-muted hover:text-text">
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label>Nome</Label>
          <Input value={form.nome} onChange={(e) => setForm((f: any) => ({ ...f, nome: e.target.value }))} />
        </div>
        <div>
          <Label>Cargo (só rótulo, ex: Editor, Gestor de Tráfego)</Label>
          <Input value={form.cargo} onChange={(e) => setForm((f: any) => ({ ...f, cargo: e.target.value }))} />
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {PRESETS_CARGO.map((p) => (
              <button
                key={p.nome}
                type="button"
                onClick={() => setForm((f: any) => ({ ...f, cargo: p.nome, ...p.permissoes }))}
                className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted transition-colors hover:border-accent/40 hover:text-accent"
              >
                {p.nome}
              </button>
            ))}
          </div>
          <p className="mt-1 text-[10px] text-muted/70">
            Clique num cargo pra preencher "O que essa pessoa pode" com um padrão — dá pra ajustar depois.
          </p>
        </div>
        <div>
          <Label>E-mail {editando && "(não muda depois)"}</Label>
          <Input
            type="email"
            value={form.email}
            disabled={editando}
            onChange={(e) => setForm((f: any) => ({ ...f, email: e.target.value }))}
          />
        </div>
        <div>
          <Label>{editando ? "Nova senha (deixe em branco pra manter)" : "Senha"}</Label>
          <Input
            type="password"
            value={form.senha}
            onChange={(e) => setForm((f: any) => ({ ...f, senha: e.target.value }))}
          />
        </div>
      </div>

      {editando && (
        <div className="flex items-center justify-between rounded-xl border border-border bg-base/60 px-3.5 py-2.5">
          <p className="text-sm text-text">Login ativo</p>
          <Toggle ligado={form.ativo} onChange={(v) => setForm((f: any) => ({ ...f, ativo: v }))} />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted/70">O que essa pessoa pode</p>
        {CAPACIDADES.map((c) => (
          <div
            key={c.chave}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-base/60 px-3.5 py-2.5"
          >
            <div>
              <p className="text-sm text-text">{c.label}</p>
              <p className="text-xs text-muted">{c.ajuda}</p>
            </div>
            <Toggle
              ligado={!!form[c.chave]}
              onChange={(v) => setForm((f: any) => ({ ...f, [c.chave]: v }))}
            />
          </div>
        ))}

        <div className="rounded-xl border border-border bg-base/60 px-3.5 py-2.5">
          <p className="text-sm text-text">Comercial</p>
          <p className="mb-2.5 text-xs text-muted">Marque só o que essa pessoa precisa ver.</p>
          <div className="flex flex-col gap-2 border-t border-border pt-2.5">
            {SUBPERMISSOES_COMERCIAL.map((c) => (
              <div key={c.chave} className="flex items-center justify-between gap-3 pl-1">
                <p className="text-xs text-text">{c.label}</p>
                <Toggle
                  ligado={!!form[c.chave]}
                  onChange={(v) => setForm((f: any) => ({ ...f, [c.chave]: v }))}
                />
              </div>
            ))}
          </div>
        </div>

        {CAPACIDADES_DEPOIS_DO_COMERCIAL.map((c) => (
          <div
            key={c.chave}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-base/60 px-3.5 py-2.5"
          >
            <div>
              <p className="text-sm text-text">{c.label}</p>
              <p className="text-xs text-muted">{c.ajuda}</p>
            </div>
            <Toggle
              ligado={!!form[c.chave]}
              onChange={(v) => setForm((f: any) => ({ ...f, [c.chave]: v }))}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-base/60 px-3.5 py-2.5">
          <div>
            <p className="text-sm text-text">Vê todos os clientes</p>
            <p className="text-xs text-muted">Desligado = só enxerga os clientes marcados abaixo.</p>
          </div>
          <Toggle ligado={form.todosClientes} onChange={(v) => setForm((f: any) => ({ ...f, todosClientes: v }))} />
        </div>

        {!form.todosClientes && (
          <div className="flex flex-wrap gap-1.5 rounded-xl border border-border bg-base/60 p-3">
            {clientes.length === 0 && <p className="text-xs text-muted">Nenhum cliente cadastrado ainda.</p>}
            {clientes.map((c) => {
              const marcado = form.clienteIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => alternarCliente(c.id)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    marcado
                      ? "border-accent/40 bg-accent/10 text-accent"
                      : "border-border text-muted hover:text-text"
                  }`}
                >
                  {c.nome}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {erro && <p className="text-xs text-red-400">{erro}</p>}

      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button size="sm" onClick={onSalvar} disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </div>
  );
}
