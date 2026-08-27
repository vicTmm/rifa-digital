"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import MetricsOverview from "@/components/dashboard/MetricsOverview";
import CampaignsTab from "@/components/dashboard/CampaignsTab";
import NewRaffleTab from "@/components/dashboard/NewRaffleTab";
import DrawTab from "@/components/dashboard/DrawTab";
import WithdrawalsTab from "@/components/dashboard/WithdrawalsTab";
import SettingsTab from "@/components/dashboard/SettingsTab";
import {
  Ticket,
  PlusCircle,
  Settings,
  Trophy,
  ExternalLink,
  CheckCircle2,
  Loader2,
  Wallet,
  LayoutDashboard
} from "lucide-react";

export default function OrganizerDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<"METRICS" | "CAMPAIGNS" | "NEW_RAFFLE" | "DRAW" | "WITHDRAWALS" | "SETTINGS">("CAMPAIGNS");
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [myRaffles, setMyRaffles] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [selectedRaffleForDraw, setSelectedRaffleForDraw] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, rafflesRes, withdrawalsRes] = await Promise.all([
        api.get("/tenants/me/dashboard"),
        api.get("/raffles/my-raffles"),
        api.get("/tenants/me/withdrawals"),
      ]);
      setDashboardData(dashRes.data);
      setMyRaffles(rafflesRes.data);
      setWithdrawals(withdrawalsRes.data);
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
              className="text-emerald-400 hover:underline inline-flex items-center gap-1 font-semibold"
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

      {/* Primary Metrics Overview Bar */}
      <MetricsOverview stats={stats} tenant={tenant} />

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("CAMPAIGNS")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === "CAMPAIGNS"
              ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/10"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900"
          }`}
        >
          <Ticket className="w-4 h-4" /> Minhas Campanhas ({myRaffles.length})
        </button>

        <button
          onClick={() => setActiveTab("NEW_RAFFLE")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === "NEW_RAFFLE"
              ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/10"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900"
          }`}
        >
          <PlusCircle className="w-4 h-4" /> Criar Rifa (Com Prévia)
        </button>

        <button
          onClick={() => setActiveTab("DRAW")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === "DRAW"
              ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/10"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900"
          }`}
        >
          <Trophy className="w-4 h-4" /> Realizar Sorteio
        </button>

        <button
          onClick={() => setActiveTab("WITHDRAWALS")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === "WITHDRAWALS"
              ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/10"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900"
          }`}
        >
          <Wallet className="w-4 h-4" /> Saques & Transferências
        </button>

        <button
          onClick={() => setActiveTab("SETTINGS")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === "SETTINGS"
              ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/10"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900"
          }`}
        >
          <Settings className="w-4 h-4" /> Configurações & PIX
        </button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === "CAMPAIGNS" && (
        <CampaignsTab
          myRaffles={myRaffles}
          onNewRaffle={() => setActiveTab("NEW_RAFFLE")}
          onSelectForDraw={(raffle) => {
            setSelectedRaffleForDraw(raffle);
            setActiveTab("DRAW");
          }}
        />
      )}

      {activeTab === "NEW_RAFFLE" && (
        <NewRaffleTab
          onSuccess={() => {
            fetchData();
            setTimeout(() => setActiveTab("CAMPAIGNS"), 1500);
          }}
        />
      )}

      {activeTab === "DRAW" && (
        <DrawTab
          myRaffles={myRaffles}
          selectedRaffle={selectedRaffleForDraw}
          onSelectRaffle={setSelectedRaffleForDraw}
          onSuccess={() => fetchData()}
        />
      )}

      {activeTab === "WITHDRAWALS" && (
        <WithdrawalsTab
          tenant={tenant}
          withdrawals={withdrawals}
          onSuccess={() => fetchData()}
        />
      )}

      {activeTab === "SETTINGS" && (
        <SettingsTab
          tenant={tenant}
          onSuccess={() => fetchData()}
        />
      )}
    </div>
  );
}
