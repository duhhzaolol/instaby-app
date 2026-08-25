"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, UploadCloud, Check } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { Button } from "@/components/ui/Button";
import { REDES, visualDaRede } from "@/lib/redesSociais";
import { importarRelatorioAds } from "@/lib/parseRelatorioAds";

const CAMPOS_ORGANICOS = [
  { chave: "seguidoresInicio", label: "Seguidores no início" },
  { chave: "seguidoresFim", label: "Seguidores no fim" },
  { chave: "alcance", label: "Contas alcançadas" },
  { chave: "impressoes", label: "Impressões" },
  { chave: "curtidas", label: "Curtidas" },
  { chave: "comentariosQtd", label: "Comentários" },
  { chave: "compartilhamentos", label: "Compartilhamentos" },
  { chave: "salvamentos", label: "Salvamentos" },
  { chave: "visualizacoes", label: "Visualizações" },
  { chave: "postsPublicados", label: "Posts publicados" },
  { chave: "reelsPublicados", label: "Reels publicados" },
];

const CAMPOS_PAGOS = [
  { chave: "alcance", label: "Alcance" },
  { chave: "impressoes", label: "Impressões" },
  { chave: "cliques", label: "Cliques" },
  { chave: "leads", label: "Leads" },
];

export function NovoRelatorioForm({ clienteId, redesGerenciadas }: { clienteId: string; redesGerenciadas: string[] }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [rede, setRede] = useState(redesGerenciadas[0] || "instagram");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [valores, setValores] = useState<Record<string, string>>({});
  const [investimento, setInvestimento] = useState(0);
  const [comentarioAgencia, setComentarioAgencia] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [importado, setImportado] = useState<{ colunas: string[]; linhas: number } | null>(null);

  const infoRede = visualDaRede(rede);
  const campos = infoRede.paga ? CAMPOS_PAGOS : CAMPOS_ORGANICOS;

  async function selecionarArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    setImportando(true);
    setImportado(null);

    try {
      const dados = await importarRelatorioAds(arquivo);
      if (!dados) {
        alert("Não consegui ler nenhuma linha desse arquivo.");
      } else {
        setInvestimento(dados.investimento);
        setValores({
          alcance: dados.alcance ? String(Math.round(dados.alcance)) : "",
          impressoes: dados.impressoes ? String(Math.round(dados.impressoes)) : "",
          cliques: dados.cliques ? String(Math.round(dados.cliques)) : "",
          leads: dados.leads ? String(Math.round(dados.leads)) : "",
        });
        setImportado({ colunas: dados.colunasReconhecidas, linhas: dados.linhasProcessadas });
      }
    } catch {
      alert("Não consegui processar esse arquivo — confere se é o export direto do Meta Ads (CSV ou Excel).");
    }

    setImportando(false);
    e.target.value = "";
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!inicio || !fim) return;
    setEnviando(true);

    await fetch(`/api/clientes/${clienteId}/relatorios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rede,
        inicio,
        fim,
        ...valores,
        investimento: infoRede.paga ? investimento : undefined,
        comentarioAgencia,
      }),
    });

    setEnviando(false);
    setAberto(false);
    setValores({});
    setComentarioAgencia("");
    router.refresh();
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="mb-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-card/40 py-3 text-sm text-muted hover:border-accent/40 hover:text-text"
      >
        <Plus size={15} /> Lançar período
      </button>
    );
  }

  return (
    <Card hoverable={false} className="mb-4 p-4">
      <form onSubmit={salvar}>
        <Label>Rede</Label>
        <div className="mb-3 flex flex-wrap gap-2">
          {REDES.filter((r) => redesGerenciadas.includes(r.valor)).map((r) => {
            const Icon = r.icone;
            return (
              <button
                key={r.valor}
                type="button"
                onClick={() => setRede(r.valor)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
                  rede === r.valor ? "border-accent/40 bg-accent/10 text-accent" : "border-border text-muted"
                }`}
              >
                <Icon size={12} /> {r.label}
              </button>
            );
          })}
        </div>

        <div className="mb-3 grid grid-cols-2 gap-2">
          <div>
            <Label>Início do período</Label>
            <Input type="date" required value={inicio} onChange={(e) => setInicio(e.target.value)} />
          </div>
          <div>
            <Label>Fim do período</Label>
            <Input type="date" required value={fim} onChange={(e) => setFim(e.target.value)} />
          </div>
        </div>

        {infoRede.paga && (
          <>
            <div className="mb-3 rounded-xl border border-dashed border-border bg-base/60 p-3">
              <label className="flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-border bg-card/60 text-xs text-muted hover:border-accent/40 hover:text-text">
                <UploadCloud size={13} />
                {importando ? "Lendo arquivo..." : "Importar CSV ou Excel do Meta Ads"}
                <input type="file" accept=".csv,.xlsx,.xls" onChange={selecionarArquivo} className="hidden" />
              </label>
              {importado && (
                <p className="mt-2 flex items-center gap-1 text-[11px] text-emerald-400">
                  <Check size={11} />
                  {importado.linhas} linha(s) lida(s), preenchi {importado.colunas.length} campo(s)
                  automaticamente — confere os valores abaixo antes de salvar.
                </p>
              )}
            </div>

            <Label>Investimento no período</Label>
            <CurrencyInput value={investimento} onChange={setInvestimento} className="mb-3" />
          </>
        )}

        <div className="mb-3 grid grid-cols-2 gap-2">
          {campos.map((c) => (
            <div key={c.chave}>
              <Label>{c.label}</Label>
              <input
                type="number"
                value={valores[c.chave] || ""}
                onChange={(e) => setValores((v) => ({ ...v, [c.chave]: e.target.value }))}
                className="h-10 w-full rounded-xl border border-border bg-card/60 px-3 text-sm text-text"
              />
            </div>
          ))}
        </div>

        <Label>Comentário da agência (aparece no relatório)</Label>
        <Textarea
          value={comentarioAgencia}
          onChange={(e) => setComentarioAgencia(e.target.value)}
          rows={2}
          placeholder="Ex: Esse mês tivemos uma evolução significativa no alcance..."
          className="mb-3"
        />

        <div className="flex gap-2">
          <Button type="submit" disabled={enviando} className="flex-1">
            {enviando ? "Salvando..." : "Salvar relatório"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => setAberto(false)}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
