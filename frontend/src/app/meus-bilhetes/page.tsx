"use client";

import React, { useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { maskPhone, maskCpf, maskCpfOrCnpj } from "@/lib/masks";
import { useToast } from "@/context/ToastContext";
import {
  Ticket,
  Search,
  CheckCircle2,
  Clock,
  Trophy,
  AlertCircle,
  Loader2,
  Calendar,
  ExternalLink,
  Share2,
  MessageCircle,
  Copy,
  Check
} from "lucide-react";

export default function MyTicketsPage() {
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [ticketSearchFilter, setTicketSearchFilter] = useState("");

  const handleQueryChange = (val: string) => {
    // If user starts typing digits, format smartly
    const rawDigits = val.replace(/\D/g, "");
    if (rawDigits.length > 0) {
      if (rawDigits.length <= 11) {
        setQuery(maskPhone(val));
      } else {
        setQuery(maskCpf(val));
      }
    } else {
      setQuery(val);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuery = query.replace(/\D/g, "") || query.trim();
    if (!cleanQuery) {
      setErrorMsg("Informe seu número de WhatsApp ou CPF.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setResults(null);

    try {
      const res = await api.get("/tickets/my-tickets", {
        params: { query: cleanQuery },
      });
      setResults(res.data);
      if (res.data.length > 0) {
        toast.success(`Encontrados ${res.data.length} pedidos vinculados.`);
      }
    } catch (err: any) {
      console.error("Search error:", err);
      setErrorMsg("Erro ao consultar bilhetes. Verifique o número informado.");
    } finally {
      setLoading(false);
    }
  };

  const handleShareTicket = (item: any) => {
    const text = encodeURIComponent(
      `🎟️ *Meus Números da Sorte - Rifa Digital*\n\n` +
      `🏆 *Ação:* ${item.raffle_title}\n` +
      `📦 *Pedido:* #${item.order_id}\n` +
      `🔢 *Minhas Cotas:* ${item.tickets.slice(0, 15).join(", ")}${item.tickets.length > 15 ? ` e mais ${item.tickets.length - 15} cotas` : ""}\n\n` +
      `Sorteio auditado pela Loteria Federal!`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 sm:px-6 py-12 space-y-8 pb-24">
      {/* Header */}
      <div className="text-center space-y-3 max-w-lg mx-auto">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10">
          <Ticket className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          Consultar Meus Bilhetes
        </h1>
        <p className="text-xs sm:text-sm text-zinc-300">
          Digite seu número de WhatsApp ou CPF para localizar suas compras e números da sorte em tempo real.
        </p>
      </div>

      {/* Search Input Form */}
      <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 shadow-2xl">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              required
              placeholder="Digite seu WhatsApp (ex: 11 98765-4321) ou CPF"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              className="w-full rounded-2xl bg-zinc-950 border border-zinc-700 pl-12 pr-4 py-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-medium"
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
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 text-sm font-black text-zinc-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 disabled:opacity-50 transition-all cursor-pointer hover:scale-[1.01]"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Buscando bilhetes no banco de dados...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" /> Localizar Meus Bilhetes
              </>
            )}
          </button>
        </form>
      </div>

      {/* Search Results */}
      {results !== null && (
        <div className="space-y-6">
          <div className="flex justify-between items-center text-xs font-bold text-zinc-300 px-1">
            <span>Resultados encontrados: {results.length} pedidos</span>
            {results.length > 0 && (
              <div className="relative max-w-xs w-48">
                <input
                  type="text"
                  placeholder="Filtrar número da cota..."
                  value={ticketSearchFilter}
                  onChange={(e) => setTicketSearchFilter(e.target.value)}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}
          </div>

          {results.length === 0 ? (
            <div className="rounded-3xl bg-zinc-900/50 border border-zinc-800 p-10 text-center space-y-3">
              <p className="text-base font-bold text-white">Nenhum bilhete encontrado para este telefone ou CPF.</p>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Certifique-se de que o pagamento via PIX foi realizado com os mesmos dados informados no checkout.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {results.map((item, idx) => {
                const filteredTickets = ticketSearchFilter
                  ? item.tickets.filter((t: string) => t.includes(ticketSearchFilter))
                  : item.tickets;

                return (
                  <div
                    key={idx}
                    className="rounded-3xl bg-zinc-900 border border-zinc-800 p-6 space-y-5 shadow-xl hover:border-zinc-700 transition-all ticket-stub"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                            Pedido #{item.order_id}
                          </span>
                          {item.created_at && (
                            <span className="text-[11px] text-zinc-400">
                              {new Date(item.created_at).toLocaleDateString("pt-BR")}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-black text-white">
                          {item.raffle_title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.order_status === "PAID" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 px-3.5 py-1 text-xs font-black text-emerald-400 shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Pago & Concorrendo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 px-3.5 py-1 text-xs font-black text-amber-400">
                            <Clock className="w-3.5 h-3.5" /> Aguardando Pagamento
                          </span>
                        )}

                        <button
                          onClick={() => handleShareTicket(item)}
                          className="flex items-center gap-1 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all text-xs font-bold"
                          title="Compartilhar no WhatsApp"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>

                        <Link
                          href={`/rifas/${item.raffle_slug}`}
                          className="p-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
                          title="Ver página da rifa"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>

                    {/* Lucky Prize Alert */}
                    {item.lucky_prizes && item.lucky_prizes.length > 0 && (
                      <div className="rounded-2xl bg-amber-500/15 border border-amber-500/40 p-4 space-y-1.5 glow-amber">
                        <div className="flex items-center gap-2 text-amber-400 font-black text-xs">
                          <Trophy className="w-4 h-4 animate-pulse" />
                          <span>Parabéns! Você encontrou Cota Premiada neste pedido:</span>
                        </div>
                        {item.lucky_prizes.map((p: any, pIdx: number) => (
                          <div key={pIdx} className="flex justify-between items-center text-xs text-zinc-100 bg-black/40 p-2 rounded-xl">
                            <span className="text-amber-300 font-mono font-black">Cota {p.number}</span>
                            <span className="font-bold text-white">{p.prize}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Numbers Grid */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold text-zinc-300">
                        <span>Seus Números ({item.tickets.length} cotas):</span>
                        {ticketSearchFilter && (
                          <span className="text-emerald-400">{filteredTickets.length} correspondentes</span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
                        {filteredTickets.map((num: string, nIdx: number) => (
                          <span
                            key={nIdx}
                            className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono font-bold text-emerald-400 shadow-sm"
                          >
                            {num}
                          </span>
                        ))}
                        {filteredTickets.length === 0 && (
                          <span className="text-xs text-zinc-500 p-2">Nenhum número corresponde à busca.</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
