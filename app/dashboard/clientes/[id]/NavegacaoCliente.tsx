"use client";

import { useId } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { agruparAbasCliente, hrefAbaCliente, type AbaCliente } from "./navegacaoClienteModelo";

type Props = {
  clienteId: string;
  abaAtual: string;
  abas: AbaCliente[];
};

const foco = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export default function NavegacaoCliente({ clienteId, abaAtual, abas }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const seletorId = useId();
  const areas = agruparAbasCliente(abas);
  const areaAtual = areas.find((area) => area.abas.some((aba) => aba.valor === abaAtual)) || areas[0];
  const abaSelecionada = abas.some((aba) => aba.valor === abaAtual) ? abaAtual : areaAtual?.abas[0]?.valor;

  if (!areaAtual || !abaSelecionada) return null;

  const href = (valor: string) => hrefAbaCliente(clienteId, valor, searchParams.toString());

  return (
    <div className="mb-6 min-w-0 border-b border-border pb-4">
      <div className="md:hidden">
        <label htmlFor={seletorId} className="mb-2 block text-sm font-medium text-text">
          Seção do cliente
        </label>
        <select
          id={seletorId}
          value={abaSelecionada}
          onChange={(event) => router.push(href(event.target.value), { scroll: false })}
          className={`min-h-11 w-full max-w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-text ${foco}`}
        >
          {areas.map((area) => (
            <optgroup key={area.valor} label={area.label}>
              {area.abas.map((aba) => (
                <option key={aba.valor} value={aba.valor}>{aba.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="hidden min-w-0 md:block">
        <nav aria-label="Áreas do cliente" className="flex min-w-0 flex-wrap items-center gap-1.5">
          {areas.map((area) => {
            const ativa = area.valor === areaAtual.valor;
            return (
              <Link
                key={area.valor}
                href={href(ativa ? abaSelecionada : area.abas[0].valor)}
                scroll={false}
                aria-current={ativa ? "location" : undefined}
                className={`inline-flex min-h-11 max-w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm transition-colors ${foco} ${ativa ? "bg-accent/10 font-semibold text-text" : "text-muted hover:bg-card hover:text-text"}`}
              >
                {area.label}
              </Link>
            );
          })}
        </nav>

        {areaAtual.abas.length > 1 && (
          <nav aria-label={`Seções de ${areaAtual.label}`} className="mt-3 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 border-t border-border pt-3">
            {areaAtual.abas.map((aba) => {
              const ativa = aba.valor === abaSelecionada;
              return (
                <Link
                  key={aba.valor}
                  href={href(aba.valor)}
                  scroll={false}
                  aria-current={ativa ? "page" : undefined}
                  className={`inline-flex min-h-11 max-w-full items-center border-b-2 px-3 py-2 text-sm transition-colors ${foco} ${ativa ? "border-accent font-semibold text-text" : "border-transparent text-muted hover:bg-card hover:text-text"}`}
                >
                  {aba.label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
}
