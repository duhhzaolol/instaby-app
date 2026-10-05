-- Apenas tabelas novas. Nenhuma tarefa, data ou estado existente é alterado.
CREATE TABLE IF NOT EXISTS "CronogramaCliente" (
  "id" TEXT NOT NULL,
  "clienteId" TEXT NOT NULL,
  "mes" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CronogramaCliente_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CronogramaCliente_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "CronogramaCliente_token_key" ON "CronogramaCliente"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "CronogramaCliente_clienteId_mes_key" ON "CronogramaCliente"("clienteId", "mes");

CREATE TABLE IF NOT EXISTS "PautaCronograma" (
  "id" TEXT NOT NULL,
  "cronogramaId" TEXT NOT NULL,
  "tarefaId" TEXT,
  "titulo" TEXT NOT NULL,
  "formato" TEXT NOT NULL,
  "dataPrevista" TEXT NOT NULL,
  "textoCliente" TEXT NOT NULL,
  "visivel" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PautaCronograma_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PautaCronograma_cronogramaId_fkey" FOREIGN KEY ("cronogramaId") REFERENCES "CronogramaCliente"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PautaCronograma_tarefaId_fkey" FOREIGN KEY ("tarefaId") REFERENCES "Tarefa"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "PautaCronograma_cronogramaId_tarefaId_key" ON "PautaCronograma"("cronogramaId", "tarefaId");
CREATE INDEX IF NOT EXISTS "PautaCronograma_cronogramaId_visivel_idx" ON "PautaCronograma"("cronogramaId", "visivel");

CREATE TABLE IF NOT EXISTS "ComentarioPauta" (
  "id" TEXT NOT NULL,
  "pautaId" TEXT NOT NULL,
  "autor" TEXT NOT NULL,
  "texto" TEXT NOT NULL,
  "origem" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ComentarioPauta_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ComentarioPauta_pautaId_fkey" FOREIGN KEY ("pautaId") REFERENCES "PautaCronograma"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "ComentarioPauta_pautaId_createdAt_idx" ON "ComentarioPauta"("pautaId", "createdAt");
