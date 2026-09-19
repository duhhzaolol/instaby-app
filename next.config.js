/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cabeçalhos de segurança aplicados em toda resposta — reforçam o que o
  // navegador já faz por padrão, mas fecham brechas específicas: clickjacking
  // (alguém colocar seu painel dentro de um <iframe> escondido em outro site),
  // MIME-sniffing (o navegador "adivinhar" um tipo de arquivo perigoso) e
  // vazamento de URL completa (com tokens/ids) pro site de destino ao clicar
  // num link. A Vercel já força HTTPS automaticamente; o Strict-Transport-Security
  // abaixo reforça isso, dizendo pro navegador nunca tentar HTTP nesse domínio.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
