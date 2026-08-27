"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import confetti from "canvas-confetti";
import {
  Ticket,
  PlusCircle,
  DollarSign,
  TrendingUp,
  Users,
  Settings,
  Trophy,
  ExternalLink,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Flame,
  Layers,
  Sparkles,
  Zap,
  Clock,
  Play
} from "lucide-react";

export default function OrganizerDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<"CAMPAIGNS" | "NEW_RAFFLE" | "DRAW" | "SETTINGS">("CAMPAIGNS");
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [myRaffles, setMyRaffles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Raffle Form State
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Automóveis");
  const [newDescription, setNewDescription] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newPrice, setNewPrice] = useState(0.50);
  const [newTotalNumbers, setNewTotalNumbers] = useState(10000);
  const [newMinPurchase, setNewMinPurchase] = useState(1);
  const [newDrawType, setNewDrawType] = useState("FEDERAL");
  const [newDrawDate, setNewDrawDate] = useState("");
  const [newBadge, setNewBadge] = useState("🔥 LANÇAMENTO");
  const [creatingRaffle, setCreatingRaffle] = useState(false);
  const [createSuccess, setCreateSuccess] = useState("");
  const [createError, setCreateError] = useState("");

  // Draw State
  const [selectedRaffleForDraw, setSelectedRaffleForDraw] = useState<any>(null);
  const [drawWinningNumber, setDrawWinningNumber] = useState("");
  const [drawingLoading, setDrawingLoading] = useState(false);
  const [drawResult, setDrawResult] = useState<any>(null);

  // Store Settings State
  const [storeName, setStoreName] = useState("");
  const [storeSlug, setStoreSlug] = useState("");
  const [storeBio, setStoreBio] = useState("");
  const [storeWhatsapp, setStoreWhatsapp] = useState("");
  const [storeInstagram, setStoreInstagram] = useState("");
  const [storePixKey, setStorePixKey] = useState("");
  const [storeMpToken, setStoreMpToken] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, rafflesRes] = await Promise.all([
        api.get("/tenants/me/dashboard"),
        api.get("/raffles/my-raffles"),
      ]);
      setDashboardData(dashRes.data);
      setMyRaffles(rafflesRes.data);

      if (dashRes.data.tenant) {
        setStoreName(dashRes.data.tenant.name || "");
        setStoreSlug(dashRes.data.tenant.slug || "");
        setStoreWhatsapp(dashRes.data.tenant.whatsapp || "");
        setStorePixKey(dashRes.data.tenant.pix_key || "");
      }
    } catch (err) {
      console.error("Error loading dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== "ORGANIZER" && user.role !== "SUPERADMIN"))) {
      router.push("/login");
      return;
    }
    if (user) {
      fetchData();
    }
  }, [user, authLoading]);

  const handleCreateRaffle = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingRaffle(true);
    setCreateError("");
    setCreateSuccess("");

    try {
      const payload = {
        title: newTitle,
        description: newDescription,
        category: newCategory,
        images: newImageUrl ? [newImageUrl] : ["https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80"],
        price_per_number: Number(newPrice),
        total_numbers: Number(newTotalNumbers),
        min_purchase: Number(newMinPurchase),
        max_purchase: 10000,
        draw_type: newDrawType,
        draw_date: newDrawDate ? new Date(newDrawDate).toISOString() : null,
        badge_text: newBadge,
        is_featured: true,
        discount_combos: [
          { quantity: 50, discount_percentage: 10.0 },
          { quantity: 100, discount_percentage: 15.0 },
          { quantity: 250, discount_percentage: 20.0 }
        ],
        lucky_numbers: [
          { number: "00777", prize: "R$ 500 no PIX", claimed: false },
          { number: "12345", prize: "R$ 500 no PIX", claimed: false }
        ],
        ranking_prizes: [
          { position: 1, prize: "R$ 1.000 no PIX" },
          { position: 2, prize: "R$ 300 no PIX" }
        ]
      };

      const res = await api.post("/raffles", payload);
      setCreateSuccess(`Campanha "${res.data.title}" criada com sucesso!`);
      fetchData();
      setTimeout(() => {
        setActiveTab("CAMPAIGNS");
      }, 1500);
    } catch (err: any) {
      console.error("Create raffle error:", err);
      setCreateError(err.response?.data?.detail || "Erro ao criar rifa.");
    } finally {
      setCreatingRaffle(false);
    }
  };

  const handleExecuteDraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRaffleForDraw) return;

    setDrawingLoading(true);
    try {
      const res = await api.post(`/raffles/${selectedRaffleForDraw.id}/draw`, {
        winning_number: drawWinningNumber ? drawWinningNumber.trim() : null,
      });

      setDrawResult(res.data);
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
      });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Erro ao realizar sorteio.");
    } finally {
      setDrawingLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess("");

    try {
      await api.put("/tenants/me/profile", {
        name: storeName,
        slug: storeSlug,
        bio: storeBio,
        whatsapp: storeWhatsapp,
        instagram: storeInstagram,
        pix_key: storePixKey,
        mp_access_token: storeMpToken || undefined,
      });
      setSettingsSuccess("Configurações salvas com sucesso!");
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Erro ao salvar configurações.");
    } finally {
      setSavingSettings(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-sm text-zinc-400">Carregando painel do organizador...</p>
      </div>
    );
  }

  const stats = dashboardData?.stats || {};
  const tenant = dashboardData?.tenant || {};

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8 pb-24">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Painel do Organizador
            </h1>
            {tenant.is_verified && (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            )}
          </div>
          <p className="text-xs text-zinc-400">
            Loja: <strong className="text-zinc-200">{tenant.name}</strong> • Link público:{" "}
            <Link
              href={`/o/${tenant.slug}`}
              target="_blank"
              className="text-emerald-400 hover:underline inline-flex items-center gap-1"
            >
              /o/{tenant.slug} <ExternalLink className="w-3 h-3" />
            </Link>
          </p>
        </div>

        <button
          onClick={() => setActiveTab("NEW_RAFFLE")}
          className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-xs font-black text-zinc-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" /> Criar Nova Rifa
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Faturamento Bruto</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">
            R$ {(stats.gross_revenue || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-zinc-500">Volume total transacionado</span>
        </div>

        {/* Metric 2 */}
        <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Saldo Disponível</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-400">
            R$ {(tenant.available_balance || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-emerald-400/80">Líquido para saque no PIX</span>
        </div>

        {/* Metric 3 */}
        <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Cotas Pagas</span>
            <Ticket className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">
            {(stats.total_tickets_sold || 0).toLocaleString("pt-BR")}
          </p>
          <span className="text-[10px] text-zinc-500">Em {stats.total_orders_paid || 0} pedidos confirmados</span>
        </div>

        {/* Metric 4 */}
        <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Campanhas Ativas</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">
            {stats.active_raffles || 0}
          </p>
          <span className="text-[10px] text-zinc-500">De {stats.total_raffles || 0} rifas criadas</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("CAMPAIGNS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "CAMPAIGNS"
              ? "bg-emerald-500 text-zinc-950"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900"
          }`}
        >
          <Ticket className="w-4 h-4" /> Minhas Campanhas ({myRaffles.length})
        </button>

        <button
          onClick={() => setActiveTab("NEW_RAFFLE")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "NEW_RAFFLE"
              ? "bg-emerald-500 text-zinc-950"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900"
          }`}
        >
          <PlusCircle className="w-4 h-4" /> Criar Rifa
        </button>

        <button
          onClick={() => setActiveTab("DRAW")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "DRAW"
              ? "bg-emerald-500 text-zinc-950"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900"
          }`}
        >
          <Trophy className="w-4 h-4" /> Realizar Sorteio
        </button>

        <button
          onClick={() => setActiveTab("SETTINGS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "SETTINGS"
              ? "bg-emerald-500 text-zinc-950"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900"
          }`}
        >
          <Settings className="w-4 h-4" /> Configurações & PIX
        </button>
      </div>

      {/* TAB 1: MINHAS CAMPANHAS */}
      {activeTab === "CAMPAIGNS" && (
        <div className="space-y-4">
          {myRaffles.length === 0 ? (
            <div className="text-center py-16 rounded-3xl bg-zinc-900/40 border border-zinc-800 p-8 space-y-4">
              <Ticket className="w-12 h-12 text-zinc-600 mx-auto" />
              <div className="space-y-1">
                <p className="text-base font-bold text-white">Você ainda não criou nenhuma rifa.</p>
                <p className="text-xs text-zinc-400">Crie sua primeira campanha agora e comece a vender suas cotas.</p>
              </div>
              <button
                onClick={() => setActiveTab("NEW_RAFFLE")}
                className="rounded-2xl bg-emerald-500 px-6 py-2.5 text-xs font-bold text-zinc-950"
              >
                Criar Primeira Rifa
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myRaffles.map((raffle) => (
                <div
                  key={raffle.id}
                  className="rounded-3xl bg-zinc-900 border border-zinc-800 overflow-hidden flex flex-col justify-between shadow-xl"
                >
                  <div className="relative aspect-[16/10] w-full bg-zinc-950">
                    <img
                      src={raffle.images?.[0] || "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80"}
                      alt={raffle.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="rounded-full bg-zinc-950/80 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-emerald-400 border border-emerald-500/30">
                        R$ {raffle.price_per_number.toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h3 className="text-base font-bold text-white line-clamp-2">
                        {raffle.title}
                      </h3>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-zinc-400">
                          <span>Progresso ({raffle.progress_percentage}%)</span>
                          <span className="font-bold text-white">{raffle.sold_count} cotas</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500"
                            style={{ width: `${Math.min(100, Math.max(5, raffle.progress_percentage))}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800">
                      <Link
                        href={`/rifas/${raffle.slug}`}
                        target="_blank"
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-zinc-800 py-2.5 text-xs font-bold text-zinc-300 hover:bg-zinc-700 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Ver Página
                      </Link>

                      <button
                        onClick={() => {
                          setSelectedRaffleForDraw(raffle);
                          setActiveTab("DRAW");
                        }}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-zinc-950 hover:bg-amber-400 transition-colors cursor-pointer"
                      >
                        <Trophy className="w-3.5 h-3.5" /> Sortear
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CRIAR NOVA RIFA WIZARD */}
      {activeTab === "NEW_RAFFLE" && (
        <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 max-w-3xl mx-auto shadow-xl space-y-6">
          <div className="space-y-1 border-b border-zinc-800 pb-4">
            <h2 className="text-xl font-black text-white">Criar Nova Campanha de Rifa</h2>
            <p className="text-xs text-zinc-400">
              Configure os prêmios, quantidade de bilhetes, combos promocionais e regras do sorteio.
            </p>
          </div>

          {createSuccess && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-950/50 border border-emerald-500/30 p-3.5 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{createSuccess}</span>
            </div>
          )}

          {createError && (
            <div className="flex items-center gap-2 rounded-xl bg-red-950/50 border border-red-500/30 p-3.5 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <form onSubmit={handleCreateRaffle} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Título da Campanha *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Honda Civic G10 2.0 ou R$ 85.000 no PIX"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Categoria
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Automóveis">Automóveis</option>
                  <option value="Eletrônicos">Eletrônicos</option>
                  <option value="Dinheiro / Pix">Dinheiro / Pix</option>
                  <option value="Geral">Outros</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Selo de Destaque (Badge)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 🔥 MAIS VENDIDA, ⚡ QUASE ESGOTANDO"
                  value={newBadge}
                  onChange={(e) => setNewBadge(e.target.value)}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Preço por Cota (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={newPrice}
                  onChange={(e) => setNewPrice(parseFloat(e.target.value))}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Total de Cotas *
                </label>
                <select
                  value={newTotalNumbers}
                  onChange={(e) => setNewTotalNumbers(parseInt(e.target.value))}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value={100}>100 Cotas (00 a 99)</option>
                  <option value={1000}>1.000 Cotas (000 a 999)</option>
                  <option value={10000}>10.000 Cotas (0000 a 9999)</option>
                  <option value={100000}>100.000 Cotas (00000 a 99999)</option>
                  <option value={1000000}>1.000.000 Cotas (6 dígitos)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Compra Mínima (Cotas)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newMinPurchase}
                  onChange={(e) => setNewMinPurchase(parseInt(e.target.value))}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                URL da Imagem de Capa (Foto em Alta Resolução)
              </label>
              <input
                type="url"
                placeholder="https://exemplo.com/foto-do-premio.jpg"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Descrição Completa do Prêmio e Regras
              </label>
              <textarea
                rows={4}
                placeholder="Detalhes sobre o prêmio, frete incluso, opção de PIX na conta..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Tipo de Sorteio
                </label>
                <select
                  value={newDrawType}
                  onChange={(e) => setNewDrawType(e.target.value)}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="FEDERAL">Loteria Federal (Oficial Caixa)</option>
                  <option value="AUTOMATIC">Eletrônico Automático</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Data Prevista do Sorteio (Opcional)
                </label>
                <input
                  type="datetime-local"
                  value={newDrawDate}
                  onChange={(e) => setNewDrawDate(e.target.value)}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creatingRaffle}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 text-sm font-black text-zinc-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 disabled:opacity-50 transition-all cursor-pointer"
            >
              {creatingRaffle ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Publicando Rifa...
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" /> Publicar e Começar a Vender
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: REALIZAR SORTEIO AO VIVO */}
      {activeTab === "DRAW" && (
        <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 max-w-2xl mx-auto shadow-xl space-y-6">
          <div className="space-y-1 border-b border-zinc-800 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" /> Módulo de Sorteio Auditado
            </h2>
            <p className="text-xs text-zinc-400">
              Gire a roleta eletrônica ou insira o resultado da extração da Loteria Federal.
            </p>
          </div>

          <form onSubmit={handleExecuteDraw} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Selecione a Rifa para Sortear *
              </label>
              <select
                required
                value={selectedRaffleForDraw?.id || ""}
                onChange={(e) => {
                  const r = myRaffles.find((item) => item.id === parseInt(e.target.value));
                  setSelectedRaffleForDraw(r || null);
                  setDrawResult(null);
                }}
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">Selecione uma campanha...</option>
                {myRaffles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} ({r.sold_count} cotas pagas)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Número Sorteado (Opcional - se vazio, o sistema sorteará aleatoriamente)
              </label>
              <input
                type="text"
                placeholder="Ex: 04215 (extração da Loteria Federal)"
                value={drawWinningNumber}
                onChange={(e) => setDrawWinningNumber(e.target.value)}
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-3 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={!selectedRaffleForDraw || drawingLoading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 py-4 text-sm font-black text-zinc-950 shadow-xl shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 transition-all cursor-pointer"
            >
              {drawingLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Realizando Sorteio...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-zinc-950" /> Executar Sorteio Agora
                </>
              )}
            </button>
          </form>

          {/* Sorteio Result Box */}
          {drawResult && (
            <div className="rounded-2xl bg-gradient-to-r from-amber-500/20 to-emerald-500/20 border-2 border-amber-500/50 p-6 text-center space-y-3 animate-in zoom-in-95">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-400 text-zinc-950 mx-auto">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-white">Temos um Ganhador Oficial!</h3>
              <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-1">
                <p className="text-xs text-zinc-400">Número Sorteado:</p>
                <p className="text-3xl font-black text-amber-400 font-mono tracking-widest">
                  {drawResult.winner_number}
                </p>
                <p className="text-sm font-bold text-white pt-2">
                  Nome: {drawResult.winner_name}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CONFIGURAÇÕES DA LOJA */}
      {activeTab === "SETTINGS" && (
        <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 max-w-2xl mx-auto shadow-xl space-y-6">
          <div className="space-y-1 border-b border-zinc-800 pb-4">
            <h2 className="text-xl font-black text-white">Configurações da Loja & PIX</h2>
            <p className="text-xs text-zinc-400">
              Personalize sua página pública e defina seus dados de recebimento e chave PIX para saques.
            </p>
          </div>

          {settingsSuccess && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-950/50 border border-emerald-500/30 p-3.5 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{settingsSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Nome de Exibição da Loja *
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Link Personalizado (Slug) *
              </label>
              <div className="flex items-center">
                <span className="rounded-l-xl bg-zinc-800 px-3 py-3 text-xs text-zinc-400 border border-r-0 border-zinc-700">
                  rifadigital.com/o/
                </span>
                <input
                  type="text"
                  required
                  value={storeSlug}
                  onChange={(e) => setStoreSlug(e.target.value)}
                  className="flex-1 rounded-r-xl bg-zinc-950 border border-zinc-800 px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                WhatsApp de Suporte (com DDD)
              </label>
              <input
                type="tel"
                value={storeWhatsapp}
                onChange={(e) => setStoreWhatsapp(e.target.value)}
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Chave PIX para Receber Saques de Lucro
              </label>
              <input
                type="text"
                placeholder="CPF, CNPJ, Telefone, E-mail ou Chave Aleatória"
                value={storePixKey}
                onChange={(e) => setStorePixKey(e.target.value)}
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Token Mercado Pago (Opcional - para receber direto na sua conta MP)
              </label>
              <input
                type="password"
                placeholder="APP_USR-..."
                value={storeMpToken}
                onChange={(e) => setStoreMpToken(e.target.value)}
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-zinc-500">
                Se deixar em branco, as vendas usarão o gateway central da plataforma com saque instantâneo via PIX.
              </span>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-sm font-black text-zinc-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 disabled:opacity-50 transition-all cursor-pointer"
            >
              {savingSettings ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
                </>
              ) : (
                <>
                  Salvar Configurações
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
