// Somente logos enviados pelo cadastro da agência podem ser buscados pelo servidor.
// Nunca segue redirecionamentos nem usa cookies/credenciais do aplicativo.
const LIMITE_LOGO = 2 * 1024 * 1024;
let cache: { url: string; ate: number; bytes: Promise<Uint8Array | null> } | undefined;

function dimensoesJpeg(bytes: Buffer): { largura: number; altura: number } | null {
  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 255) return null;
    while (offset < bytes.length && bytes[offset] === 255) offset++;
    const marcador = bytes[offset++];
    if (marcador === 217 || marcador === 218) break;
    if (marcador === 1 || (marcador >= 208 && marcador <= 215)) continue;
    if (offset + 2 > bytes.length) return null;
    const tamanho = bytes.readUInt16BE(offset);
    if (tamanho < 2 || offset + tamanho > bytes.length) return null;
    if ([192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207].includes(marcador)) {
      if (tamanho < 8) return null;
      return { altura: bytes.readUInt16BE(offset + 3), largura: bytes.readUInt16BE(offset + 5) };
    }
    offset += tamanho;
  }
  return null;
}

export async function carregarLogoDocumento(endereco?: string): Promise<Uint8Array | null> {
  if (!endereco || endereco === "/logo.png") return null;
  let url: URL;
  try { url = new URL(endereco); } catch { return null; }
  if (url.protocol !== "https:" || url.username || url.password || url.port ||
      !/^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/i.test(url.hostname) ||
      !url.pathname.startsWith("/logos-agencia/")) return null;
  if (cache?.url === url.href && cache.ate > Date.now()) return cache.bytes;
  const bytes = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      const resposta = await fetch(url.href, { redirect: "error", signal: controller.signal, cache: "no-store" });
      if (!resposta.ok || !resposta.body || Number(resposta.headers.get("content-length")) > LIMITE_LOGO) return null;
      const reader = resposta.body.getReader();
      const partes: Uint8Array[] = [];
      let tamanho = 0;
      while (true) {
        const parte = await reader.read();
        if (parte.done) break;
        tamanho += parte.value.byteLength;
        if (tamanho > LIMITE_LOGO) { await reader.cancel(); return null; }
        partes.push(parte.value);
      }
      const arquivo = Buffer.concat(partes);
      const png = arquivo.length > 24 && arquivo.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      const jpg = arquivo.length > 3 && arquivo[0] === 255 && arquivo[1] === 216 && arquivo[2] === 255;
      const dimensoes = png ? { largura: arquivo.readUInt32BE(16), altura: arquivo.readUInt32BE(20) } : jpg ? dimensoesJpeg(arquivo) : null;
      if (!dimensoes || dimensoes.largura < 1 || dimensoes.altura < 1 || dimensoes.largura > 8000 || dimensoes.altura > 8000 || dimensoes.largura * dimensoes.altura > 16_000_000) return null;
      return arquivo;
    } catch { return null; } finally { clearTimeout(timeout); }
  })();
  cache = { url: url.href, ate: Date.now() + 5 * 60_000, bytes };
  return bytes;
}
