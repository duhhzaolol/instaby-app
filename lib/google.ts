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
