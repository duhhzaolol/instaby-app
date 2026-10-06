"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, X, Check, AlertTriangle, ArrowRight, Info, History } from "lucide-react";
import { requisicaoImportacaoMeta } from "@/lib/requisicaoImportacaoMeta";

type Cliente = { id: string; nome: string };

type LinhaCampanhaMeta = {
  nome: string;
  status: string;
  inicio: string;
  fim: string;
  resultados: number | null;
  indicadorResultado: string | null;
  valorGasto: number;
  impressoes: number | null;
  alcance: number | null;
  idExterno: string | null;
  configAtribuicao: string | null;
  custoPorResultado: number | null;
  orcamentoConjunto: number | null;
  tipoOrcamento: string | null;
  termino: string | null;
};

type Candidato = { id: string; nome: string; statusInterno: string };

type LinhaResolvida = {
  linhaIndex: number;
  linha: LinhaCampanhaMeta;
  campanhaId: string | null;
  campanhaNomeAtual: string | null;
  resolucao: "auto_id" | "auto_chave" | "manual" | "nova_campanha" | "pendente";
  motivoAmbiguidade: string | null;
  candidatos: Candidato[];
  gastoAnterior: number;
  gastoIncremental: number;
  correcaoNegativa: boolean;
};

type Previa = {
  clienteId: string;
  nomeArquivo: string;
  contaAnuncios: string | null;
  periodoInicio: string;
  periodoFim: string;
  arquivoAntigo: boolean;
  ultimoPeriodoFimConfirmado: string | null;
  linhasTotal: number;
  linhasIgnoradas: number;
  linhasComGasto: number;
  gastoTotalArquivo: number;
  colunasReconhecidas: string[];
  temIdExterno: boolean;
  linhas: LinhaResolvida[];
  pendentes: number;
};

type SaldoResumo = {
  formaPagamento?: string | null;
  controlaSaldo?: boolean;
  temVerbaCadastrada: boolean;
  saldoInicial: number;
  totalAportes: number;
  totalDevolucoes: number;
  totalAjustes: number;
  totalSaldoTransportado: number;
  gastoAcumulado: number;
  saldoRestante: number;
};

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function dataBr(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR");
}

function arquivoParaBase64(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => {
      const resultado = leitor.result as string;
      resolve(resultado.split(",")[1] || "");
    };
    leitor.onerror = reject;
    leitor.readAsDataURL(arquivo);
  });
}

export default function ImportarCampanhasMeta({
  clientes,
  clienteFixo,
}: {
  clientes: Cliente[];
  clienteFixo?: string;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [clienteId, setClienteId] = useState(clienteFixo || "");
  const [arquivo, setArquivo] = useState<{ nome: string; base64: string } | null>(null);
  const [lendo, setLendo] = useState(false);
  const [carregandoPrevia, setCarregandoPrevia] = useState(false);
  const [previa, setPrevia] = useState<Previa | null>(null);
  const [saldoAtual, setSaldoAtual] = useState<SaldoResumo | null>(null);
  const [saldoProjetado, setSaldoProjetado] = useState<number | null>(null);
  const [resolucoes, setResolucoes] = useState<Record<number, string>>({});
  const [confirmarArquivoAntigo, setConfirmarArquivoAntigo] = useState(false);
  const [precisaConfirmarArquivoAntigo, setPrecisaConfirmarArquivoAntigo] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [segundosImportando, setSegundosImportando] = useState(0);
  const ultimaPrevia = useRef(0);
  const [erro, setErro] = useState("");
  const [resultado, setResultado] = useState<{ campanhasCriadas: number; campanhasAtualizadas: number; itensGravados: number } | null>(
    null
  );

  useEffect(() => {
    if (!confirmando) return;
    const inicio = Date.now();
    setSegundosImportando(0);
    const timer = setInterval(() => setSegundosImportando(Math.floor((Date.now() - inicio) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [confirmando]);

  useEffect(() => () => { ultimaPrevia.current++; }, []);

  async function buscarPrevia(nomeArquivo: string, base64: string, resolucoesAtuais: Record<number, string>) {
    const id = ++ultimaPrevia.current;
    setCarregandoPrevia(true);
    setErro("");
    try {
      const { resp, json } = await requisicaoImportacaoMeta<{
        previa: Previa; saldoAtual?: SaldoResumo; saldoProjetado?: number | null;
        formaPagamento?: string | null; controlaSaldo?: boolean;
      }>("/api/campanhas/importar-meta/preview", {
        clienteId, nomeArquivo, conteudoBase64: base64, resolucoesManuais: resolucoesAtuais,
      });
      if (id !== ultimaPrevia.current) return;
      if (!resp.ok || !json.previa) throw new Error(json.erro || "Não consegui ler esse arquivo.");
      setPrevia(json.previa);
      setSaldoAtual(json.saldoAtual ? {
        ...json.saldoAtual,
        formaPagamento: json.formaPagamento ?? json.saldoAtual.formaPagamento ?? null,
        controlaSaldo: json.controlaSaldo ?? json.saldoAtual.controlaSaldo,
      } : null);
      setSaldoProjetado(json.saldoProjetado ?? null);
    } catch (erro) {
      if (id !== ultimaPrevia.current) return;
      setErro(erro instanceof Error ? erro.message : "Não consegui carregar a prévia.");
      setPrevia(null);
      setSaldoAtual(null);
      setSaldoProjetado(null);
    } finally {
      if (id === ultimaPrevia.current) setCarregandoPrevia(false);
    }
  }

  async function selecionarArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivoSelecionado = e.target.files?.[0];
    if (!arquivoSelecionado) return;
    setLendo(true);
    setResultado(null);
    setErro("");
    setPrevia(null);
    setSaldoAtual(null);
    setSaldoProjetado(null);
    setResolucoes({});
    setConfirmarArquivoAntigo(false);
    setPrecisaConfirmarArquivoAntigo(false);

    try {
      const base64 = await arquivoParaBase64(arquivoSelecionado);
      setArquivo({ nome: arquivoSelecionado.name, base64 });
      setLendo(false);
      await buscarPrevia(arquivoSelecionado.name, base64, {});
    } catch {
      setLendo(false);
      setErro("Não consegui processar esse arquivo — confere se é CSV ou Excel exportado direto do Meta.");
    }
    e.target.value = "";
  }

  function escolherResolucao(linhaIndex: number, valor: string) {
    const novas = { ...resolucoes, [linhaIndex]: valor };
    setResolucoes(novas);
    if (arquivo) buscarPrevia(arquivo.nome, arquivo.base64, novas);
  }

  async function confirmar(forcar: boolean) {
    if (!arquivo || !clienteId || confirmando || carregandoPrevia) return;
    setConfirmando(true);
    setErro("");
    try {
      const { resp, json } = await requisicaoImportacaoMeta<{
        loteId: string; campanhasCriadas: number; campanhasAtualizadas: number;
        itensGravados: number; precisaConfirmarArquivoAntigo?: boolean;
      }>("/api/campanhas/importar-meta/confirmar", {
        clienteId,
        nomeArquivo: arquivo.nome,
        conteudoBase64: arquivo.base64,
        resolucoesManuais: resolucoes,
        forcarArquivoAntigo: forcar,
      });
      if (resp.status === 409 && json.precisaConfirmarArquivoAntigo) {
        setPrecisaConfirmarArquivoAntigo(true);
        return;
      }
      if (!resp.ok) throw new Error(json.erro || "Não consegui importar. Confira o histórico antes de tentar novamente.");
      if (typeof json.loteId !== "string" || typeof json.itensGravados !== "number") {
        throw new Error("Não recebi a confirmação da importação. Confira o Histórico de importações antes de tentar novamente.");
      }
      setResultado(json);
      setPrevia(null);
      setArquivo(null);
      router.refresh();
    } catch (erro) {
      setErro(erro instanceof Error ? erro.message : "Não consegui confirmar a importação. Confira o histórico antes de tentar novamente.");
    } finally {
      setConfirmando(false);
    }
  }

  function fecharTudo() {
    if (confirmando) return;
    ultimaPrevia.current++;
    setCarregandoPrevia(false);
    setAberto(false);
    setArquivo(null);
    setPrevia(null);
    setSaldoAtual(null);
    setSaldoProjetado(null);
    setResolucoes({});
    setResultado(null);
    setErro("");
    setPrecisaConfirmarArquivoAntigo(false);
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="mb-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-card/40 py-2.5 text-xs text-muted hover:border-accent/40 hover:text-text"
      >
        <UploadCloud size={13} /> Importar do Meta Ads
      </button>
    );
  }

  return (
    <div className="mb-4 rounded-2xl border border-border bg-card/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-text">Importar campanhas do Meta Ads</p>
        <button disabled={confirmando} onClick={fecharTudo} className="text-muted hover:text-text disabled:opacity-40">
          <X size={16} />
        </button>
      </div>

      {!clienteFixo && !previa && (
        <select
          disabled={lendo || carregandoPrevia || confirmando}
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          className="mb-3 h-10 w-full rounded-xl border border-border bg-base/60 px-3 text-sm text-text"
        >
          <option value="">Selecione o cliente desse arquivo</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      )}

      {!previa && !resultado && (
        <>
          <label
            className={`mb-2 flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-base/60 text-xs text-muted ${
              clienteId ? "cursor-pointer hover:border-accent/40 hover:text-text" : "cursor-not-allowed opacity-50"
            }`}
          >
            <UploadCloud size={13} />
            {lendo || carregandoPrevia ? "Lendo arquivo..." : "Escolher CSV ou Excel exportado do Gerenciador de Anúncios"}
            <input type="file" accept=".csv,.xlsx,.xls" onChange={selecionarArquivo} disabled={!clienteId || lendo || carregandoPrevia || confirmando} className="hidden" />
          </label>
          <p className="mb-2 flex items-start gap-1.5 text-[11px] text-muted">
            <Info size={12} className="mt-0.5 shrink-0" />
            Exporte sempre acumulado desde o dia 1 do mês. Pra reconhecer campanhas automaticamente mesmo com nomes
            repetidos, inclua também a coluna <span className="font-medium text-text">"ID da campanha"</span> na
            exportação — sem ela, nomes repetidos caem numa conferência manual.
          </p>
        </>
      )}

      {erro && (
        <p className="mb-2 flex items-center gap-1 text-[11px] text-red-400">
          <AlertTriangle size={11} /> {erro}
        </p>
      )}

      {previa && (
        <div>
          <div className="mb-3 rounded-xl border border-border bg-base/40 p-3 text-xs">
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1">
              <p className="font-medium text-text">
                {clientes.find((c) => c.id === clienteId)?.nome || "Cliente"} · {previa.nomeArquivo}
                {previa.contaAnuncios && <span className="font-normal text-muted"> · Conta: {previa.contaAnuncios}</span>}
              </p>
              <p className="text-muted">
                {dataBr(previa.periodoInicio)} – {dataBr(previa.periodoFim)}
              </p>
            </div>
            <p className="text-muted">
              {previa.linhasTotal} campanha(s) encontrada(s), {previa.linhasComGasto} com gasto · R$ {fmt(previa.gastoTotalArquivo)}{" "}
              no arquivo
              {previa.linhasIgnoradas > 0 && ` · ${previa.linhasIgnoradas} linha(s) ignorada(s)`}
            </p>
            {!previa.temIdExterno && (
              <p className="mt-1 flex items-start gap-1 text-[11px] text-amber-400">
                <Info size={11} className="mt-0.5 shrink-0" />
                Esse arquivo não tem coluna de ID — a identificação usa nome + configuração de atribuição, com
                conferência manual quando não for confiável.
              </p>
            )}
            {previa.arquivoAntigo && (
              <p className="mt-1 flex items-start gap-1 text-[11px] text-red-400">
                <History size={11} className="mt-0.5 shrink-0" />
                Esse período termina antes da última importação já confirmada desse cliente (até{" "}
                {previa.ultimoPeriodoFimConfirmado && dataBr(previa.ultimoPeriodoFimConfirmado)}). Nada será
                aplicado automaticamente — só depois de você confirmar que é mesmo uma correção.
              </p>
            )}
          </div>

          {saldoAtual?.controlaSaldo === false && (
            <div className="mb-3 rounded-xl border border-border bg-base/40 p-3 text-xs">
              <p className="font-medium text-text">Gasto registrado com pagamento por cartão</p>
              <p className="mt-1 text-muted">
                R$ {fmt(previa.gastoTotalArquivo)} em anúncios neste relatório. Esse valor acompanha o gasto
                informado pela Meta; não representa o valor faturado ou pago no cartão.
              </p>
            </div>
          )}
          {saldoAtual?.controlaSaldo !== false && saldoAtual?.temVerbaCadastrada && saldoProjetado !== null && (
            <div
              className={`mb-3 rounded-xl border p-3 ${
                saldoProjetado < 0 ? "border-red-500/30 bg-red-500/5" : "border-accent/30 bg-accent/5"
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Saldo restante atual</span>
                <span className="text-text">R$ {fmt(saldoAtual.saldoRestante)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-muted">Saldo restante após essa importação</span>
                <span className={`text-sm font-semibold ${saldoProjetado < 0 ? "text-red-400" : "text-text"}`}>
                  R$ {fmt(saldoProjetado)}
                </span>
              </div>
              {saldoProjetado < 0 && (
                <p className="mt-1.5 flex items-start gap-1 text-[11px] text-red-400">
                  <AlertTriangle size={11} className="mt-0.5 shrink-0" />
                  Essa importação deixaria o saldo negativo.
                </p>
              )}
            </div>
          )}
          {saldoAtual && saldoAtual.controlaSaldo !== false && !saldoAtual.temVerbaCadastrada && (
            <p className="mb-3 flex items-start gap-1.5 text-[11px] text-muted">
              <Info size={12} className="mt-0.5 shrink-0" />
              Esse cliente ainda não tem verba cadastrada — o impacto no saldo aparece aqui depois de registrar o
              saldo inicial em "Verba e movimentações".
            </p>
          )}

          {previa.pendentes > 0 && (
            <div className="mb-3">
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-amber-400">
                <AlertTriangle size={11} /> {previa.pendentes} linha(s) precisam de conferência manual
              </p>
              <div className="flex flex-col gap-2">
                {previa.linhas
                  .filter((l) => l.resolucao === "pendente")
                  .map((l) => (
                    <div key={l.linhaIndex} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-2.5">
                      <p className="text-xs font-medium text-text">{l.linha.nome}</p>
                      {l.linha.configAtribuicao && (
                        <p className="text-[11px] text-muted">Atribuição: {l.linha.configAtribuicao}</p>
                      )}
                      <p className="mt-0.5 text-[11px] text-muted">{l.motivoAmbiguidade}</p>
                      <select
                        disabled={confirmando}
                        value={resolucoes[l.linhaIndex] || ""}
                        onChange={(e) => escolherResolucao(l.linhaIndex, e.target.value)}
                        className="mt-1.5 h-9 w-full rounded-lg border border-border bg-base/60 px-2 text-xs text-text"
                      >
                        <option value="">Escolha o que fazer com essa linha...</option>
                        <option value="nova">É uma campanha nova</option>
                        {l.candidatos.map((c) => (
                          <option key={c.id} value={c.id}>
                            Vincular a: {c.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="mb-3 max-h-64 overflow-y-auto rounded-xl border border-border">
            <table className="w-full text-[11px]">
              <thead className="sticky top-0 bg-card text-muted">
                <tr>
                  <th className="p-2 text-left font-medium">Campanha</th>
                  <th className="p-2 text-left font-medium">Situação</th>
                  <th className="p-2 text-right font-medium">Gasto anterior</th>
                  <th className="p-2 text-right font-medium">Gasto atualizado</th>
                  <th className="p-2 text-right font-medium">Diferença</th>
                </tr>
              </thead>
              <tbody>
                {previa.linhas
                  .filter((l) => l.resolucao !== "pendente")
                  .map((l) => (
                    <tr key={l.linhaIndex} className="border-t border-border/60">
                      <td className="max-w-[160px] truncate p-2 text-text" title={l.linha.nome}>
                        {l.linha.nome}
                      </td>
                      <td className="p-2 text-muted">
                        {l.resolucao === "nova_campanha"
                          ? "Campanha nova"
                          : l.resolucao === "manual"
                          ? `Vinculada: ${l.campanhaNomeAtual}`
                          : `Reconhecida: ${l.campanhaNomeAtual}`}
                      </td>
                      <td className="p-2 text-right text-muted">R$ {fmt(l.gastoAnterior)}</td>
                      <td className="p-2 text-right text-text">R$ {fmt(l.linha.valorGasto)}</td>
                      <td className={`p-2 text-right font-medium ${l.correcaoNegativa ? "text-red-400" : "text-emerald-400"}`}>
                        {l.gastoIncremental >= 0 ? "+" : ""}
                        R$ {fmt(l.gastoIncremental)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {precisaConfirmarArquivoAntigo && (
            <label className="mb-2 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/5 p-2.5 text-[11px] text-text">
              <input
                type="checkbox"
                checked={confirmarArquivoAntigo}
                onChange={(e) => setConfirmarArquivoAntigo(e.target.checked)}
              />
              Sim, esse arquivo é mais antigo mesmo e quero aplicar essa correção.
            </label>
          )}

          <button
            onClick={() => confirmar(precisaConfirmarArquivoAntigo && confirmarArquivoAntigo)}
            disabled={
              confirmando ||
              carregandoPrevia ||
              previa.pendentes > 0 ||
              (precisaConfirmarArquivoAntigo && !confirmarArquivoAntigo)
            }
            className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-accent text-xs font-semibold text-white disabled:opacity-40"
          >
            {confirmando ? (
              `Importando... ${segundosImportando}s`
            ) : previa.pendentes > 0 ? (
              "Resolva as linhas pendentes"
            ) : (
              <>
                Confirmar importação <ArrowRight size={12} />
              </>
            )}
          </button>
        </div>
      )}

      {resultado && (
        <p className="flex items-center gap-1 text-[11px] text-emerald-400">
          <Check size={11} />
          Importado: {resultado.campanhasCriadas} campanha(s) nova(s), {resultado.campanhasAtualizadas} atualizada(s),{" "}
          {resultado.itensGravados} linha(s) gravada(s) no histórico.
        </p>
      )}
    </div>
  );
}
