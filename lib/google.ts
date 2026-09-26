import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

// Uma conexão só, pra agência inteira (não é por membro da equipe) — guardada
// na linha única de Configuracao. O fluxo (pedir acesso, receber de volta,
// guardar) fica em app/api/google/conectar e app/api/google/callback; aqui só
// o que qualquer rota futura vai precisar reaproveitar: montar o client OAuth
// e devolver um client do Drive já autenticado (ou null, se ainda não conectou).

const ESCOPOS_GOOGLE = ["https://www.googleapis.com/auth/drive.file"];

// A URL de callback precisa bater com uma das cadastradas no Google Cloud
// (Credenciais > esse cliente OAuth > URIs de redirecionamento). Construída a
// partir da própria requisição — assim funciona tanto no domínio .vercel.app
// de hoje quanto num domínio próprio depois, sem precisar mudar código, desde
// que o novo domínio também esteja cadastrado lá no Google Cloud.
export function redirectUriDe(origin: string) {
  return `${origin}/api/google/callback`;
}

function clienteOAuth(origin: string) {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUriDe(origin)
  );
}

// Link pro qual mandar a pessoa pra autorizar. `prompt: "consent"` força o
// Google a sempre devolver um refresh_token novo, mesmo numa reconexão — sem
// isso, numa segunda autorização o Google às vezes só devolve o access_token
// (de curta duração) e omite o refresh_token, achando que você já tem um.
export function urlDeAutorizacao(origin: string) {
  const client = clienteOAuth(origin);
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ESCOPOS_GOOGLE,
  });
}

export async function trocarCodigoPorTokens(origin: string, code: string) {
  const client = clienteOAuth(origin);
  const { tokens } = await client.getToken(code);
  return tokens;
}

// Client do Drive pronto pra usar, autenticado com o refresh_token guardado —
// ou null se a agência ainda não conectou o Drive. O client renova o
// access_token sozinho (biblioteca do Google cuida disso) a cada chamada.
export async function getDriveClient() {
  const config = await prisma.configuracao.findUnique({ where: { id: "config" } });
  if (!config?.googleDriveRefreshToken) return null;

  // origin não importa aqui — só é usado se o client precisar re-gerar uma URL
  // de autorização, o que não acontece nesse caminho (só troca token por token).
  const client = clienteOAuth("");
  client.setCredentials({ refresh_token: config.googleDriveRefreshToken });
  return google.drive({ version: "v3", auth: client });
}

// ---------------------------------------------------------------------------
// Automação de pastas por cliente — cada cliente ganha uma pasta raiz com 3
// subpastas fixas (Logotipos, Contratos, Conteúdo). Tudo criado sob demanda (só
// quando alguém abre a aba Arquivos de um cliente, ou quando a 1ª tarefa de mídia
// dele é criada), nunca em massa. Logotipos e Conteúdo ganham permissão "qualquer
// um com o link" (pra ninguém da equipe precisar de conta Google própria);
// Contratos nunca ganha essa permissão — fica só na conta do Drive da agência.
// ---------------------------------------------------------------------------

const NOME_PASTA_LOGOTIPOS = "Logotipos";
const NOME_PASTA_CONTRATOS = "Contratos";
const NOME_PASTA_CONTEUDO = "Conteúdo";

async function criarPasta(drive: any, nome: string, paiId?: string): Promise<string> {
  const res = await drive.files.create({
    requestBody: {
      name: nome,
      mimeType: "application/vnd.google-apps.folder",
      ...(paiId ? { parents: [paiId] } : {}),
    },
    fields: "id",
  });
  return res.data.id as string;
}

// Best-effort de propósito: se der erro ao compartilhar, a pasta continua criada
// e utilizável pela agência — só quem não tem conta própria no Drive é que não
// vai conseguir abrir o link até isso funcionar numa próxima tentativa.
async function compartilharComQuemTemLink(drive: any, folderId: string, role: "reader" | "writer") {
  try {
    await drive.permissions.create({ fileId: folderId, requestBody: { role, type: "anyone" } });
  } catch (e) {
    console.error("Erro ao compartilhar pasta do Drive por link:", e);
  }
}

// Link direto de uma pasta do Drive pelo ID — dispensa uma chamada à API só pra
// pegar o webViewLink, já que a URL segue sempre esse mesmo formato.
export function linkDaPasta(folderId: string) {
  return `https://drive.google.com/drive/folders/${folderId}`;
}

function inicioDaSemana(data: Date): Date {
  const d = new Date(data);
  const dia = d.getDay(); // 0 = domingo
  const diff = dia === 0 ? -6 : 1 - dia; // volta pra segunda-feira
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Nome de pasta por faixa de dias (semana de segunda a domingo) em vez de "semana
// N" — evita a ambiguidade de numeração que confunde quando a semana cai no meio
// de dois meses (ex: "semana 4 que já tá indo pra 5").
export function nomeSemanaDe(data: Date): string {
  const inicio = inicioDaSemana(data);
  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + 6);
  const dia = (d: Date) => String(d.getDate()).padStart(2, "0");
  const mes = (d: Date) => d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
  if (inicio.getMonth() === fim.getMonth()) {
    return `Semana ${dia(inicio)}–${dia(fim)} ${mes(fim)}`;
  }
  return `Semana ${dia(inicio)} ${mes(inicio)} – ${dia(fim)} ${mes(fim)}`;
}

type PastasCliente = {
  driveClienteFolderId: string;
  driveLogotiposFolderId: string;
  driveContratosFolderId: string;
  driveConteudoFolderId: string;
};

// Garante que o cliente tem as 4 pastas (cria só as que ainda faltarem — idempotente,
// seguro de chamar toda vez). Devolve null se o Drive da agência não está conectado.
export async function garantirPastasCliente(clienteId: string): Promise<PastasCliente | null> {
  const drive = await getDriveClient();
  if (!drive) return null;

  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
  if (!cliente) return null;

  let { driveClienteFolderId, driveLogotiposFolderId, driveContratosFolderId, driveConteudoFolderId } = cliente;

  if (!driveClienteFolderId) {
    driveClienteFolderId = await criarPasta(drive, cliente.nome);
  }
  if (!driveLogotiposFolderId) {
    driveLogotiposFolderId = await criarPasta(drive, NOME_PASTA_LOGOTIPOS, driveClienteFolderId);
    await compartilharComQuemTemLink(drive, driveLogotiposFolderId, "reader");
  }
  if (!driveContratosFolderId) {
    driveContratosFolderId = await criarPasta(drive, NOME_PASTA_CONTRATOS, driveClienteFolderId);
    // De propósito: nenhuma chamada a compartilharComQuemTemLink aqui. Contratos
    // nunca ganha link público — só visível por quem loga direto na conta do
    // Drive da agência.
  }
  if (!driveConteudoFolderId) {
    driveConteudoFolderId = await criarPasta(drive, NOME_PASTA_CONTEUDO, driveClienteFolderId);
    await compartilharComQuemTemLink(drive, driveConteudoFolderId, "reader");
  }

  const pastas: PastasCliente = {
    driveClienteFolderId,
    driveLogotiposFolderId,
    driveContratosFolderId,
    driveConteudoFolderId,
  };

  await prisma.cliente.update({ where: { id: clienteId }, data: pastas });

  return pastas;
}

// Garante a pasta da semana (dentro de Conteúdo) da tarefa informada, criando o
// cliente inteiro se for a primeira vez. Devolve o ID da pasta, ou null se o
// Drive não está conectado, a tarefa não tem cliente/prazo, ou algo falhou.
export async function garantirPastaSemana(tarefaId: string): Promise<string | null> {
  const tarefa = await prisma.tarefa.findUnique({ where: { id: tarefaId } });
  if (!tarefa || !tarefa.clienteId || !tarefa.prazo) return null;
  if (tarefa.driveFolderId) return tarefa.driveFolderId;

  const drive = await getDriveClient();
  if (!drive) return null;

  const pastas = await garantirPastasCliente(tarefa.clienteId);
  if (!pastas) return null;

  const nome = nomeSemanaDe(tarefa.prazo);

  // Procura por nome antes de criar — se outra tarefa da mesma semana já criou
  // essa pasta primeiro, reaproveita em vez de duplicar.
  const nomeEscapado = nome.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  const busca = await drive.files.list({
    q: `'${pastas.driveConteudoFolderId}' in parents and name = '${nomeEscapado}' and trashed = false`,
    fields: "files(id)",
  });
  let folderId: string | null | undefined = busca.data.files?.[0]?.id;

  if (!folderId) {
    folderId = await criarPasta(drive, nome, pastas.driveConteudoFolderId);
    await compartilharComQuemTemLink(drive, folderId, "writer");
  }

  await prisma.tarefa.update({ where: { id: tarefaId }, data: { driveFolderId: folderId } });

  return folderId;
}

// Existe algum arquivo de vídeo dentro dessa pasta? Usado pra travar tarefas de
// "Criar Reel" até o vídeo bruto ser colocado lá (pelo admin, direto no Drive).
export async function temVideoBruto(folderId: string): Promise<boolean> {
  const drive = await getDriveClient();
  if (!drive) return false;
  const res = await drive.files.list({
    q: `'${folderId}' in parents and mimeType contains 'video/' and trashed = false`,
    fields: "files(id)",
    pageSize: 1,
  });
  return (res.data.files?.length || 0) > 0;
}
