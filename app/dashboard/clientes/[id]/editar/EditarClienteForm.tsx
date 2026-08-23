"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { SeletorCor } from "@/components/ui/SeletorCor";
import { UploadLogo } from "@/components/ui/UploadLogo";
import { Button } from "@/components/ui/Button";

type Cliente = {
  id: string;
  nome: string;
  whatsapp: string;
  cnpj: string;
  contatoNome: string;
  endereco: string;
  logoUrl: string;
  linkDrive: string;
  cor: string;
  status: string;
};

export default function EditarClienteForm({ cliente }: { cliente: Cliente }) {
  const router = useRouter();
  const [nome, setNome] = useState(cliente.nome);
  const [whatsapp, setWhatsapp] = useState(cliente.whatsapp);
  const [cnpj, setCnpj] = useState(cliente.cnpj);
  const [contatoNome, setContatoNome] = useState(cliente.contatoNome);
  const [endereco, setEndereco] = useState(cliente.endereco);
  const [logoUrl, setLogoUrl] = useState(cliente.logoUrl);
  const [linkDrive, setLinkDrive] = useState(cliente.linkDrive);
  const [cor, setCor] = useState(cliente.cor || "#3B82F6");
  const [status, setStatus] = useState(cliente.status);
  const [mensalidade, setMensalidade] = useState(0);
  const [proximoVencimento, setProximoVencimento] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const viroAtivoAgora = status === "ativo" && cliente.status !== "ativo";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);

    await fetch(`/api/clientes/${cliente.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome,
        whatsapp,
        cnpj,
        contatoNome,
        endereco,
        logoUrl,
        linkDrive,
        cor,
        status,
        ...(status === "ativo" && mensalidade > 0 && proximoVencimento && { mensalidade, proximoVencimento }),
      }),
    });

    setEnviando(false);
    router.push(`/dashboard/clientes/${cliente.id}`);
    router.refresh();
  }

  async function excluir() {
    if (!confirm(`Excluir ${cliente.nome}? Isso apaga também as tarefas, cobranças, despesas, orçamentos e contratos dele. Não dá pra desfazer.`)) return;
    setExcluindo(true);
    await fetch(`/api/clientes/${cliente.id}`, { method: "DELETE" });
    router.push("/dashboard/clientes");
    router.refresh();
  }

  return (
    <Card hoverable={false} className="p-5">
      <form onSubmit={handleSubmit}>
        <Label>Nome</Label>
        <Input required value={nome} onChange={(e) => setNome(e.target.value)} className="mb-4" />

        <Label>WhatsApp</Label>
        <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="mb-4" />

        <Label>Pessoa de contato</Label>
        <Input value={contatoNome} onChange={(e) => setContatoNome(e.target.value)} className="mb-4" />

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <Label>CNPJ</Label>
            <Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
          </div>
          <div>
            <Label>Endereço</Label>
            <Input value={endereco} onChange={(e) => setEndereco(e.target.value)} />
          </div>
        </div>

        <Label>Logo do cliente</Label>
        <div className="mb-4">
          <UploadLogo value={logoUrl} onChange={setLogoUrl} />
        </div>

        <Label>Pasta no Google Drive</Label>
        <Input
          value={linkDrive}
          onChange={(e) => setLinkDrive(e.target.value)}
          placeholder="https://drive.google.com/..."
          className="mb-4"
        />

        <Label>Cor do cliente (usada em tarefas, agenda e badges)</Label>
        <div className="mb-4">
          <SeletorCor value={cor} onChange={setCor} />
        </div>

        <Label>Status</Label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="mb-4 h-10 w-full rounded-xl border border-border bg-card/60 px-3 text-sm text-text outline-none focus:border-accent/50"
        >
          <option value="lead">Lead</option>
          <option value="ativo">Ativo</option>
          <option value="avulso">Avulso (trabalho pontual, sem contrato fixo)</option>
          <option value="inativo">Inativo</option>
        </select>

        {viroAtivoAgora && (
          <div className="mb-6 rounded-xl border border-accent/20 bg-accent/5 p-3">
            <p className="mb-3 text-xs font-medium text-accent">
              Lançar uma primeira cobrança agora? (opcional)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Valor</Label>
                <CurrencyInput value={mensalidade} onChange={setMensalidade} />
              </div>
              <div>
                <Label>Vencimento</Label>
                <Input
                  type="date"
                  value={proximoVencimento}
                  onChange={(e) => setProximoVencimento(e.target.value)}
                />
              </div>
            </div>
            <p className="mt-2 text-[11px] text-muted">
              Isso só cria uma cobrança pendente pontual — não define a mensalidade do cliente. A
              mensalidade de verdade vem da aba <strong>Serviços</strong>.
            </p>
          </div>
        )}

        <Button type="submit" disabled={enviando} className="mb-3 w-full">
          {enviando ? "Salvando..." : "Salvar alterações"}
        </Button>

        <button
          type="button"
          onClick={excluir}
          disabled={excluindo}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/5 py-2.5 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-50"
        >
          <Trash2 size={14} /> {excluindo ? "Excluindo..." : "Excluir cliente"}
        </button>
      </form>
    </Card>
  );
}
