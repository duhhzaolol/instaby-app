export function removerFundoSolido(imagem: HTMLImageElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = imagem.naturalWidth;
  canvas.height = imagem.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(imagem, 0, 0);

  const { width, height } = canvas;
  const dados = ctx.getImageData(0, 0, width, height);
  const px = dados.data;

  function pixelEm(x: number, y: number) {
    const i = (y * width + x) * 4;
    return [px[i], px[i + 1], px[i + 2]] as const;
  }

  // Amostra os 4 cantos pra descobrir a cor de fundo
  const cantos = [pixelEm(1, 1), pixelEm(width - 2, 1), pixelEm(1, height - 2), pixelEm(width - 2, height - 2)];
  const [r0, g0, b0] = cantos[0];

  const cantosParecidos = cantos.every(([r, g, b]) => Math.abs(r - r0) + Math.abs(g - g0) + Math.abs(b - b0) < 45);

  if (!cantosParecidos) {
    // Fundo não é uniforme (foto, gradiente) — não mexe, devolve original
    return canvas.toDataURL("image/png");
  }

  const tolerancia = 60;
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i];
    const g = px[i + 1];
    const b = px[i + 2];
    const distancia = Math.abs(r - r0) + Math.abs(g - g0) + Math.abs(b - b0);
    if (distancia < tolerancia) {
      px[i + 3] = 0;
    } else if (distancia < tolerancia + 40) {
      // suaviza a borda do recorte
      px[i + 3] = Math.round((px[i + 3] * (distancia - tolerancia)) / 40);
    }
  }

  ctx.putImageData(dados, 0, 0);
  return canvas.toDataURL("image/png");
}

export function dataUrlParaFile(dataUrl: string, nomeArquivo: string): File {
  const [cabecalho, base64] = dataUrl.split(",");
  const mime = cabecalho.match(/:(.*?);/)?.[1] || "image/png";
  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return new File([bytes], nomeArquivo, { type: mime });
}
