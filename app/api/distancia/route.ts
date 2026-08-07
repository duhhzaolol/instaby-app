import { NextRequest, NextResponse } from "next/server";

const ORIGEM = "Araras, SP, Brasil";

async function geocodificar(local: string) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(local)}`;
  const resposta = await fetch(url, {
    headers: { "User-Agent": "instaby-app (uso interno agencia)" },
  });
  const dados = await resposta.json();
  if (!dados || dados.length === 0) return null;
  return { lat: parseFloat(dados[0].lat), lon: parseFloat(dados[0].lon) };
}

export async function GET(request: NextRequest) {
  const destino = request.nextUrl.searchParams.get("destino");

  if (!destino) {
    return NextResponse.json({ erro: "Informe a cidade de destino" }, { status: 400 });
  }

  try {
    const [origemGeo, destinoGeo] = await Promise.all([
      geocodificar(ORIGEM),
      geocodificar(`${destino}, Brasil`),
    ]);

    if (!origemGeo || !destinoGeo) {
      return NextResponse.json({ erro: "Não consegui localizar essa cidade — confere o nome ou digita a distância manualmente." }, { status: 404 });
    }

    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${origemGeo.lon},${origemGeo.lat};${destinoGeo.lon},${destinoGeo.lat}?overview=false`;
    const rotaResposta = await fetch(osrmUrl);
    const rota = await rotaResposta.json();

    if (!rota.routes || rota.routes.length === 0) {
      return NextResponse.json({ erro: "Não consegui calcular a rota — digita a distância manualmente." }, { status: 404 });
    }

    const kmIda = rota.routes[0].distance / 1000;

    return NextResponse.json({
      origem: ORIGEM,
      destino,
      kmIda: Math.round(kmIda * 10) / 10,
    });
  } catch {
    return NextResponse.json({ erro: "Erro ao calcular a distância — digita manualmente." }, { status: 500 });
  }
}
