-- Alteração aditiva: mantém todos os registros e valores já existentes.
ALTER TABLE "Cliente" ADD COLUMN IF NOT EXISTS "cobrancaRecorrenteAtiva" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Cliente" ADD COLUMN IF NOT EXISTS "cobrancaRecorrenteInicio" TEXT;
ALTER TABLE "Cliente" ADD COLUMN IF NOT EXISTS "cobrancaDiaVencimento" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "Cobranca" ADD COLUMN IF NOT EXISTS "recorrenciaChave" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Cobranca_recorrenciaChave_key" ON "Cobranca"("recorrenciaChave");
