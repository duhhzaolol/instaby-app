import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterApresentacaoOrcamento } from "@/lib/apresentacaoOrcamento";
import {
  calcularItensPdfOrcamento,
  ErroSelecaoPdfOrcamento,
  formatarDataDocumentoOrcamento,
  obterMetadadosOrcamento,
  obterUrlPublicaOrcamento,
  validarSelecaoPdfOrcamento,
  type DadosPdfOrcamento,
} from "@/lib/orcamentoDocumento";
import { gerarPdfOrcamento } from "@/lib/pdfOrcamento";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const headersPrivados = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
};

function erroSeguro(erro: string, status: number) {
  return NextResponse.json({ erro }, { status, headers: headersPrivados });
}

async function exportarPdf(request: NextRequest, slug: string, personalizar: boolean) {
  try {
    let body: unknown;
    if (personalizar) {
      const tamanho = Number(request.headers.get("content-length"));
      if (Number.isFinite(tamanho) && tamanho > 128_000) {
        return erroSeguro("A seleção da proposta é muito grande.", 400);
      }
      const texto = await request.text().catch(() => null);
      if (texto === null) return erroSeguro("Confira a seleção da proposta.", 400);
      if (Buffer.byteLength(texto, "utf8") > 128_000) {
        return erroSeguro("A seleção da proposta é muito grande.", 400);
      }
      try {
        body = JSON.parse(texto);
      } catch {
        body = null;
      }
    }

    const [orcamento, configuracao] = await Promise.all([
      prisma.orcamento.findUnique({
        where: { slug },
        select: {
          id: true,
          slug: true,
          status: true,
          createdAt: true,
          dataAceite: true,
          apresentacao: true,
          cliente: {
            select: { nome: true, contatoNome: true, whatsapp: true, endereco: true },
          },
          itens: {
            select: {
              id: true,
              nomeServico: true,
              descricaoServico: true,
              quantidade: true,
              valor: true,
              servico: { select: { nome: true, descricao: true, unidade: true } },
            },
          },
        },
      }),
      prisma.configuracao.findUnique({
        where: { id: "config" },
        select: { whatsappAgencia: true, linkBioInstagram: true },
      }),
    ]);

    if (!orcamento) return erroSeguro("Orçamento não encontrado.", 404);

    const selecao = personalizar
      ? validarSelecaoPdfOrcamento(body, orcamento.itens, orcamento.status)
      : undefined;
    const itens = calcularItensPdfOrcamento(
      orcamento.itens.map((item) => ({ ...item, valor: Number(item.valor) })),
      selecao?.itens,
    );
    if (itens.length === 0) return erroSeguro("Esta proposta não possui serviços selecionados.", 400);

    const dados: DadosPdfOrcamento = {
      ...obterMetadadosOrcamento(orcamento.id, orcamento.createdAt),
      status: orcamento.status,
      aceitoEm: orcamento.dataAceite ? formatarDataDocumentoOrcamento(orcamento.dataAceite) : null,
      clienteNome: orcamento.cliente.nome,
      contatoCliente: {
        contatoNome: orcamento.cliente.contatoNome,
        telefone: orcamento.cliente.whatsapp,
        endereco: orcamento.cliente.endereco,
      },
      agencia: { instagram: configuracao?.linkBioInstagram ?? null },
      apresentacao: obterApresentacaoOrcamento(
        orcamento.apresentacao,
        orcamento.cliente.nome,
        orcamento.itens.map((item) => item.servico.unidade),
      ),
      whatsappAgencia: configuracao?.whatsappAgencia ?? null,
      urlPublica: obterUrlPublicaOrcamento(orcamento.slug),
      personalizado: selecao?.personalizado ?? false,
      itens,
    };

    const pdf = await gerarPdfOrcamento(dados);
    const nomeSeguro = dados.codigo.replace(/[^A-Za-z0-9_-]/g, "-");
    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        ...headersPrivados,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Orcamento-Instaby-${nomeSeguro}.pdf"`,
      },
    });
  } catch (erro) {
    if (erro instanceof ErroSelecaoPdfOrcamento) return erroSeguro(erro.message, erro.status);
    console.error("Não foi possível gerar o PDF do orçamento.");
    return erroSeguro("Não foi possível gerar o PDF agora. Tente novamente.", 500);
  }
}

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  return exportarPdf(request, params.slug, false);
}

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  return exportarPdf(request, params.slug, true);
}
