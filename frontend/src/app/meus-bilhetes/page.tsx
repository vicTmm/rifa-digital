"use client";

import React, { useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import {
  Ticket,
  Search,
  CheckCircle2,
  Clock,
  Trophy,
  AlertCircle,
  Loader2,
  Calendar,
  ExternalLink
} from "lucide-react";

export default function MyTicketsPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setErrorMsg("Informe seu número de WhatsApp ou CPF.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setResults(null);

    try {
      const res = await api.get("/tickets/my-tickets", {
        params: { query: query.trim() },
      });
      setResults(res.data);
    } catch (err: any) {
      console.error("Search error:", err);
      setErrorMsg("Erro ao consultar bilhetes. Verifique o número informado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 sm:px-6 py-12 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3 max-w-lg mx-auto">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
          <Ticket className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          Consultar Meus Bilhetes
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          Digite seu número de WhatsApp ou CPF para localizar todas as suas compras e números da sorte.
        </p>
      </div>

      {/* Search Input Form */}
      <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 shadow-xl">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              required
              placeholder="Digite seu WhatsApp com DDD (ex: 11987654321) ou CPF"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-2xl bg-zinc-950 border border-zinc-700/80 pl-12 pr-4 py-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-red-950/50 border border-red-500/30 p-3 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-sm font-black text-zinc-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Buscando no banco de dados...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" /> Buscar Meus Bilhetes
              </>
            )}
          </button>
        </form>
      </div>

      {/* Search Results */}
      {results !== null && (
        <div className="space-y-6">
          <div className="flex justify-between items-center text-xs font-semibold text-zinc-400">
            <span>Resultados encontrados: {results.length}</span>
          </div>

          {results.length === 0 ? (
            <div className="rounded-3xl bg-zinc-900/40 border border-zinc-800 p-8 text-center space-y-2">
              <p className="text-sm font-bold text-zinc-300">Nenhum bilhete encontrado para este telefone ou CPF.</p>
              <p className="text-xs text-zinc-500">Certifique-se de que o pagamento via PIX foi realizado com os mesmos dados.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-3xl bg-zinc-900 border border-zinc-800 p-6 space-y-4 hover:border-zinc-700 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                        Pedido #{item.order_id}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-white">
                        {item.raffle_title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.order_status === "PAID" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Pago & Concorrendo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-400">
                          <Clock className="w-3.5 h-3.5" /> Aguardando Pagamento
                        </span>
                      )}

                      <Link
                        href={`/rifas/${item.raffle_slug}`}
                        className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
                        title="Ver campanha"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>

                  {/* Lucky Prize Alert */}
                  {item.lucky_prizes && item.lucky_prizes.length > 0 && (
                    <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3.5 space-y-1">
                      <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                        <Trophy className="w-4 h-4" />
                        <span>Você ganhou uma Cota Premiada neste pedido!</span>
                      </div>
                      {item.lucky_prizes.map((p: any, pIdx: number) => (
                        <p key={pIdx} className="text-xs text-zinc-300">
                          Cota <strong className="text-amber-400 font-mono">{p.number}</strong>: {p.prize}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Numbers Grid */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-zinc-400">
                      Seus Números ({item.tickets.length} cotas):
                    </span>
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
                      {item.tickets.map((num: string, nIdx: number) => (
                        <span
                          key={nIdx}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono font-bold text-emerald-400"
                        >
                          {num}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
