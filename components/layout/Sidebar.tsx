"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  Users,
  Wallet,
  Clock,
  Calendar,
  CheckSquare,
  Trophy,
  Settings,
  Menu,
  X,
  Megaphone,
} from "lucide-react";
import { BotaoTema } from "@/components/ui/TemaAlternativo";

export type Permissoes = {
  master: boolean;
  verFinanceiro: boolean;
  gerenciarFinanceiro: boolean;
  verComercial: boolean;
  verOportunidades: boolean;
  verOrcamentos: boolean;
  verContratos: boolean;
  verCatalogo: boolean;
  gerenciarTrafego: boolean;
  gerenciarEquipe: boolean;
  gerenciarConfiguracoes: boolean;
  todosClientes: boolean;
};

// Números que aparecem ao lado dos itens do menu — calculados no layout do
// dashboard (server), já respeitando os clientes que cada pessoa pode ver.
export type ContagensMenu = {
  tarefasAtrasadas: number;
  cobrancasVencidas: number;
  clientesAtivos: number;
};

type Item = {
  label: string;
  href: string;
  icon: any;
  // Caminhos que deixam o item marcado como ativo (além do próprio href) —
  // é o que faz "Financeiro" continuar aceso dentro de DRE, Contas a Pagar etc.
  cobre?: string[];
  alerta?: number;
  contagem?: number;
};

// Redesign fase 1: o menu ficou curto (de 16 pra no máximo 8 itens). Financeiro
// e Comercial viraram um item só cada, com abas dentro da página (ver
// components/layout/AbasSecao.tsx). "Novidades" continua no Header.
function montarMenu(pode: Permissoes, contagens: ContagensMenu) {
  const principal: Item[] = [
    { label: "Início", href: "/dashboard", icon: LayoutGrid },
    { label: "Tarefas", href: "/dashboard/tarefas", icon: CheckSquare, alerta: contagens.tarefasAtrasadas },
    { label: "Agenda", href: "/dashboard/agenda", icon: Calendar },
    { label: "Clientes", href: "/dashboard/clientes", icon: Users, contagem: contagens.clientesAtivos },
  ];
  if (pode.gerenciarTrafego) {
    principal.push({ label: "Tráfego pago", href: "/dashboard/trafego", icon: Megaphone });
  }
  principal.push({ label: "Horas", href: "/dashboard/horas", icon: Clock });

  const gestao: Item[] = [];
  if (pode.verFinanceiro) {
    gestao.push({ label: "Financeiro", href: "/dashboard/financeiro", icon: Wallet, alerta: contagens.cobrancasVencidas });
  }
  const comercial = [
    { href: "/dashboard/oportunidades", flag: pode.verOportunidades },
    { href: "/dashboard/orcamentos", flag: pode.verOrcamentos },
    { href: "/dashboard/contratos", flag: pode.verContratos },
    { href: "/dashboard/servicos", flag: pode.verCatalogo },
    { href: "/dashboard/pacotes", flag: pode.verCatalogo },
  ].filter((c) => c.flag);
  if (comercial.length > 0) {
    gestao.push({
      label: "Comercial",
      href: comercial[0].href,
      icon: Trophy,
      cobre: comercial.map((c) => c.href),
    });
  }

  return { principal, gestao };
}

function ItemMenu({ item, ativo, onClick }: { item: Item; ativo: boolean; onClick?: () => void }) {
  const Icon = item.icon;
  return (
    <Link href={item.href} onClick={onClick} className="relative block" aria-current={ativo ? "page" : undefined}>
      {ativo && (
        <motion.div
          layoutId="sidebar-active"
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          className="absolute inset-0 rounded-[10px] bg-hover/70"
        />
      )}
      <div
        className={`relative z-10 flex h-[38px] items-center gap-[11px] rounded-[10px] px-3 text-[13.5px] font-medium transition-colors duration-150 ${
          ativo ? "text-text" : "text-muted hover:bg-hover/40 hover:text-text"
        }`}
      >
        <Icon size={17} strokeWidth={1.75} className={ativo ? "text-accent" : undefined} />
        <span className="flex-1">{item.label}</span>
        {!!item.alerta && item.alerta > 0 && (
          <span className="flex h-[18px] min-w-[20px] items-center justify-center rounded-full bg-red-500/15 px-1.5 font-numero text-[11px] text-red-400">
            {item.alerta}
          </span>
        )}
        {!item.alerta && !!item.contagem && item.contagem > 0 && (
          <span className="font-numero text-[11px] text-muted/70">{item.contagem}</span>
        )}
      </div>
    </Link>
  );
}

function ConteudoSidebar({
  nome,
  cargo,
  pode,
  contagens,
  onNavigate,
}: {
  nome: string;
  cargo: string;
  pode: Permissoes;
  contagens: ContagensMenu;
  onNavigate?: () => void;
}) {
  const pathname = usePathname() || "";
  const { principal, gestao } = montarMenu(pode, contagens);

  // O item ativo é o de caminho mais específico que bate com a URL atual —
  // senão "Início" (/dashboard) acenderia junto em toda página.
  const candidatos = [...principal, ...gestao].flatMap((item) =>
    [item.href, ...(item.cobre || [])].map((caminho) => ({ item, caminho }))
  );
  const melhor = candidatos
    .filter(({ caminho }) => pathname === caminho || pathname.startsWith(caminho + "/"))
    .sort((a, b) => b.caminho.length - a.caminho.length)[0];
  const ativo = (item: Item) => melhor?.item === item;

  const iniciais = nome
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      <Link href="/dashboard" onClick={onNavigate} className="mb-6 flex items-center px-2.5">
        <img src="/logo.png" alt="Instaby" className="h-[22px] w-auto" />
      </Link>

      <nav aria-label="Menu principal" className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex flex-col gap-0.5">
          {principal.map((item) => (
            <ItemMenu key={item.href} item={item} ativo={ativo(item)} onClick={onNavigate} />
          ))}
        </div>

        {gestao.length > 0 && (
          <div className="mt-5 flex flex-col gap-0.5">
            <p className="px-3 pb-1.5 font-numero text-[10.5px] uppercase tracking-[0.12em] text-muted/60">Gestão</p>
            {gestao.map((item) => (
              <ItemMenu key={item.href} item={item} ativo={ativo(item)} onClick={onNavigate} />
            ))}
          </div>
        )}
      </nav>

      <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-white/[0.03] p-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-extrabold text-red-300">
          {iniciais}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold text-text">{nome}</p>
          <p className="truncate text-[11.5px] text-muted/80">{cargo}</p>
        </div>
        <BotaoTema />
        <Link
          href="/dashboard/configuracoes"
          onClick={onNavigate}
          title="Configurações"
          aria-label="Configurações"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-hover hover:text-text"
        >
          <Settings size={16} strokeWidth={1.75} />
        </Link>
      </div>
    </>
  );
}

export function Sidebar({
  nome,
  cargo,
  pode,
  contagens,
}: {
  nome: string;
  cargo: string;
  pode: Permissoes;
  contagens: ContagensMenu;
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      {/* Desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-white/5 bg-sidebar px-3.5 pb-4 pt-6 md:flex print:hidden">
        <ConteudoSidebar nome={nome} cargo={cargo} pode={pode} contagens={contagens} />
      </aside>

      {/* Botão mobile */}
      <button
        onClick={() => setAberto(true)}
        aria-label="Abrir menu"
        className="fixed left-4 top-3.5 z-30 flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-text md:hidden print:hidden"
      >
        <Menu size={16} />
      </button>

      {/* Drawer mobile */}
      <AnimatePresence>
        {aberto && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAberto(false)}
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
            />
            <motion.aside
              initial={{ x: -248 }}
              animate={{ x: 0 }}
              exit={{ x: -248 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r border-white/5 bg-sidebar px-3.5 pb-4 pt-6 md:hidden"
            >
              <button
                onClick={() => setAberto(false)}
                aria-label="Fechar menu"
                className="absolute right-4 top-5 text-muted hover:text-text"
              >
                <X size={16} />
              </button>
              <ConteudoSidebar
                nome={nome}
                cargo={cargo}
                pode={pode}
                contagens={contagens}
                onNavigate={() => setAberto(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
