import { PrismaClient, Prisma } from "@prisma/client";

// Todo campo de dinheiro no banco (valor, valorUnitario, descontoMensal etc.)
// é do tipo Decimal do Prisma — não um number comum do JavaScript. Por padrão,
// quando uma rota de API devolve um registro assim direto (ex: depois de criar
// ou editar algo), o Decimal vira uma STRING no JSON (ex: "150.00" em vez de
// 150), porque é assim que esse tipo se serializa sozinho. A tela então recebe
// esse valor como texto e quebra na hora de fazer conta ou de formatar com
// ".toFixed()" — foi exatamente isso que causou o erro ao adicionar um serviço
// contratado (funcionava depois de atualizar a página porque aí o valor vem
// convertido corretamente; quebrava só na hora, com o dado "fresco" da resposta
// da API). Esse ajuste corrige na raiz, pra qualquer tela, agora e no futuro:
// faz todo Decimal virar um number de verdade sempre que uma rota responde.
// @ts-ignore — sobrescrevendo de propósito o comportamento padrão de serialização do Decimal
Prisma.Decimal.prototype.toJSON = function () {
  return this.toNumber();
};

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
