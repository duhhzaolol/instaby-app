import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { visualDaCategoria } from "@/lib/categoriaVisual";
import { AjudaContextual } from "@/components/ui/AjudaContextual";

export default async function ServicosPage() {
  const servicos = await prisma.servico.findMany({
    orderBy: [{ categoria: "asc" }, { nome: "asc" }],
  });

  const categorias = Array.from(new Set(servicos.map((s) => s.categoria)));
  const semValorQtd = servicos.filter((s) => Number(s.valorUnitario) <= 0).length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-lg font-medium text-text">
            Catálogo de serviços
            <AjudaContextual
              titulo="Catálogo de serviços"
              texto="A lista de serviços que a Instaby oferece, com valor unitário. É a partir daqui que você monta orçamentos e contratos de clientes."
              exemplo="Ex.: cadastre 'Edição de vídeo' com o valor padrão, e reutilize em qualquer orçamento."
            />
          </p>
          <p className="text-sm text-muted">A base pra montar qualquer orçamento em pílulas</p>
        </div>
        <Link href="/dashboard/servicos/novo">
          <Button size="sm">
            <Plus size={14} /> Novo serviço
          </Button>
        </Link>
      </div>

      {semValorQtd > 0 && (
        <div className="mb-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5">
          <p className="text-xs text-amber-200">
            {semValorQtd} serviço(s) sem valor definido (R$ 0) — destacados em laranja abaixo. Clica pra preencher.
          </p>
        </div>
      )}

      {servicos.length === 0 && (
        <p className="text-sm text-muted">
          Nenhum serviço cadastrado ainda — cadastre o primeiro pra poder montar orçamentos.
        </p>
      )}

      {categorias.map((cat) => {
        const { icone: Icon, cor } = visualDaCategoria(cat);
        return (
          <div key={cat} className="mb-6">
            <p className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted">
              {cat}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {servicos
                .filter((s) => s.categoria === cat)
                .map((s, i) => {
                  const semValor = Number(s.valorUnitario) <= 0;
                  return (
                    <Link key={s.id} href={`/dashboard/servicos/${s.id}/editar`}>
                      <Card
                        index={i}
                        className="flex items-center gap-3 p-4"
                        style={semValor ? { borderColor: "rgba(245,158,11,0.3)" } : undefined}
                      >
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                          style={{ backgroundColor: `${cor}1A`, color: cor }}
                        >
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-text">{s.nome}</p>
                          <p className="truncate text-xs text-muted">{s.descricao}</p>
                        </div>
                        {semValor ? (
                          <span className="shrink-0 whitespace-nowrap rounded-full bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-400">
                            Sem valor
                          </span>
                        ) : (
                          <span className="shrink-0 whitespace-nowrap text-sm text-text">
                            R$ {Number(s.valorUnitario).toFixed(0)}
                            <span className="text-xs text-muted">/{s.unidade}</span>
                          </span>
                        )}
                      </Card>
                    </Link>
                  );
                })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
