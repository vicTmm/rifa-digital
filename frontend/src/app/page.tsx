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
  Loader2
} from "lucide-react";

const CATEGORIES = [
  { name: "Todos", icon: Flame },
  { name: "Automóveis", icon: Car },
  { name: "Eletrônicos", icon: Smartphone },
  { name: "Dinheiro / Pix", icon: Banknote },
];

export default function HomePage() {
  const [raffles, setRaffles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");

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

  const featuredRaffles = raffles.filter((r) => r.is_featured);

  return (
    <div className="space-y-16 pb-20">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 border-b border-zinc-800/60 bg-gradient-to-b from-emerald-950/20 via-zinc-950 to-zinc-950">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 blur-[130px] pointer-events-none rounded-full" />

        <div className="container mx-auto max-w-7xl px-4 sm:px-6 relative z-10 text-center space-y-6">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-4 py-1.5 text-xs font-bold text-emerald-400 backdrop-blur-md shadow-lg shadow-emerald-500/10">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>Plataforma Oficial de Sorteios & Rifas Digitais</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Sua Chance de Mudar de Vida a Partir de{" "}
            <span className="text-gradient">R$ 0,35 no PIX</span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Motos, Carros 0km, iPhones e PIX na conta com extração pela Loteria Federal.
            Compre suas cotas em segundos com baixa automática imediata!
          </p>

          {/* Quick Search & Filters Bar */}
          <div className="max-w-2xl mx-auto pt-4">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar por moto, iPhone, carro, PIX..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl bg-zinc-900/90 border border-zinc-700/80 pl-12 pr-4 py-4 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 backdrop-blur-md shadow-xl"
              />
            </div>
          </div>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto pt-6 text-left">
            <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-3.5 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-zinc-400">Pagamento</p>
                <p className="text-sm font-bold text-white">PIX Imediato</p>
              </div>
            </div>

            <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-3.5 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-zinc-400">Auditoria</p>
                <p className="text-sm font-bold text-white">Loteria Federal</p>
              </div>
            </div>

            <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-3.5 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-zinc-400">Instantâneo</p>
                <p className="text-sm font-bold text-white">Cotas Premiadas</p>
              </div>
            </div>

            <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-3.5 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-zinc-400">Ganhadores</p>
                <p className="text-sm font-bold text-white">+5.000 Premiados</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RAFFLE LISTING SECTION */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 space-y-8">
        {/* Category Filter Pills */}
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const active = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                    active
                      ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20 scale-105"
                      : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white hover:border-zinc-700"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          <span className="text-xs font-semibold text-zinc-400">
            {raffles.length} {raffles.length === 1 ? "campanha ativa" : "campanhas ativas"}
          </span>
        </div>

        {/* Raffles Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-sm text-zinc-400">Carregando rifas em tempo real...</p>
          </div>
        ) : raffles.length === 0 ? (
          <div className="text-center py-20 rounded-3xl bg-zinc-900/40 border border-zinc-800 p-8 space-y-3">
            <p className="text-base font-bold text-zinc-300">Nenhuma rifa encontrada nesta categoria.</p>
            <p className="text-xs text-zinc-500">Tente buscar por outro termo ou selecione "Todos".</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {raffles.map((raffle) => (
              <RaffleCard key={raffle.id} raffle={raffle} />
            ))}
          </div>
        )}
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="como-funciona" className="container mx-auto max-w-7xl px-4 sm:px-6 pt-12">
        <div className="rounded-3xl bg-zinc-900/70 border border-zinc-800 p-8 sm:p-12 relative overflow-hidden">
          <div className="text-center space-y-3 max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Como Funciona a <span className="text-emerald-400">Rifa Digital</span>?
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Processo 100% transparente, seguro e automatizado do início ao fim.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="space-y-3 p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-zinc-950 font-black text-sm">
                1
              </div>
              <h3 className="text-base font-bold text-white">Escolha sua Rifa</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Navegue pelas campanhas disponíveis de motos, carros, eletrônicos ou dinheiro no PIX.
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-3 p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-zinc-950 font-black text-sm">
                2
              </div>
              <h3 className="text-base font-bold text-white">Selecione as Cotas</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Escolha a quantidade desejada ou aproveite os combos com descontos progressivos.
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-3 p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-zinc-950 font-black text-sm">
                3
              </div>
              <h3 className="text-base font-bold text-white">Pague via PIX</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Copie o código PIX ou escaneie o QR Code. A confirmação ocorre em segundos automaticamente.
              </p>
            </div>

            {/* Step 4 */}
            <div className="space-y-3 p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-zinc-950 font-black text-sm">
                4
              </div>
              <h3 className="text-base font-bold text-white">Concorra e Ganhe</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Acompanhe o sorteio ao vivo e confira se achou alguma Cota Premiada instantânea.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ORGANIZER CTA SECTION */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-900/40 via-zinc-900 to-zinc-900 border border-emerald-500/30 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
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
