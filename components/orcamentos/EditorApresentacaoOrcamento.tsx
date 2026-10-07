"use client";

import { useId } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { apresentacaoPadrao, limitesCondicoesOrcamento, type ApresentacaoOrcamento, type CondicoesOrcamento } from "@/lib/apresentacaoOrcamento";

export type MudancaApresentacao = { tipoEscolhido?: boolean };

export function EditorApresentacaoOrcamento({
  apresentacao,
  clienteNome,
  onChange,
  disabled = false,
}: {
  apresentacao: ApresentacaoOrcamento;
  clienteNome: string;
  onChange: (valor: ApresentacaoOrcamento, mudanca?: MudancaApresentacao) => void;
  disabled?: boolean;
}) {
  const prefixo = useId();

  function alterar(campo: Exclude<keyof ApresentacaoOrcamento, "condicoes">, valor: string) {
    onChange(
      { ...apresentacao, [campo]: valor },
      campo === "tipo" ? { tipoEscolhido: true } : undefined
    );
  }

  function alterarCondicao(campo: keyof CondicoesOrcamento, valor: string) {
    onChange({
      ...apresentacao,
      condicoes: {
        pagamento: "",
        prazoEntrega: "",
        observacoes: "",
        ...apresentacao.condicoes,
        [campo]: valor,
      },
    });
  }

  return (
    <fieldset disabled={disabled} className="min-w-0 space-y-4">
      <legend className="mb-1 text-sm font-medium text-text">Apresentação e condições</legend>
      <p className="text-xs leading-relaxed text-muted">
        Edite os textos que aparecem no início deste orçamento. A prévia acompanha as alterações.
        Os campos opcionais podem ficar em branco.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-auto min-h-8 whitespace-normal py-2 text-left"
          onClick={() => onChange({
            ...apresentacao,
            selo: "Cobertura de evento",
            titulo: "Seu evento,",
            destaque: "registrado em cada detalhe.",
            complemento: "",
            descricao: `Uma proposta de cobertura de evento para ${clienteNome}.`,
            tipo: "pontual",
          }, { tipoEscolhido: true })}
        >
          Cobertura de evento
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-auto min-h-8 whitespace-normal py-2 text-left"
          onClick={() => onChange({ ...apresentacao, ...apresentacaoPadrao(clienteNome), tipo: "mensal" }, { tipoEscolhido: true })}
        >
          Modelo de gestão mensal
        </Button>
      </div>

      <div>
        <Label htmlFor={`${prefixo}-selo`}>Texto acima do título (opcional)</Label>
        <Input
          id={`${prefixo}-selo`}
          value={apresentacao.selo}
          maxLength={80}
          onChange={(e) => alterar("selo", e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor={`${prefixo}-titulo`}>Título</Label>
        <Input
          id={`${prefixo}-titulo`}
          value={apresentacao.titulo}
          required
          maxLength={160}
          onChange={(e) => alterar("titulo", e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor={`${prefixo}-destaque`}>Texto em destaque (opcional)</Label>
        <Input
          id={`${prefixo}-destaque`}
          value={apresentacao.destaque}
          maxLength={200}
          onChange={(e) => alterar("destaque", e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor={`${prefixo}-complemento`}>Complemento (opcional)</Label>
        <Input
          id={`${prefixo}-complemento`}
          value={apresentacao.complemento}
          maxLength={100}
          onChange={(e) => alterar("complemento", e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor={`${prefixo}-descricao`}>Descrição (opcional)</Label>
        <Textarea
          id={`${prefixo}-descricao`}
          value={apresentacao.descricao}
          rows={4}
          maxLength={1200}
          onChange={(e) => alterar("descricao", e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor={`${prefixo}-tipo`}>Tipo de proposta</Label>
        <Select
          id={`${prefixo}-tipo`}
          value={apresentacao.tipo}
          onChange={(e) => alterar("tipo", e.target.value)}
        >
          <option value="pontual">Serviço pontual</option>
          <option value="mensal">Mensal</option>
        </Select>
      </div>
      <div className="space-y-4 border-t border-border pt-5">
        <div>
          <h3 className="text-sm font-medium text-text">Condições deste orçamento</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Informe o combinado com este cliente. Os campos são opcionais e aparecem antes do aceite.
          </p>
        </div>
        <div>
          <Label htmlFor={`${prefixo}-pagamento`}>Pagamento (opcional)</Label>
          <Textarea
            id={`${prefixo}-pagamento`}
            value={apresentacao.condicoes?.pagamento ?? ""}
            rows={4}
            maxLength={limitesCondicoesOrcamento.pagamento}
            aria-describedby={`${prefixo}-pagamento-ajuda`}
            onChange={(e) => alterarCondicao("pagamento", e.target.value)}
          />
          <p id={`${prefixo}-pagamento-ajuda`} className="mt-1 text-xs leading-relaxed text-muted">
            Descreva entrada, parcelas, vencimentos e forma de pagamento, se houver.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-2 h-auto min-h-8 whitespace-normal py-2 text-left"
            onClick={() => alterarCondicao("pagamento", "30% na reserva da data e 70% no dia do evento.")}
          >
            Usar exemplo: 30% na reserva + 70% no evento
          </Button>
        </div>
        <div>
          <Label htmlFor={`${prefixo}-prazo-entrega`}>Prazo de entrega (opcional)</Label>
          <Textarea
            id={`${prefixo}-prazo-entrega`}
            value={apresentacao.condicoes?.prazoEntrega ?? ""}
            rows={3}
            maxLength={limitesCondicoesOrcamento.prazoEntrega}
            onChange={(e) => alterarCondicao("prazoEntrega", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor={`${prefixo}-observacoes`}>Observações (opcional)</Label>
          <Textarea
            id={`${prefixo}-observacoes`}
            value={apresentacao.condicoes?.observacoes ?? ""}
            rows={4}
            maxLength={limitesCondicoesOrcamento.observacoes}
            onChange={(e) => alterarCondicao("observacoes", e.target.value)}
          />
        </div>
      </div>
    </fieldset>
  );
}
