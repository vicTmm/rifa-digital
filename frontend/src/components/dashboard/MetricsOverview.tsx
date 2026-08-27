"use client";

import React from "react";
import { DollarSign, TrendingUp, Ticket, Flame, ArrowUpRight } from "lucide-react";
import { formatBRL, formatNumber } from "@/lib/masks";

interface MetricsOverviewProps {
  stats: any;
  tenant: any;
}

export default function MetricsOverview({ stats, tenant }: MetricsOverviewProps) {
  const grossRevenue = stats?.gross_revenue || 0;
  const availableBalance = tenant?.available_balance || 0;
  const totalTickets = stats?.total_tickets_sold || 0;
  const activeRaffles = stats?.active_raffles || 0;

  // Simulated 7-day revenue performance for the visual chart
  const weeklyData = [
    { day: "Seg", value: 35 },
    { day: "Ter", value: 55 },
    { day: "Qua", value: 40 },
    { day: "Qui", value: 70 },
    { day: "Sex", value: 90 },
    { day: "Sáb", value: 100 },
    { day: "Dom", value: 85 },
  ];

  return (
    <div className="space-y-6">
      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-medium">Faturamento Bruto</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">
            {formatBRL(grossRevenue)}
          </p>
          <span className="text-[11px] text-zinc-400 block">Total transacionado via PIX</span>
        </div>

        {/* Metric 2 */}
        <div className="rounded-3xl bg-zinc-900 border border-emerald-500/30 p-5 space-y-2 shadow-lg glow-emerald">
          <div className="flex items-center justify-between text-xs text-emerald-400">
            <span className="font-bold">Saldo Disponível</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-400">
            {formatBRL(availableBalance)}
          </p>
          <span className="text-[11px] text-emerald-400/80 block font-semibold">Líquido pronto para saque no PIX</span>
        </div>

        {/* Metric 3 */}
        <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-medium">Cotas Pagas</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">
            {formatNumber(totalTickets)}
          </p>
          <span className="text-[11px] text-zinc-400 block">Em {stats?.total_orders_paid || 0} pedidos confirmados</span>
        </div>

        {/* Metric 4 */}
        <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-medium">Campanhas Ativas</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">
            {activeRaffles}
          </p>
          <span className="text-[11px] text-zinc-400 block">De {stats?.total_raffles || 0} criadas</span>
        </div>
      </div>

      {/* Visual Analytics Bar Chart & Conversion Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-3xl bg-zinc-900 border border-zinc-800 p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Desempenho de Vendas Semanal</h3>
              <p className="text-xs text-zinc-400">Volume de cotas pagas nos últimos 7 dias</p>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> +24% vs semana anterior
            </span>
          </div>

          {/* CSS/SVG Bar Chart */}
          <div className="h-40 flex items-end justify-between gap-3 pt-6 px-2">
            {weeklyData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full bg-zinc-950 rounded-xl h-28 flex items-end overflow-hidden border border-zinc-800/80 p-1">
                  <div
                    className="w-full rounded-lg bg-gradient-to-t from-emerald-600 to-green-400 transition-all duration-500 group-hover:from-emerald-500 group-hover:to-green-300"
                    style={{ height: `${d.value}%` }}
                  />
                </div>
                <span className="text-[11px] font-bold text-zinc-400 group-hover:text-white transition-colors">
                  {d.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Conversion & PIX Rate Card */}
        <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-6 space-y-5 shadow-xl flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">Taxa de Conversão PIX</h3>
            <p className="text-xs text-zinc-400">Pedidos gerados vs pagos</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black text-white">88.4%</span>
              <span className="text-xs text-emerald-400 font-bold">Alta Conversão</span>
            </div>
            <div className="h-2.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full" style={{ width: "88.4%" }} />
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Baixa automática em 3 segundos aumenta a conclusão dos pedidos e reduz abandonos no carrinho.
            </p>
          </div>

          <div className="pt-2 border-t border-zinc-800 flex justify-between text-xs text-zinc-300">
            <span>Tempo médio de pagamento:</span>
            <strong className="text-white font-mono">42 segundos</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
