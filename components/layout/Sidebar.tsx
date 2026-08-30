"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  Users,
  Wallet,
  FileText,
  FileSignature,
  Package,
  Package2,
  Clock,
  Calendar,
  CheckSquare,
  BarChart3,
  Settings,
  Menu,
  X,
} from "lucide-react";

const menuPrincipal = [
  { label: "Visão geral", href: "/dashboard", icon: LayoutGrid },
  { label: "Clientes", href: "/dashboard/clientes", icon: Users },
  { label: "Agenda", href: "/dashboard/agenda", icon: Calendar },
  { label: "Tarefas", href: "/dashboard/tarefas", icon: CheckSquare },
  { label: "Horas", href: "/dashboard/horas", icon: Clock },
];

const menuFinanceiro = [
  { label: "Visão geral", href: "/dashboard/financeiro", icon: Wallet },
  { label: "DRE", href: "/dashboard/financeiro/dre", icon: BarChart3 },
];

const menuOrcamento = [
  { label: "Catálogo de serviços", href: "/dashboard/servicos", icon: Package },
  { label: "Pacotes", href: "/dashboard/pacotes", icon: Package2 },
  { label: "Orçamentos", href: "/dashboard/orcamentos", icon: FileText },
  { label: "Contratos", href: "/dashboard/contratos", icon: FileSignature },
];

const menuConfig = [{ label: "Configurações", href: "/dashboard/configuracoes", icon: Settings }];

function ItemMenu({
  item,
  ativo,
  onClick,
}: {
  item: { label: string; href: string; icon: any };
  ativo: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link href={item.href} onClick={onClick} className="relative block">
      {ativo && (
        <motion.div
          layoutId="sidebar-active"
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          className="absolute inset-0 rounded-xl border border-accent/20 bg-accent/10"
        />
      )}
      <div
        className={`relative z-10 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-150 ${
          ativo ? "font-medium text-accent" : "text-muted hover:bg-hover hover:text-text"
        }`}
      >
        <Icon size={17} strokeWidth={1.75} />
        {item.label}
      </div>
    </Link>
  );
}

function ConteudoSidebar({ nome, email, onNavigate }: { nome: string; email: string; onNavigate?: () => void }) {
  const pathname = usePathname();

  const todosHrefs = [
    ...menuPrincipal.map((i) => i.href),
    ...menuFinanceiro.map((i) => i.href),
    ...menuOrcamento.map((i) => i.href),
    ...menuConfig.map((i) => i.href),
  ];
  const melhorMatch = todosHrefs
    .filter((h) => pathname === h || pathname?.startsWith(h + "/"))
    .sort((a, b) => b.length - a.length)[0];
  const ativo = (href: string) => href === melhorMatch;

  const iniciais = nome
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      <div className="mb-8 flex items-center gap-2 px-2">
        <img src="/logo.png" alt="Instaby" className="h-6 w-auto" />
      </div>

      <nav className="flex flex-1 flex-col gap-6">
        <div className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-[11px] uppercase tracking-wider text-muted/70">Geral</p>
          {menuPrincipal.map((item) => (
            <ItemMenu key={item.href} item={item} ativo={!!ativo(item.href)} onClick={onNavigate} />
          ))}
        </div>

        <div className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-[11px] uppercase tracking-wider text-muted/70">Financeiro</p>
          {menuFinanceiro.map((item) => (
            <ItemMenu key={item.href} item={item} ativo={!!ativo(item.href)} onClick={onNavigate} />
          ))}
        </div>

        <div className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-[11px] uppercase tracking-wider text-muted/70">Comercial</p>
          {menuOrcamento.map((item) => (
            <ItemMenu key={item.href} item={item} ativo={!!ativo(item.href)} onClick={onNavigate} />
          ))}
        </div>

        <div className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-[11px] uppercase tracking-wider text-muted/70">Configurações</p>
          {menuConfig.map((item) => (
            <ItemMenu key={item.href} item={item} ativo={!!ativo(item.href)} onClick={onNavigate} />
          ))}
        </div>
      </nav>

      <div className="flex items-center gap-3 rounded-xl border border-border bg-card/60 px-3 py-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">
          {iniciais}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-text">{nome}</p>
          <p className="truncate text-xs text-muted">{email}</p>
        </div>
      </div>
    </>
  );
}

export function Sidebar({ nome, email }: { nome: string; email: string }) {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      {/* Desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[280px] flex-col border-r border-border bg-base/95 px-4 py-6 backdrop-blur-xs md:flex">
        <ConteudoSidebar nome={nome} email={email} />
      </aside>

      {/* Botão mobile */}
      <button
        onClick={() => setAberto(true)}
        className="fixed left-4 top-4 z-30 flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card/80 text-text backdrop-blur-xs md:hidden"
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
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-border bg-base px-4 py-6 md:hidden"
            >
              <button
                onClick={() => setAberto(false)}
                className="absolute right-4 top-4 text-muted hover:text-text"
              >
                <X size={16} />
              </button>
              <ConteudoSidebar nome={nome} email={email} onNavigate={() => setAberto(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
