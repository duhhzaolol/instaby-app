import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual } from "@/lib/permissoes";

// Configurações pessoais — DIFERENTE de /api/equipe/[id] (que é gerenciarEquipe
// mexendo em outra pessoa): aqui é qualquer pessoa logada mexendo só na própria
// conta. Importante (proteção contra IDOR): o alvo é SEMPRE usuario.id vindo da
// sessão, nunca um id que viesse do corpo da requisição — ninguém consegue
// editar o perfil de outra pessoa mandando um id diferente.
export async function PATCH(request: NextRequest) {
  const usuario = await getUsuarioAtual();
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const body = await request.json();
  const data: Record<string, unknown> = {};

  if (body.nome !== undefined) {
    if (!body.nome.trim()) return NextResponse.json({ erro: "Nome não pode ficar em branco" }, { status: 400 });
    data.nome = body.nome.trim();
  }

  if (body.email !== undefined) {
    const emailNovo = String(body.email).trim().toLowerCase();
    if (!emailNovo) return NextResponse.json({ erro: "E-mail não pode ficar em branco" }, { status: 400 });
    if (emailNovo !== usuario.email) {
      const jaExiste = await prisma.usuario.findUnique({ where: { email: emailNovo } });
      if (jaExiste) return NextResponse.json({ erro: "Já existe uma conta com esse e-mail" }, { status: 400 });
    }
    data.email = emailNovo;
  }

  if (body.fotoUrl !== undefined) {
    data.fotoUrl = body.fotoUrl || null;
  }

  // "Cadastrar disponibilidade" da própria pessoa (Etapa 4 v158) — usada como
  // 100% de capacidade em Capacidade da equipe (lib/capacidade.ts).
  if (body.cargaHorariaSemanal !== undefined) {
    const horas = Number(body.cargaHorariaSemanal);
    if (!(horas > 0)) {
      return NextResponse.json({ erro: "Carga horária semanal precisa ser maior que zero." }, { status: 400 });
    }
    data.cargaHorariaSemanal = horas;
  }

  // Trocar senha exige confirmar a senha atual — diferente da edição de Equipe
  // (onde quem tem gerenciarEquipe pode resetar sem saber a senha de ninguém),
  // porque aqui não tem uma permissão de "gerente" cuidando por trás.
  if (body.novaSenha) {
    if (!body.senhaAtual) {
      return NextResponse.json({ erro: "Confirma sua senha atual pra trocar a senha" }, { status: 400 });
    }
    const confere = await bcrypt.compare(body.senhaAtual, usuario.senha);
    if (!confere) {
      return NextResponse.json({ erro: "Senha atual incorreta" }, { status: 400 });
    }
    if (String(body.novaSenha).length < 6) {
      return NextResponse.json({ erro: "A nova senha precisa ter pelo menos 6 caracteres" }, { status: 400 });
    }
    data.senha = await bcrypt.hash(body.novaSenha, 10);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ erro: "Nada pra atualizar" }, { status: 400 });
  }

  const atualizado = await prisma.usuario.update({ where: { id: usuario.id }, data });
  const { senha, ...semSenha } = atualizado;
  return NextResponse.json(semSenha);
}
