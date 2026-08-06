"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { Button } from "@/components/ui/Button";

type Cliente = {
  id: string;
  nome: string;
  whatsapp: string;
  cnpj: string;
  contatoNome: string;
  endereco: string;
  status: string;
};

export default function EditarClienteForm({ cliente }: { cliente: Cliente }) {
  const router = useRouter();
  const [nome, setNome] = useState(cliente.nome);
  const [whatsapp, setWhatsapp] = useState(cliente.whatsapp);
  const [cnpj, setCnpj] = useState(cliente.cnpj);
  const [contatoNome, setContatoNome] = useState(cliente.contatoNome);
  const [endereco, setEndereco] = useState(cliente.endereco);
  const [status, setStatus] = useState(cliente.status);
  const [mensalidade, setMensalidade] = useState(0);
  const [proximoVencimento, setProximoVencimento] = useState("");
  const [enviando, setEnviando] = useState(false);

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
        status,
        ...(status === "ativo" && mensalidade > 0 && proximoVencimento && { mensalidade, proximoVencimento }),
      }),
    });

    setEnviando(false);
    router.push(`/dashboard/clientes/${cliente.id}`);
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

        <Label>Status</Label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="mb-4 h-10 w-full rounded-xl border border-border bg-card/60 px-3 text-sm text-text outline-none focus:border-accent/50"
        >
          <option value="lead">Lead</option>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        </select>

        {viroAtivoAgora && (
          <div className="mb-6 rounded-xl border border-accent/20 bg-accent/5 p-3">
            <p className="mb-3 text-xs font-medium text-accent">
              Ativando agora — configure a cobrança recorrente (opcional)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Mensalidade</Label>
                <CurrencyInput value={mensalidade} onChange={setMensalidade} />
              </div>
              <div>
                <Label>Próximo vencimento</Label>
                <Input
                  type="date"
                  value={proximoVencimento}
                  onChange={(e) => setProximoVencimento(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        <Button type="submit" disabled={enviando} className="w-full">
          {enviando ? "Salvando..." : "Salvar alterações"}
        </Button>
      </form>
    </Card>
  );
}
