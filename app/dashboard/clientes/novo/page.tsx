"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function NovoClientePage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [contatoNome, setContatoNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [status, setStatus] = useState("lead");
  const [mensalidade, setMensalidade] = useState("");
  const [proximoVencimento, setProximoVencimento] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);

    const resposta = await fetch("/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome,
        whatsapp,
        cnpj,
        contatoNome,
        endereco,
        status,
        ...(status === "ativo" && { mensalidade, proximoVencimento }),
      }),
    });

    setEnviando(false);

    if (resposta.ok) {
      router.push("/dashboard/clientes");
      router.refresh();
    }
  }

  return (
    <div className="max-w-md">
      <p className="mb-5 text-lg font-medium text-text">Novo cliente</p>

      <Card hoverable={false} className="p-5">
        <form onSubmit={handleSubmit}>
          <Label>Nome</Label>
          <Input required value={nome} onChange={(e) => setNome(e.target.value)} className="mb-4" />

          <Label>WhatsApp</Label>
          <Input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="(19) 99999-9999"
            className="mb-4"
          />

          <Label>Pessoa de contato</Label>
          <Input
            value={contatoNome}
            onChange={(e) => setContatoNome(e.target.value)}
            placeholder="Quem você fala lá"
            className="mb-4"
          />

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

          {status === "ativo" && (
            <div className="mb-6 rounded-xl border border-accent/20 bg-accent/5 p-3">
              <p className="mb-3 text-xs font-medium text-accent">
                Ativando — configure a cobrança recorrente
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Mensalidade (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={mensalidade}
                    onChange={(e) => setMensalidade(e.target.value)}
                    placeholder="800"
                  />
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
              <p className="mt-2 text-[11px] text-muted">
                Isso cria a primeira cobrança pendente. Pagamentos de meses anteriores você lança
                depois, na aba Financeiro do cliente.
              </p>
            </div>
          )}

          <Button type="submit" disabled={enviando} className="w-full">
            {enviando ? "Salvando..." : "Salvar cliente"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
