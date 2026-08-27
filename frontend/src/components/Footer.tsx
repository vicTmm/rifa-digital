import React from "react";
import Link from "next/link";
import { Ticket, ShieldCheck, Zap, Lock, HelpCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800/80 bg-zinc-950/60 pt-12 pb-8 text-zinc-400">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-zinc-800/60">
          {/* Col 1: Brand */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-zinc-950 font-black">
                <Ticket className="h-5 w-5" />
              </div>
              <span className="text-lg font-black tracking-tight text-white">
                RIFA<span className="text-emerald-400">DIGITAL</span>
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Plataforma tecnológica multi-tenant para sorteios, campanhas beneficentes e rifas digitais com pagamento instantâneo via PIX e auditoria pela Loteria Federal.
            </p>
          </div>

          {/* Col 2: Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Navegação</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-emerald-400 transition-colors">
                  Todas as Rifas
                </Link>
              </li>
              <li>
                <Link href="/meus-bilhetes" className="hover:text-emerald-400 transition-colors">
                  Consultar Meus Bilhetes
                </Link>
              </li>
              <li>
                <Link href="/#como-funciona" className="hover:text-emerald-400 transition-colors">
                  Como Funciona
                </Link>
              </li>
              <li>
                <Link href="/cadastro" className="hover:text-emerald-400 transition-colors">
                  Seja um Organizador
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Segurança */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Segurança & Confiabilidade</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-zinc-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Sorteios auditáveis (Loteria Federal)</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Baixa automática instantânea no PIX</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <Lock className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Criptografia SSL de ponta a ponta</span>
              </div>
            </div>
          </div>

          {/* Col 4: Gateways */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Pagamentos Integrados</h4>
            <div className="flex flex-wrap gap-2">
              <div className="rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span> PIX Banco Central
              </div>
              <div className="rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300">
                Mercado Pago
              </div>
            </div>
            <p className="text-[11px] text-zinc-500 pt-1">
              Confirmação em menos de 3 segundos com liberação imediata dos seus números da sorte.
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-500">
          <p>© {new Date().getFullYear()} Rifa Digital. Todos os direitos reservados.</p>
          <p className="flex items-center gap-2">
            <span>Desenvolvido com tecnologia de alta performance</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
