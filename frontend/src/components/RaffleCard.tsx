import React from "react";
import Link from "next/link";
import { Sparkles, CheckCircle2, Ticket, Flame, Trophy, Clock } from "lucide-react";

export interface RaffleCardProps {
  raffle: {
    id: number;
    title: string;
    slug: string;
    category: string;
    images: string[];
    price_per_number: number;
    total_numbers: number;
    sold_count: number;
    progress_percentage: number;
    status: string;
    badge_text?: string;
    is_featured: boolean;
    tenant_name: string;
    tenant_slug: string;
    tenant_verified: boolean;
    draw_date?: string;
  };
}

export default function RaffleCard({ raffle }: RaffleCardProps) {
  const imageUrl = raffle.images && raffle.images.length > 0 
    ? raffle.images[0] 
    : "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80";

  const isDrawn = raffle.status === "DRAWN";

  return (
    <div className="group relative flex flex-col rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-emerald-500/50 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-1">
      {/* Image Thumbnail & Badges */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-950">
        <img
          src={imageUrl}
          alt={raffle.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/40" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          {raffle.badge_text ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-black text-zinc-950 shadow-md">
              <Flame className="w-3 h-3 fill-zinc-950" /> {raffle.badge_text}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900/80 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-zinc-300 border border-zinc-700">
              {raffle.category}
            </span>
          )}

          {isDrawn ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-zinc-950">
              <Trophy className="w-3 h-3" /> SORTEADA
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900/90 backdrop-blur-md border border-emerald-500/30 px-2.5 py-1 text-xs font-black text-emerald-400">
              R$ {raffle.price_per_number.toFixed(2).replace(".", ",")}
            </span>
          )}
        </div>

        {/* Organizer info */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
          <Link
            href={`/o/${raffle.tenant_slug}`}
            className="flex items-center gap-1.5 text-zinc-300 hover:text-white bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="font-medium truncate max-w-[130px]">{raffle.tenant_name}</span>
            {raffle.tenant_verified && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            )}
          </Link>

          {raffle.draw_date && (
            <div className="flex items-center gap-1 text-[11px] font-medium text-zinc-300 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
              <Clock className="w-3 h-3 text-zinc-400" />
              <span>{new Date(raffle.draw_date).toLocaleDateString("pt-BR")}</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5 space-y-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
            {raffle.title}
          </h3>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="font-medium text-zinc-400">
              Progresso ({raffle.progress_percentage}%)
            </span>
            <span className="font-bold text-emerald-400">
              {raffle.sold_count.toLocaleString("pt-BR")} cotas
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(5, raffle.progress_percentage))}%` }}
            />
          </div>
        </div>

        {/* CTA Button */}
        <Link
          href={`/rifas/${raffle.slug}`}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition-all ${
            isDrawn
              ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              : "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20 hover:bg-emerald-400 group-hover:scale-[1.02]"
          }`}
        >
          <Ticket className="w-4 h-4" />
          {isDrawn ? "Ver Resultado do Sorteio" : "Participar Agora"}
        </Link>
      </div>
    </div>
  );
}
