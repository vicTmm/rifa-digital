"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import api from "@/lib/api";
import CheckoutModal from "@/components/CheckoutModal";
import {
  Ticket,
  Sparkles,
  Trophy,
  CheckCircle2,
  Share2,
  Clock,
  Flame,
  ShieldCheck,
  Zap,
  Plus,
  Minus,
  MessageCircle,
  HelpCircle,
  Award,
  Gift,
  Search,
  Grid,
  Layers,
  Loader2
} from "lucide-react";

export default function RaffleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [raffle, setRaffle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  // Selection Mode: "QUICK" (cotas rápidas) or "MANUAL" (mapa de números)
  const [mode, setMode] = useState<"QUICK" | "MANUAL">("QUICK");
  
  // Quick quantity state
  const [quantity, setQuantity] = useState(10);
  
  // Manual grid state
  const [gridData, setGridData] = useState<any>(null);
  const [selectedManualNumbers, setSelectedManualNumbers] = useState<string[]>([]);
  const [gridSearch, setGridSearch] = useState("");
  const [gridFilter, setGridFilter] = useState<"ALL" | "AVAILABLE" | "LUCKY">("ALL");

  // Checkout modal
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    const fetchRaffle = async () => {
      try {
        const res = await api.get(`/raffles/${slug}`);
        setRaffle(res.data);
        if (res.data.min_purchase && res.data.min_purchase > quantity) {
          setQuantity(res.data.min_purchase);
        }
      } catch (err) {
        console.error("Error fetching raffle:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRaffle();
  }, [slug]);

  // Load grid numbers if switched to MANUAL mode
  useEffect(() => {
    if (mode === "MANUAL" && raffle?.id && !gridData) {
      const fetchGrid = async () => {
        try {
          const res = await api.get(`/tickets/raffle/${raffle.id}/grid`);
          setGridData(res.data);
        } catch (e) {
          console.error("Error fetching grid:", e);
        }
      };
      fetchGrid();
    }
  }, [mode, raffle?.id, gridData]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-sm text-zinc-400">Carregando detalhes da campanha...</p>
      </div>
    );
  }

  if (!raffle) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-black text-white">Rifa não encontrada</h2>
        <p className="text-xs text-zinc-400">Esta campanha pode ter sido encerrada ou removida.</p>
        <Link
          href="/"
          className="inline-block rounded-xl bg-emerald-500 px-6 py-2.5 text-xs font-bold text-zinc-950"
        >
          Voltar para a Página Inicial
        </Link>
      </div>
    );
  }

  // Calculate pricing based on mode & quantity
  const activeQuantity = mode === "MANUAL" ? selectedManualNumbers.length : quantity;
  const unitPrice = raffle.price_per_number;
  const baseTotal = activeQuantity * unitPrice;

  // Apply Combo discount
  let bestDiscountPercent = 0;
  if (raffle.discount_combos && raffle.discount_combos.length > 0) {
    for (const combo of [...raffle.discount_combos].sort((a, b) => b.quantity - a.quantity)) {
      if (activeQuantity >= combo.quantity) {
        bestDiscountPercent = combo.discount_percentage;
        break;
      }
    }
  }

  const discountAmount = Math.round(baseTotal * (bestDiscountPercent / 100) * 100) / 100;
  const finalTotal = Math.max(0, Math.round((baseTotal - discountAmount) * 100) / 100);

  const images = raffle.images && raffle.images.length > 0
    ? raffle.images
    : ["https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80"];

  const handleManualToggle = (numStr: string) => {
    if (selectedManualNumbers.includes(numStr)) {
      setSelectedManualNumbers((prev) => prev.filter((n) => n !== numStr));
    } else {
      setSelectedManualNumbers((prev) => [...prev, numStr]);
    }
  };

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({
        title: raffle.title,
        text: `Participe da rifa: ${raffle.title}`,
        url: window.location.href,
      }).catch(() => {});
    } else if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copiado para a área de transferência!");
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 pb-32 space-y-8">
      {/* Top Breadcrumb & Share */}
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <Link href="/" className="hover:text-emerald-400 transition-colors">
            Início
          </Link>
          <span>/</span>
          <span className="text-zinc-200 truncate max-w-[200px] sm:max-w-xs">{raffle.title}</span>
        </div>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-700 transition-all cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" /> Compartilhar
        </button>
      </div>

      {/* Main Grid: Gallery & Raffle Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Gallery & Description (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Image */}
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl">
            <img
              src={images[activeImageIndex]}
              alt={raffle.title}
              className="h-full w-full object-cover transition-all duration-300"
            />
            {raffle.badge_text && (
              <div className="absolute top-4 left-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3.5 py-1 text-xs font-black text-zinc-950 shadow-lg">
                  <Flame className="w-3.5 h-3.5 fill-zinc-950" /> {raffle.badge_text}
                </span>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative h-16 w-24 overflow-hidden rounded-xl border-2 transition-all cursor-pointer shrink-0 ${
                    activeImageIndex === idx
                      ? "border-emerald-500 scale-105"
                      : "border-zinc-800 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="thumb" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Description Section */}
          <div className="rounded-3xl bg-zinc-900/60 border border-zinc-800/80 p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Gift className="w-4 h-4 text-emerald-400" /> Detalhes do Prêmio
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
              {raffle.description || "Participe desta incrível campanha e concorra a prêmios imperdíveis."}
            </p>
          </div>

          {/* Sorteio Auditado Info Box */}
          <div className="rounded-3xl bg-zinc-900/60 border border-zinc-800/80 p-6 flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">Sorteio Auditável e 100% Seguro</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {raffle.draw_type === "FEDERAL"
                  ? "O resultado desta ação será baseado na extração oficial da Loteria Federal na data marcada. Transparência total para todos os participantes."
                  : "Sorteio eletrônico automático com semente criptográfica entre todas as cotas pagas."}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Buying Box & Numbers Selection (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Header Card */}
          <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-6 space-y-5 shadow-xl">
            {/* Title & Price */}
            <div>
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold mb-1">
                <span>{raffle.category}</span>
                <span>•</span>
                <span>{raffle.total_numbers.toLocaleString("pt-BR")} Bilhetes</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {raffle.title}
              </h1>
            </div>

            {/* Price Pill */}
            <div className="flex items-baseline justify-between rounded-2xl bg-zinc-950 border border-zinc-800/80 p-4">
              <span className="text-xs font-semibold text-zinc-400">Preço por cota:</span>
              <span className="text-2xl font-black text-emerald-400">
                R$ {raffle.price_per_number.toFixed(2).replace(".", ",")}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-zinc-400">
                  {raffle.sold_count.toLocaleString("pt-BR")} vendidas ({raffle.progress_percentage}%)
                </span>
                <span className="text-zinc-300">
                  {(raffle.total_numbers - raffle.sold_count).toLocaleString("pt-BR")} restantes
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-950">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(5, raffle.progress_percentage))}%` }}
                />
              </div>
            </div>

            {/* Organizer Profile Card */}
            {raffle.tenant && (
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                <Link
                  href={`/o/${raffle.tenant.slug}`}
                  className="flex items-center gap-2.5 group"
                >
                  <div className="h-9 w-9 overflow-hidden rounded-full bg-zinc-800 border border-zinc-700">
                    {raffle.tenant.logo_url ? (
                      <img src={raffle.tenant.logo_url} alt="Logo" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xs font-bold text-white">
                        {raffle.tenant.name[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-zinc-200 group-hover:text-emerald-400 transition-colors">
                        {raffle.tenant.name}
                      </span>
                      {raffle.tenant.is_verified && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-400">Organizador Verificado</span>
                  </div>
                </Link>

                {raffle.tenant.whatsapp && (
                  <a
                    href={`https://wa.me/55${raffle.tenant.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> Suporte
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Cotas Premiadas (Instant Prizes) Card if available */}
          {raffle.lucky_numbers && raffle.lucky_numbers.length > 0 && (
            <div className="rounded-3xl bg-gradient-to-b from-amber-950/20 to-zinc-900 border border-amber-500/30 p-5 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs sm:text-sm">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Cotas Premiadas (Ganhe no PIX na Hora!)</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {raffle.lucky_numbers.map((lucky: any, idx: number) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                      lucky.claimed
                        ? "bg-zinc-950/80 border-zinc-800 text-zinc-500"
                        : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm">
                        {lucky.claimed ? lucky.number : "????"}
                      </span>
                      <span className="font-semibold">{lucky.prize}</span>
                    </div>
                    {lucky.claimed ? (
                      <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-bold">
                        Ganha por {lucky.winner_name?.split(" ")[0]}
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-500 text-zinc-950 px-2 py-0.5 rounded-full font-black animate-pulse">
                        DISPONÍVEL
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Compradores Ranking Card if present */}
          {raffle.top_buyers && raffle.top_buyers.length > 0 && (
            <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span>Ranking Top Compradores</span>
                </div>
                <span className="text-zinc-400 font-normal text-[11px]">Atualizado ao vivo</span>
              </div>
              <div className="space-y-2">
                {raffle.top_buyers.map((buyer: any) => (
                  <div
                    key={buyer.position}
                    className="flex items-center justify-between rounded-xl bg-zinc-950 p-2.5 text-xs border border-zinc-800/80"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${
                          buyer.position === 1
                            ? "bg-amber-400 text-zinc-950"
                            : buyer.position === 2
                            ? "bg-zinc-300 text-zinc-950"
                            : "bg-amber-700 text-white"
                        }`}
                      >
                        {buyer.position}º
                      </span>
                      <span className="font-medium text-zinc-300">{buyer.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-400">{buyer.total_tickets} cotas</span>
                      {buyer.prize_description && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md font-bold">
                          {buyer.prize_description}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BUYING CONTROLS CONTAINER */}
          <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-6 space-y-6 shadow-xl">
            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-zinc-950 p-1.5 border border-zinc-800">
              <button
                onClick={() => setMode("QUICK")}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  mode === "QUICK"
                    ? "bg-emerald-500 text-zinc-950 shadow-md"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Layers className="w-4 h-4" /> Cotas Rápidas
              </button>
              <button
                onClick={() => setMode("MANUAL")}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  mode === "MANUAL"
                    ? "bg-emerald-500 text-zinc-950 shadow-md"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Grid className="w-4 h-4" /> Escolher Números
              </button>
            </div>

            {/* MODE 1: QUICK PACKAGES */}
            {mode === "QUICK" && (
              <div className="space-y-4">
                <div className="text-xs font-semibold text-zinc-400 flex justify-between">
                  <span>Selecione a quantidade de bilhetes:</span>
                  {bestDiscountPercent > 0 && (
                    <span className="text-emerald-400 font-bold">
                      {bestDiscountPercent}% de Desconto aplicado!
                    </span>
                  )}
                </div>

                {/* Quick Add Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[10, 25, 50, 100, 250, 500].map((qty) => {
                    const active = quantity === qty;
                    // Check discount for this specific qty
                    const combo = raffle.discount_combos?.find((c: any) => c.quantity === qty);
                    return (
                      <button
                        key={qty}
                        onClick={() => setQuantity(qty)}
                        className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
                          active
                            ? "bg-emerald-500/10 border-emerald-500 text-white shadow-md shadow-emerald-500/10"
                            : "bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                        }`}
                      >
                        {combo && (
                          <span className="absolute -top-2.5 bg-emerald-500 text-zinc-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                            {combo.discount_percentage}% OFF
                          </span>
                        )}
                        <span className="text-base font-black">+{qty}</span>
                        <span className="text-[11px] text-zinc-400 font-semibold">
                          cotas
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Counter Input */}
                <div className="flex items-center justify-between rounded-2xl bg-zinc-950 border border-zinc-800 p-2">
                  <button
                    onClick={() => setQuantity((prev) => Math.max(raffle.min_purchase || 1, prev - 5))}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-zinc-300 hover:bg-zinc-800 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="text-center">
                    <span className="text-lg font-black text-white">{quantity}</span>
                    <span className="text-xs text-zinc-500 block -mt-1">cotas selecionadas</span>
                  </div>
                  <button
                    onClick={() => setQuantity((prev) => prev + 5)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-zinc-300 hover:bg-zinc-800 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* MODE 2: MANUAL NUMBER GRID */}
            {mode === "MANUAL" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Escolha seus números da sorte:</span>
                  <span className="text-emerald-400 font-bold">
                    {selectedManualNumbers.length} selecionados
                  </span>
                </div>

                {/* Search / Filter bar for grid */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Filtrar por número específico..."
                    value={gridSearch}
                    onChange={(e) => setGridSearch(e.target.value)}
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-800 pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Virtualized/Sample Grid Box */}
                <div className="max-h-64 overflow-y-auto rounded-2xl bg-zinc-950 border border-zinc-800 p-3 flex flex-wrap gap-1.5">
                  {Array.from({ length: Math.min(200, raffle.total_numbers) }).map((_, i) => {
                    const pad = (raffle.total_numbers - 1).toString().length;
                    const numStr = i.toString().padStart(pad, "0");

                    if (gridSearch && !numStr.includes(gridSearch)) return null;

                    const occupied = gridData?.occupied_map?.[numStr];
                    const isSelected = selectedManualNumbers.includes(numStr);
                    const isLucky = gridData?.lucky_numbers?.includes(numStr);

                    let statusClass = "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700";
                    if (occupied) {
                      statusClass = "bg-red-950/40 border-red-900/50 text-red-400 cursor-not-allowed opacity-50";
                    } else if (isSelected) {
                      statusClass = "bg-emerald-500 border-emerald-400 text-zinc-950 font-black scale-105";
                    } else if (isLucky) {
                      statusClass = "bg-amber-500/20 border-amber-500/50 text-amber-300 animate-pulse";
                    }

                    return (
                      <button
                        key={i}
                        disabled={!!occupied}
                        onClick={() => handleManualToggle(numStr)}
                        className={`h-8 min-w-[40px] px-1.5 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${statusClass}`}
                      >
                        {numStr}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-3 text-[10px] text-zinc-400 pt-1">
                  <div className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded bg-zinc-900 border border-zinc-700"></span> Disponível
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded bg-emerald-500"></span> Selecionado
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded bg-red-900"></span> Ocupado
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded bg-amber-500"></span> Cota Premiada
                  </div>
                </div>
              </div>
            )}

            {/* Price Summary & Purchase Button */}
            <div className="space-y-3 pt-4 border-t border-zinc-800">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Subtotal:</span>
                <span>R$ {baseTotal.toFixed(2).replace(".", ",")}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
                  <span>Desconto aplicado:</span>
                  <span>- R$ {discountAmount.toFixed(2).replace(".", ",")}</span>
                </div>
              )}
              <div className="flex items-baseline justify-between text-base font-black text-white">
                <span>Total a Pagar:</span>
                <span className="text-xl text-emerald-400">
                  R$ {finalTotal.toFixed(2).replace(".", ",")}
                </span>
              </div>

              <button
                disabled={activeQuantity === 0}
                onClick={() => setCheckoutOpen(true)}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 text-base font-black text-zinc-950 shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 disabled:opacity-50 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Zap className="w-5 h-5 fill-zinc-950" />
                Participar Agora ({activeQuantity} cotas)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        raffle={raffle}
        quantity={activeQuantity}
        manualNumbers={mode === "MANUAL" ? selectedManualNumbers : undefined}
        unitPrice={unitPrice}
        discountAmount={discountAmount}
        totalAmount={finalTotal}
      />
    </div>
  );
}
