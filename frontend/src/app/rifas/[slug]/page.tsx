"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import api from "@/lib/api";
import CheckoutModal from "@/components/CheckoutModal";
import { formatBRL, formatNumber } from "@/lib/masks";
import { useToast } from "@/context/ToastContext";
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
  Loader2,
  Dices,
  Info,
  TrendingUp
} from "lucide-react";

export default function RaffleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const toast = useToast();

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
  const [currentBatch, setCurrentBatch] = useState(0);
  const BATCH_SIZE = 100;

  // Checkout modal
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Simulated live purchase alert for social proof
  const [recentBuyer, setRecentBuyer] = useState<{ name: string; city: string; qty: number } | null>(null);

  useEffect(() => {
    const buyers = [
      { name: "Lucas M.", city: "São Paulo/SP", qty: 50 },
      { name: "Rodrigo S.", city: "Belo Horizonte/MG", qty: 100 },
      { name: "Mariana F.", city: "Curitiba/PR", qty: 25 },
      { name: "Gabriel T.", city: "Goiânia/GO", qty: 250 },
      { name: "Fernanda C.", city: "Rio de Janeiro/RJ", qty: 50 },
    ];
    let idx = 0;
    const interval = setInterval(() => {
      setRecentBuyer(buyers[idx % buyers.length]);
      idx++;
      setTimeout(() => setRecentBuyer(null), 5000);
    }, 14000);

    return () => clearInterval(interval);
  }, []);

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
        <p className="text-sm text-zinc-400">Carregando detalhes da campanha oficial...</p>
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

  const handleSelectRandom = (count: number) => {
    const pad = (raffle.total_numbers - 1).toString().length;
    const availableNumbers: string[] = [];
    
    // Pick random available numbers
    for (let i = 0; i < raffle.total_numbers; i++) {
      const numStr = i.toString().padStart(pad, "0");
      if (!gridData?.occupied_map?.[numStr] && !selectedManualNumbers.includes(numStr)) {
        availableNumbers.push(numStr);
      }
      if (availableNumbers.length > 1000) break; // sample pool
    }

    const shuffled = availableNumbers.sort(() => 0.5 - Math.random());
    const picked = shuffled.slice(0, count);
    
    setSelectedManualNumbers((prev) => [...prev, ...picked]);
    toast.success(`+${picked.length} números da sorte selecionados aleatoriamente!`);
  };

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({
        title: raffle.title,
        text: `Participe da rifa oficial: ${raffle.title}`,
        url: window.location.href,
      }).catch(() => {});
    } else if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiado para a área de transferência!");
    }
  };

  const totalBatches = Math.ceil(raffle.total_numbers / BATCH_SIZE);

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-6 pb-28 md:pb-20 space-y-8">
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
          className="flex items-center gap-1.5 rounded-xl bg-zinc-900 border border-zinc-800 px-3.5 py-2 text-xs font-bold text-zinc-300 hover:text-white hover:border-zinc-700 transition-all cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" /> Compartilhar
        </button>
      </div>

      {/* Live Social Proof Floating Alert */}
      {recentBuyer && (
        <div className="fixed top-20 right-4 z-40 max-w-xs rounded-2xl bg-zinc-900/95 border border-emerald-500/40 p-3 shadow-2xl backdrop-blur-xl animate-in slide-in-from-right duration-300 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
            <Zap className="w-5 h-5 fill-emerald-400" />
          </div>
          <div className="text-xs">
            <p className="font-bold text-white leading-tight">{recentBuyer.name} ({recentBuyer.city})</p>
            <p className="text-emerald-400 font-semibold">Garantiru +{recentBuyer.qty} cotas agora mesmo!</p>
          </div>
        </div>
      )}

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
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

            {raffle.badge_text && (
              <div className="absolute top-4 left-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3.5 py-1 text-xs font-black text-zinc-950 shadow-lg shadow-emerald-500/30">
                  <Flame className="w-3.5 h-3.5 fill-zinc-950" /> {raffle.badge_text}
                </span>
              </div>
            )}

            {/* Quick Draw Type Badge */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-black/70 backdrop-blur-md px-3 py-1.5 text-zinc-200 border border-white/10 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                {raffle.draw_type === "FEDERAL" ? "Extração Loteria Federal" : "Sorteio Eletrônico Auditável"}
              </span>
            </div>
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
          <div className="rounded-3xl bg-zinc-900/60 border border-zinc-800 p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Gift className="w-4 h-4 text-emerald-400" /> Regulamento & Detalhes do Prêmio
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
              {raffle.description || "Participe desta incrível campanha e concorra a prêmios imperdíveis."}
            </p>
          </div>

          {/* Sorteio Auditado Info Box */}
          <div className="rounded-3xl bg-zinc-900/60 border border-zinc-800 p-6 flex items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">Garantia de Entrega & Auditoria Oficial</h4>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {raffle.draw_type === "FEDERAL"
                  ? "O resultado desta ação é vinculado diretamente à extração oficial da Caixa Econômica Federal na data marcada. Transparência pública e auditável por qualquer pessoa."
                  : "Sorteio eletrônico com algoritmo criptográfico transparente e registro auditável de todas as cotas pagas."}
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
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold mb-1">
                <span>{raffle.category}</span>
                <span>•</span>
                <span>{formatNumber(raffle.total_numbers)} Cotas</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {raffle.title}
              </h1>
            </div>

            {/* Price Pill with High Contrast */}
            <div className="flex items-baseline justify-between rounded-2xl bg-zinc-950 border border-zinc-800 p-4">
              <span className="text-xs font-bold text-zinc-400">Por apenas:</span>
              <span className="text-2xl font-black text-emerald-400">
                {formatBRL(raffle.price_per_number)} <span className="text-xs text-zinc-400 font-normal">/ cota</span>
              </span>
            </div>

            {/* Progress Bar with Shimmer */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-zinc-300">
                  {formatNumber(raffle.sold_count)} cotas pagas ({raffle.progress_percentage}%)
                </span>
                <span className="text-emerald-400">
                  {formatNumber(raffle.total_numbers - raffle.sold_count)} restantes
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-950 relative">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-500 relative"
                  style={{ width: `${Math.min(100, Math.max(5, raffle.progress_percentage))}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-shimmer" />
                </div>
              </div>
              {raffle.progress_percentage >= 70 && (
                <p className="text-[11px] text-amber-400 font-bold flex items-center gap-1 pt-1">
                  <Flame className="w-3.5 h-3.5 fill-amber-400" /> Mais de {raffle.progress_percentage}% vendido! Garanta suas cotas antes que esgote.
                </p>
              )}
            </div>

            {/* Organizer Profile Card */}
            {raffle.tenant && (
              <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                <Link
                  href={`/o/${raffle.tenant.slug}`}
                  className="flex items-center gap-2.5 group"
                >
                  <div className="h-9 w-9 overflow-hidden rounded-full bg-zinc-800 border border-zinc-700">
                    {raffle.tenant.logo_url ? (
                      <img src={raffle.tenant.logo_url} alt="Logo" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xs font-bold text-white bg-emerald-600">
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
                    <span className="text-[11px] text-zinc-400">Organizador Verificado</span>
                  </div>
                </Link>

                {raffle.tenant.whatsapp && (
                  <a
                    href={`https://wa.me/55${raffle.tenant.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Cotas Premiadas (Instant Prizes) Card if available */}
          {raffle.lucky_numbers && raffle.lucky_numbers.length > 0 && (
            <div className="rounded-3xl bg-gradient-to-b from-amber-950/20 to-zinc-900 border border-amber-500/30 p-5 space-y-3 shadow-lg glow-amber">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 font-black text-xs sm:text-sm">
                  <Trophy className="w-4 h-4 text-yellow-400 animate-pulse" />
                  <span>Cotas Premiadas (PIX Instantâneo na Hora)</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {raffle.lucky_numbers.map((lucky: any, idx: number) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-2xl border text-xs transition-all ${
                      lucky.claimed
                        ? "bg-zinc-950/80 border-zinc-800 text-zinc-500"
                        : "bg-amber-500/10 border-amber-500/40 text-amber-300 hover:scale-[1.02]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-black text-sm text-amber-400">
                        {lucky.claimed ? lucky.number : "🔒 ????"}
                      </span>
                      <span className="font-bold text-zinc-100">{lucky.prize}</span>
                    </div>
                    {lucky.claimed ? (
                      <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2.5 py-0.5 rounded-full font-bold">
                        Ganha por {lucky.winner_name?.split(" ")[0]}
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-500 text-zinc-950 px-2.5 py-0.5 rounded-full font-black animate-pulse shadow-sm">
                        DISPONÍVEL
                      </span>
                    )}
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
                className={`flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  mode === "QUICK"
                    ? "bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20 scale-[1.02]"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Layers className="w-4 h-4" /> Cotas Rápidas (Mais Popular)
              </button>
              <button
                onClick={() => setMode("MANUAL")}
                className={`flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  mode === "MANUAL"
                    ? "bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20 scale-[1.02]"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Grid className="w-4 h-4" /> Escolher Números no Mapa
              </button>
            </div>

            {/* MODE 1: QUICK PACKAGES WITH HIGHLIGHTS */}
            {mode === "QUICK" && (
              <div className="space-y-4">
                <div className="text-xs font-bold text-zinc-300 flex justify-between">
                  <span>Escolha o pacote com desconto:</span>
                  {bestDiscountPercent > 0 && (
                    <span className="text-emerald-400 font-black">
                      ⚡ {bestDiscountPercent}% DE DESCONTO APLICADO!
                    </span>
                  )}
                </div>

                {/* Quick Add Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { qty: 10, label: "+10 cotas", popular: false },
                    { qty: 25, label: "+25 cotas", popular: false },
                    { qty: 50, label: "+50 cotas", popular: true, tag: "MAIS VENDIDO" },
                    { qty: 100, label: "+100 cotas", popular: false, tag: "SUPER PROMO" },
                    { qty: 250, label: "+250 cotas", popular: false, tag: "MAIOR CHANCE" },
                    { qty: 500, label: "+500 cotas", popular: false, tag: "VIP" },
                  ].map((item) => {
                    const active = quantity === item.qty;
                    const combo = raffle.discount_combos?.find((c: any) => c.quantity === item.qty);
                    const pkgRawTotal = item.qty * unitPrice;
                    const pkgDiscount = combo ? pkgRawTotal * (combo.discount_percentage / 100) : 0;
                    const pkgFinal = pkgRawTotal - pkgDiscount;

                    return (
                      <button
                        key={item.qty}
                        onClick={() => setQuantity(item.qty)}
                        className={`relative flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          active
                            ? "bg-emerald-500/15 border-emerald-500 text-white shadow-xl shadow-emerald-500/10 scale-105"
                            : item.popular
                            ? "bg-zinc-950 border-emerald-500/40 text-zinc-200 hover:border-emerald-400"
                            : "bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                        }`}
                      >
                        {item.tag && (
                          <span className="absolute -top-2.5 bg-gradient-to-r from-emerald-400 to-green-500 text-zinc-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase shadow-md">
                            {item.tag}
                          </span>
                        )}
                        <span className="text-lg font-black">{item.label}</span>
                        <span className="text-xs font-black text-emerald-400 pt-0.5">
                          {formatBRL(pkgFinal)}
                        </span>
                        {combo && (
                          <span className="text-[10px] text-zinc-400 line-through">
                            {formatBRL(pkgRawTotal)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Counter Input */}
                <div className="flex items-center justify-between rounded-2xl bg-zinc-950 border border-zinc-800 p-2">
                  <button
                    onClick={() => setQuantity((prev) => Math.max(raffle.min_purchase || 1, prev - 5))}
                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 text-zinc-200 hover:bg-zinc-800 transition-colors font-bold"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <div className="text-center">
                    <span className="text-xl font-black text-white">{quantity}</span>
                    <span className="text-xs text-zinc-400 block -mt-1 font-semibold">cotas selecionadas</span>
                  </div>
                  <button
                    onClick={() => setQuantity((prev) => prev + 5)}
                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 text-zinc-200 hover:bg-zinc-800 transition-colors font-bold"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* MODE 2: ADVANCED MANUAL NUMBER GRID */}
            {mode === "MANUAL" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-zinc-300 font-bold">
                  <span>Selecione seus números da sorte:</span>
                  <span className="text-emerald-400 font-black">
                    {selectedManualNumbers.length} números marcados
                  </span>
                </div>

                {/* Quick Random Pick Buttons */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <span className="text-[11px] text-zinc-400 flex items-center gap-1 shrink-0">
                    <Dices className="w-3.5 h-3.5 text-emerald-400" /> Aleatório:
                  </span>
                  {[5, 10, 25, 50].map((n) => (
                    <button
                      key={n}
                      onClick={() => handleSelectRandom(n)}
                      className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-bold text-zinc-300 hover:border-emerald-500 hover:text-emerald-400 transition-all shrink-0 cursor-pointer"
                    >
                      +{n}
                    </button>
                  ))}
                  {selectedManualNumbers.length > 0 && (
                    <button
                      onClick={() => setSelectedManualNumbers([])}
                      className="px-2.5 py-1 rounded-lg bg-red-950/40 border border-red-500/30 text-xs font-bold text-red-400 hover:bg-red-950 transition-all shrink-0 cursor-pointer ml-auto"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                {/* Search / Filter bar for grid */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Digitar número exato (ex: 0777)..."
                    value={gridSearch}
                    onChange={(e) => setGridSearch(e.target.value)}
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-800 pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Batch Range Tabs if large raffle */}
                {totalBatches > 1 && !gridSearch && (
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {Array.from({ length: Math.min(10, totalBatches) }).map((_, bIdx) => (
                      <button
                        key={bIdx}
                        onClick={() => setCurrentBatch(bIdx)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all shrink-0 cursor-pointer ${
                          currentBatch === bIdx
                            ? "bg-emerald-500 text-zinc-950"
                            : "bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white"
                        }`}
                      >
                        {bIdx * BATCH_SIZE}-{(bIdx + 1) * BATCH_SIZE - 1}
                      </button>
                    ))}
                  </div>
                )}

                {/* Virtualized / Paginated Grid Box */}
                <div className="max-h-64 overflow-y-auto rounded-2xl bg-zinc-950 border border-zinc-800 p-3 flex flex-wrap gap-1.5">
                  {Array.from({ length: BATCH_SIZE }).map((_, i) => {
                    const pad = (raffle.total_numbers - 1).toString().length;
                    const numIndex = currentBatch * BATCH_SIZE + i;
                    if (numIndex >= raffle.total_numbers) return null;

                    const numStr = numIndex.toString().padStart(pad, "0");

                    if (gridSearch && !numStr.includes(gridSearch)) return null;

                    const occupied = gridData?.occupied_map?.[numStr];
                    const isSelected = selectedManualNumbers.includes(numStr);
                    const isLucky = gridData?.lucky_numbers?.includes(numStr);

                    let statusClass = "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700";
                    if (occupied) {
                      statusClass = "bg-red-950/40 border-red-900/50 text-red-400 cursor-not-allowed opacity-50";
                    } else if (isSelected) {
                      statusClass = "bg-emerald-500 border-emerald-400 text-zinc-950 font-black scale-105 shadow-md shadow-emerald-500/20";
                    } else if (isLucky) {
                      statusClass = "bg-amber-500/20 border-amber-500/50 text-amber-300 animate-pulse";
                    }

                    return (
                      <button
                        key={numIndex}
                        disabled={!!occupied}
                        onClick={() => handleManualToggle(numStr)}
                        className={`h-8 min-w-[42px] px-1 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${statusClass}`}
                      >
                        {numStr}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-3 text-[11px] text-zinc-400 pt-1 font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded bg-zinc-900 border border-zinc-700"></span> Disponível
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded bg-emerald-500"></span> Selecionado
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded bg-red-900"></span> Ocupado
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded bg-amber-500"></span> Cota Premiada
                  </div>
                </div>
              </div>
            )}

            {/* Price Summary & Purchase Button */}
            <div className="space-y-3 pt-4 border-t border-zinc-800">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Subtotal ({activeQuantity} cotas):</span>
                <span>{formatBRL(baseTotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-xs text-emerald-400 font-bold bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                  <span>Economia no combo:</span>
                  <span>- {formatBRL(discountAmount)}</span>
                </div>
              )}
              <div className="flex items-baseline justify-between text-base font-black text-white">
                <span>Total a Pagar:</span>
                <span className="text-2xl text-emerald-400 font-black">
                  {formatBRL(finalTotal)}
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

      {/* MOBILE STICKY BUY BAR (Core Conversion Engine on Phones) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 border-t border-zinc-800 p-3.5 backdrop-blur-xl md:hidden shadow-2xl flex items-center justify-between gap-3">
        <div>
          <span className="text-[11px] text-zinc-400 block leading-tight font-medium">
            {activeQuantity} {activeQuantity === 1 ? "cota selecionada" : "cotas selecionadas"}
          </span>
          <span className="text-lg font-black text-emerald-400 leading-tight">
            {formatBRL(finalTotal)}
          </span>
        </div>

        <button
          disabled={activeQuantity === 0}
          onClick={() => setCheckoutOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-black text-zinc-950 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
        >
          <Zap className="w-4 h-4 fill-zinc-950" /> Participar Agora
        </button>
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
