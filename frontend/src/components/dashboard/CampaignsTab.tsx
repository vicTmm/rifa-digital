"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatBRL, formatNumber } from "@/lib/masks";
import { useToast } from "@/context/ToastContext";
import {
  Ticket,
  ExternalLink,
  Trophy,
  Copy,
  Check,
  Flame,
  Search,
  PlusCircle,
  Share2
} from "lucide-react";

interface CampaignsTabProps {
  myRaffles: any[];
  onNewRaffle: () => void;
  onSelectForDraw: (raffle: any) => void;
}

export default function CampaignsTab({
  myRaffles,
  onNewRaffle,
  onSelectForDraw,
}: CampaignsTabProps) {
  const toast = useToast();
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [filter, setFilter] = useState("");

  const handleCopyLink = (slug: string, id: number) => {
    const url = `${window.location.origin}/rifas/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("Link da rifa copiado com sucesso!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredRaffles = myRaffles.filter((r) =>
    r.title.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar nas minhas campanhas..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full rounded-2xl bg-zinc-900 border border-zinc-800 pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <button
          onClick={onNewRaffle}
          className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-2.5 text-xs font-black text-zinc-950 shadow-md shadow-emerald-500/20 hover:bg-emerald-400 transition-all cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4" /> Nova Rifa
        </button>
      </div>

      {myRaffles.length === 0 ? (
        <div className="text-center py-20 rounded-3xl bg-zinc-900/40 border border-zinc-800 p-8 space-y-4 shadow-xl">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-400 mx-auto">
            <Ticket className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <p className="text-base font-bold text-white">Você ainda não criou nenhuma rifa.</p>
            <p className="text-xs text-zinc-400">Lance sua primeira campanha agora e comece a faturar recebendo direto no PIX.</p>
          </div>
          <button
            onClick={onNewRaffle}
            className="rounded-2xl bg-emerald-500 px-6 py-3 text-xs font-black text-zinc-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all cursor-pointer"
          >
            Criar Minha Primeira Rifa
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRaffles.map((raffle) => {
            const isDrawn = raffle.status === "DRAWN";
            return (
              <div
                key={raffle.id}
                className="rounded-3xl bg-zinc-900 border border-zinc-800 overflow-hidden flex flex-col justify-between shadow-xl hover:border-zinc-700 transition-all group"
              >
                <div className="relative aspect-[16/10] w-full bg-zinc-950">
                  <img
                    src={raffle.images?.[0] || "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80"}
                    alt={raffle.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/30" />
                  
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="rounded-full bg-zinc-950/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-black text-emerald-400 border border-emerald-500/30">
                      {formatBRL(raffle.price_per_number)}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    {isDrawn ? (
                      <span className="rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-black text-zinc-950 flex items-center gap-1">
                        <Trophy className="w-3 h-3" /> SORTEADA
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-500/90 px-2.5 py-1 text-[10px] font-bold text-zinc-950 flex items-center gap-1">
                        <Flame className="w-3 h-3 fill-zinc-950" /> ATIVA
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <h3 className="text-base font-bold text-white line-clamp-2 leading-snug">
                      {raffle.title}
                    </h3>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-zinc-400">Progresso ({raffle.progress_percentage}%)</span>
                        <span className="text-white">{formatNumber(raffle.sold_count)} cotas pagas</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-zinc-950 overflow-hidden border border-zinc-800">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(5, raffle.progress_percentage))}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-zinc-800">
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/rifas/${raffle.slug}`}
                        target="_blank"
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-zinc-800 py-2.5 text-xs font-bold text-zinc-200 hover:bg-zinc-700 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Ver Rifa
                      </Link>

                      <button
                        onClick={() => handleCopyLink(raffle.slug, raffle.id)}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-zinc-800 py-2.5 text-xs font-bold text-zinc-200 hover:bg-zinc-700 transition-colors cursor-pointer"
                      >
                        {copiedId === raffle.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" /> Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copiar Link
                          </>
                        )}
                      </button>
                    </div>

                    {!isDrawn && (
                      <button
                        onClick={() => onSelectForDraw(raffle)}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 py-2.5 text-xs font-black text-zinc-950 hover:bg-amber-400 transition-colors cursor-pointer shadow-md shadow-amber-500/10"
                      >
                        <Trophy className="w-3.5 h-3.5" /> Realizar Sorteio
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
