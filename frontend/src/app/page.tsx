"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api";
import RaffleCard from "@/components/RaffleCard";
import {
  Sparkles,
  Search,
  Flame,
  Car,
  Smartphone,
  Banknote,
  Gift,
  ShieldCheck,
  Zap,
  Trophy,
  ArrowRight,
  CheckCircle2,
  Users,
  Clock,
  Loader2,
  Star,
  Check
} from "lucide-react";

const CATEGORIES = [
  { name: "Todos", icon: Flame },
  { name: "Automóveis", icon: Car },
  { name: "Eletrônicos", icon: Smartphone },
  { name: "Dinheiro / Pix", icon: Banknote },
];

const RECENT_WINNERS = [
  {
    name: "Marcos Vinícius S.",
    city: "Belo Horizonte / MG",
    prize: "Honda Civic G10 2.0 Turbo",
    number: "74218",
    date: "15/08/2026",
    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&auto=format&fit=crop&q=80",
    quote: "Comprei 50 cotas no PIX e fui contemplado na extração da Loteria Federal! Entrega 100% rápida."
  },
  {
    name: "Juliana Mendes",
    city: "Campinas / SP",
    prize: "iPhone 16 Pro Max 256GB",
    number: "04912",
    date: "02/08/2026",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02560?w=600&auto=format&fit=crop&q=80",
    quote: "Achei uma cota premiada na hora da compra e ainda levei o prêmio principal!"
  },
  {
    name: "Eduardo Rocha",
    city: "Goiânia / GO",
    prize: "R$ 50.000 no PIX",
    number: "88231",
    date: "26/07/2026",
    image: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80",
    quote: "Dinheiro caiu na conta em menos de 10 minutos após a auditoria do sorteio."
  }
];

export default function HomePage() {
  const [raffles, setRaffles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"DEFAULT" | "PROGRESS" | "PRICE_ASC">("DEFAULT");

  useEffect(() => {
    const fetchRaffles = async () => {
      setLoading(true);
      try {
        const response = await api.get("/raffles", {
          params: {
            category: selectedCategory !== "Todos" ? selectedCategory : undefined,
            search: searchTerm || undefined,
          },
        });
        setRaffles(response.data);
      } catch (error) {
        console.error("Error fetching raffles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRaffles();
  }, [selectedCategory, searchTerm]);

  let displayedRaffles = [...raffles];
  if (sortBy === "PROGRESS") {
    displayedRaffles.sort((a, b) => b.progress_percentage - a.progress_percentage);
  } else if (sortBy === "PRICE_ASC") {
    displayedRaffles.sort((a, b) => a.price_per_number - b.price_per_number);
  }

  return (
    <div className="space-y-16 pb-24">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 border-b border-zinc-800/80 bg-gradient-to-b from-emerald-950/25 via-zinc-950 to-zinc-950">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[380px] bg-emerald-500/15 blur-[140px] pointer-events-none rounded-full" />

        <div className="container mx-auto max-w-7xl px-4 sm:px-6 relative z-10 text-center space-y-6">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-4 py-1.5 text-xs font-bold text-emerald-400 backdrop-blur-md shadow-lg shadow-emerald-500/10">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            <span>Plataforma Oficial de Sorteios & Rifas Digitais</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Sua Chance de Mudar de Vida a Partir de{" "}
            <span className="text-gradient">R$ 0,35 no PIX</span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-zinc-300 max-w-2xl mx-auto leading-relaxed">
            Motos, Carros 0km, iPhones e PIX na conta com extração oficial da Loteria Federal.
            Compre suas cotas em segundos com baixa automática imediata!
          </p>

          {/* Quick Search & Filters Bar */}
          <div className="max-w-2xl mx-auto pt-2">
            <div className="relative flex items-center shadow-2xl">
              <Search className="absolute left-4 w-5 h-5 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar por moto, iPhone, carro, PIX..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl bg-zinc-900/95 border border-zinc-700/90 pl-12 pr-4 py-4 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 backdrop-blur-md"
              />
            </div>
          </div>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto pt-6 text-left">
            <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-zinc-400 font-medium">Pagamento</p>
                <p className="text-sm font-black text-white">PIX Instantâneo</p>
              </div>
            </div>

            <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-zinc-400 font-medium">Auditoria</p>
                <p className="text-sm font-black text-white">Loteria Federal</p>
              </div>
            </div>

            <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-zinc-400 font-medium">Instantâneo</p>
                <p className="text-sm font-black text-white">Cotas Premiadas</p>
              </div>
            </div>

            <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-zinc-400 font-medium">Ganhadores</p>
                <p className="text-sm font-black text-white">+5.000 Felizes</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RAFFLE LISTING SECTION */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 space-y-8">
        {/* Category Filter Pills & Sorters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const active = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                    active
                      ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20 scale-105"
                      : "bg-zinc-900 text-zinc-300 border border-zinc-800 hover:text-white hover:border-zinc-700"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="DEFAULT">🔥 Em Destaque</option>
              <option value="PROGRESS">⚡ Quase Esgotando</option>
              <option value="PRICE_ASC">💰 Menor Preço</option>
            </select>

            <span className="text-xs font-bold text-zinc-400 shrink-0">
              {displayedRaffles.length} {displayedRaffles.length === 1 ? "campanha ativa" : "campanhas ativas"}
            </span>
          </div>
        </div>

        {/* Raffles Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-sm text-zinc-400">Carregando rifas em tempo real...</p>
          </div>
        ) : displayedRaffles.length === 0 ? (
          <div className="text-center py-20 rounded-3xl bg-zinc-900/40 border border-zinc-800 p-8 space-y-3">
            <p className="text-base font-bold text-zinc-300">Nenhuma rifa encontrada nesta categoria.</p>
            <p className="text-xs text-zinc-500">Tente buscar por outro termo ou selecione "Todos".</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedRaffles.map((raffle) => (
              <RaffleCard key={raffle.id} raffle={raffle} />
            ))}
          </div>
        )}
      </section>

      {/* WINNERS & SOCIAL PROOF SECTION */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 pt-4">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-1">
                <Trophy className="w-4 h-4" /> Prova Social & Transparência
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Últimos Ganhadores Oficiais
              </h2>
            </div>
            <p className="text-xs text-zinc-400 max-w-sm">
              Sorteios 100% auditados com prêmios entregues e comprovados em todo o Brasil.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {RECENT_WINNERS.map((winner, idx) => (
              <div
                key={idx}
                className="rounded-3xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-xl flex flex-col justify-between hover:border-amber-500/40 transition-all group"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-950">
                  <img
                    src={winner.image}
                    alt={winner.prize}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/30" />
                  <div className="absolute top-3 left-3 bg-amber-500 text-zinc-950 px-2.5 py-1 rounded-full text-[10px] font-black uppercase shadow-md flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Entregue
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 text-xs flex justify-between items-center text-white">
                    <span className="font-bold">{winner.city}</span>
                    <span className="bg-black/70 px-2 py-0.5 rounded-lg border border-white/10 font-mono text-[11px]">
                      Cota {winner.number}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-zinc-400 block font-semibold">{winner.date}</span>
                    <h3 className="text-base font-black text-white">{winner.prize}</h3>
                    <p className="text-xs text-zinc-300 italic leading-relaxed">
                      "{winner.quote}"
                    </p>
                  </div>

                  <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-300 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {winner.name}
                    </span>
                    <span className="text-[11px] text-emerald-400 font-bold">100% Auditado</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="como-funciona" className="container mx-auto max-w-7xl px-4 sm:px-6 pt-4">
        <div className="rounded-3xl bg-zinc-900/80 border border-zinc-800 p-8 sm:p-12 relative overflow-hidden shadow-2xl">
          <div className="text-center space-y-3 max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Como Funciona a <span className="text-emerald-400">Rifa Digital</span>?
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300">
              Processo 100% transparente, seguro e automatizado do início ao fim.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="space-y-3 p-5 rounded-2xl bg-zinc-950/90 border border-zinc-800/90">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-zinc-950 font-black text-sm">
                1
              </div>
              <h3 className="text-base font-bold text-white">Escolha sua Rifa</h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Navegue pelas campanhas disponíveis de motos, carros, eletrônicos ou dinheiro no PIX.
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-3 p-5 rounded-2xl bg-zinc-950/90 border border-zinc-800/90">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-zinc-950 font-black text-sm">
                2
              </div>
              <h3 className="text-base font-bold text-white">Selecione as Cotas</h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Escolha a quantidade desejada ou aproveite os combos com descontos progressivos.
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-3 p-5 rounded-2xl bg-zinc-950/90 border border-zinc-800/90">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-zinc-950 font-black text-sm">
                3
              </div>
              <h3 className="text-base font-bold text-white">Pague via PIX</h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Copie o código PIX ou escaneie o QR Code. A confirmação ocorre em segundos automaticamente.
              </p>
            </div>

            {/* Step 4 */}
            <div className="space-y-3 p-5 rounded-2xl bg-zinc-950/90 border border-zinc-800/90">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-zinc-950 font-black text-sm">
                4
              </div>
              <h3 className="text-base font-bold text-white">Concorra e Ganhe</h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Acompanhe o sorteio ao vivo e confira se achou alguma Cota Premiada instantânea.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ORGANIZER CTA SECTION */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-900/40 via-zinc-900 to-zinc-900 border border-emerald-500/30 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="space-y-3 max-w-xl text-left">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" /> Modelo Multi-Tenant / SaaS
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Quer Criar suas Próprias Rifas e Faturar Online?
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Tenha sua própria página personalizada com sua logo, WhatsApp, cotas premiadas, combos promocionais e receba direto via PIX com baixa automática.
            </p>
          </div>

          <Link
            href="/cadastro"
            className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-4 text-sm font-black text-zinc-950 shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 transition-all hover:scale-105 shrink-0"
          >
            Começar a Criar Rifas Agora
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
