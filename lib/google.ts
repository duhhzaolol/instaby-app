import { google } from "googleapis";
import { inicioDaSemana } from "./semana";
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
export function urlDeAutorizacao(origin: string, lerMetadados = false, state?: string) {
  const client = clienteOAuth(origin);
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: lerMetadados ? [...ESCOPOS_GOOGLE, "https://www.googleapis.com/auth/drive.metadata.readonly"] : ESCOPOS_GOOGLE,
    include_granted_scopes: true,
    ...(state ? { state } : {}),
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
async function getGoogleAuthClient() {
  const config = await prisma.configuracao.findUnique({ where: { id: "config" } });
  if (!config?.googleDriveRefreshToken) return null;

  // origin não importa aqui — só é usado se o client precisar re-gerar uma URL
  // de autorização, o que não acontece nesse caminho (só troca token por token).
  const client = clienteOAuth("");
  client.setCredentials({ refresh_token: config.googleDriveRefreshToken });
  return client;
}

export async function getDriveClient() {
  const auth = await getGoogleAuthClient();
  return auth ? google.drive({ version: "v3", auth }) : null;
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

// Compartilhada com os cálculos de capacidade, sem carregar a API do Google.
export { inicioDaSemana } from "./semana";

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
    const raiz = await drive.files.list({ q: "name = 'Clientes' and mimeType = 'application/vnd.google-apps.folder' and 'root' in parents and trashed = false", fields: "files(id)", pageSize: 1 });
    const raizId = raiz.data.files?.[0]?.id || await criarPasta(drive, "Clientes");
    driveClienteFolderId = await criarPasta(drive, cliente.nome, raizId);
    await prisma.cliente.update({ where: { id: clienteId }, data: { driveClienteFolderId } });
  }
  if (!driveLogotiposFolderId) {
    driveLogotiposFolderId = await criarPasta(drive, NOME_PASTA_LOGOTIPOS, driveClienteFolderId);
    await prisma.cliente.update({ where: { id: clienteId }, data: { driveLogotiposFolderId } });
    await compartilharComQuemTemLink(drive, driveLogotiposFolderId, "reader");
  }
  if (!driveContratosFolderId) {
    driveContratosFolderId = await criarPasta(drive, NOME_PASTA_CONTRATOS, driveClienteFolderId);
    await prisma.cliente.update({ where: { id: clienteId }, data: { driveContratosFolderId } });
    // De propósito: nenhuma chamada a compartilharComQuemTemLink aqui. Contratos
    // nunca ganha link público — só visível por quem loga direto na conta do
    // Drive da agência.
  }
  if (!driveConteudoFolderId) {
    driveConteudoFolderId = await criarPasta(drive, NOME_PASTA_CONTEUDO, driveClienteFolderId);
    await prisma.cliente.update({ where: { id: clienteId }, data: { driveConteudoFolderId } });
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

// Garante a pasta DESSA TAREFA (dentro da pasta da semana, dentro de Conteúdo),
// criando o cliente inteiro e a pasta da semana também se for a primeira vez.
// Devolve o ID da pasta, ou null se o Drive não está conectado, a tarefa não tem
// cliente/prazo, ou algo falhou.
//
// Etapa 2 v153 — CORREÇÃO: antes (garantirPastaSemana), essa função devolvia o ID
// da pasta da SEMANA, compartilhada por TODAS as tarefas do mesmo cliente com
// prazo na mesma semana, e temVideoBruto() só checava "existe algum vídeo nessa
// pasta?" — então uma tarefa "Criar Reel" que nunca recebeu a própria gravação
// passava no teste do mesmo jeito, bastando uma tarefa IRMÃ (da mesma semana) já
// ter vídeo lá dentro. Agora cada tarefa ganha uma subpasta SÓ DELA, sempre criada
// nova (nunca reaproveitada por busca de nome — duas tarefas com título igual não
// podem cair na mesma pasta), dentro da pasta da semana. A pasta da semana
// continua existindo como "prateleira" organizacional (navegar por semana no
// Drive continua fácil), mas deixou de ser ela quem decide se uma tarefa tem
// vídeo bruto — isso agora é sempre por pasta individual.
//
// LIMITAÇÃO ASSUMIDA: tarefas antigas que já tinham driveFolderId apontando pra
// uma pasta de semana compartilhada NÃO são migradas automaticamente — a função
// devolve direto o ID já salvo (linha abaixo) sem recriar nada. Migrar sozinho
// arriscaria "perder de vista" uma gravação que já tinha sido enviada pra pasta
// antiga. Pra uma tarefa antiga específica que precise da correção, a forma
// segura é: mover o vídeo bruto de verdade pra dentro da nova pasta (depois de
// limpar o driveFolderId dela, o que faz essa função criar a pasta nova no
// próximo acesso) — ou, se não há gravação própria pra mover, usar a exceção
// justificada (Tarefa.videoBrutoExcecao) em vez de tentar reencaixar no Drive.
export async function garantirPastaTarefa(tarefaId: string): Promise<string | null> {
  const tarefa = await prisma.tarefa.findUnique({ where: { id: tarefaId } });
  if (!tarefa || !tarefa.clienteId || !tarefa.prazo) return null;
  if (tarefa.driveFolderId) return tarefa.driveFolderId;

  const drive = await getDriveClient();
  if (!drive) return null;

  const pastas = await garantirPastasCliente(tarefa.clienteId);
  if (!pastas) return null;

  const nomeSemana = nomeSemanaDe(tarefa.prazo);

  // Pasta da semana: continua compartilhada entre tarefas do mesmo cliente/semana
  // de propósito (é só uma prateleira organizacional) — procura por nome antes de
  // criar, mesma lógica de sempre, pra não duplicar pasta de semana.
  const nomeSemanaEscapado = nomeSemana.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  const buscaSemana = await drive.files.list({
    q: `'${pastas.driveConteudoFolderId}' in parents and name = '${nomeSemanaEscapado}' and trashed = false`,
    fields: "files(id)",
  });
  let pastaSemanaId: string | null | undefined = buscaSemana.data.files?.[0]?.id;
  if (!pastaSemanaId) {
    pastaSemanaId = await criarPasta(drive, nomeSemana, pastas.driveConteudoFolderId);
    await compartilharComQuemTemLink(drive, pastaSemanaId, "writer");
  }

  // Subpasta da tarefa em si — sempre CRIADA (nunca buscada por nome), e
  // persistida no banco antes de qualquer uso futuro: é o driveFolderId salvo que
  // garante idempotência daqui pra frente (a próxima chamada já devolve direto na
  // primeira linha da função, sem tocar no Drive de novo).
  const nomeTarefa = `${tarefa.titulo} (${tarefa.id.slice(0, 8)})`.slice(0, 200);
  const pastaTarefaId = await criarPasta(drive, nomeTarefa, pastaSemanaId);
  await compartilharComQuemTemLink(drive, pastaTarefaId, "writer");

  await prisma.tarefa.update({ where: { id: tarefaId }, data: { driveFolderId: pastaTarefaId } });

  return pastaTarefaId;
}

// Existe algum arquivo de vídeo dentro dessa pasta? Usado pra travar tarefas de
// "Criar Reel" até o vídeo bruto ser colocado lá (pelo admin, direto no Drive).
export type VerificacaoVideoBruto = { temBruto: boolean | null; mensagem: string; acessoLimitado?: boolean; arquivoNome?: string };

export async function verificarVideoBrutoNoDrive(folderId: string): Promise<VerificacaoVideoBruto> {
  const auth = await getGoogleAuthClient();
  if (!auth) return { temBruto: null, mensagem: "Conecte o Google Drive da agência em Configurações para verificar os arquivos." };
  const drive = google.drive({ version: "v3", auth });
  const fila = [folderId];
  const visitadas = new Set<string>();
  while (fila.length) {
    const pasta = fila.shift()!;
    if (visitadas.has(pasta)) continue;
    if (visitadas.size >= 50) return { temBruto: null, mensagem: "A pasta tem muitas subpastas. Separe o material bruto numa subpasta mais próxima da tarefa e verifique novamente." };
    visitadas.add(pasta);
    let pageToken: string | undefined;
    let paginas = 0;
    do {
      if (++paginas > 20) return { temBruto: null, mensagem: "A pasta tem muitos arquivos para uma verificação rápida. Separe o material bruto numa subpasta da tarefa." };
      const id = pasta.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
      const res = await drive.files.list({ q: `'${id}' in parents and trashed = false`, fields: "nextPageToken,files(id,name,mimeType,shortcutDetails)", pageSize: 100, pageToken, supportsAllDrives: true, includeItemsFromAllDrives: true }, { timeout: 12000 });
      for (const file of res.data.files || []) {
        const tipo = file.mimeType || "";
        const alvo = file.shortcutDetails?.targetMimeType || "";
        if (tipo.startsWith("video/") || alvo.startsWith("video/") || /\.(mp4|mov|m4v|avi|mkv|webm|mts|m2ts|mpeg|mpg)$/i.test(file.name || "")) return { temBruto: true, arquivoNome: file.name || "Vídeo", mensagem: `Vídeo encontrado: ${file.name || "arquivo de vídeo"}.` };
        if (tipo === "application/vnd.google-apps.folder" && file.id) fila.push(file.id);
        if (alvo === "application/vnd.google-apps.folder" && file.shortcutDetails?.targetId) fila.push(file.shortcutDetails.targetId);
      }
      pageToken = res.data.nextPageToken || undefined;
    } while (pageToken);
  }
  const token = await auth.getAccessToken();
  const info = token.token ? await auth.getTokenInfo(token.token) : null;
  const leMetadados = info?.scopes.some(s => ["https://www.googleapis.com/auth/drive.metadata.readonly", "https://www.googleapis.com/auth/drive.readonly", "https://www.googleapis.com/auth/drive"].includes(s));
  if (!leMetadados) return { temBruto: null, acessoLimitado: true, mensagem: "A autorização atual do Google não permite confirmar os arquivos enviados diretamente pelo site do Drive. O resultado é inconclusivo; confira a pasta pelo botão Abrir pasta." };
  return { temBruto: false, mensagem: "Nenhum vídeo encontrado nesta pasta ou nas subpastas verificadas." };
}

export async function temVideoBruto(folderId: string): Promise<boolean> {
  return (await verificarVideoBrutoNoDrive(folderId)).temBruto === true;
}
