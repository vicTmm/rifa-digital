"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { formatBRL, formatNumber } from "@/lib/masks";
import { useToast } from "@/context/ToastContext";
import {
  ShieldCheck,
  DollarSign,
  TrendingUp,
  Users,
  Ticket,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
  Percent,
  Search,
  Check,
  X
} from "lucide-react";

export default function SuperAdminPage() {
  const router = useRouter();
  const toast = useToast();
  const { user, loading: authLoading } = useAuth();

  const [stats, setStats] = useState<any>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, tenantsRes, withdrawalsRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/tenants"),
        api.get("/admin/withdrawals"),
      ]);
      setStats(statsRes.data);
      setTenants(tenantsRes.data);
      setWithdrawals(withdrawalsRes.data);
    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawal = async (id: number, status: string) => {
    let admin_notes: string | undefined = undefined;
    let proof_url: string | undefined = undefined;

    if (status === "REJECTED") {
      const reason = window.prompt("Motivo da rejeição do saque:");
      if (!reason) return;
      admin_notes = reason;
    }

    if (status === "COMPLETED") {
      const proof = window.prompt("ID ou Link do Comprovante PIX (opcional):");
      if (proof) proof_url = proof;
    }

    try {
      await api.put(`/admin/withdrawals/${id}`, { status, admin_notes, proof_url });
      toast.success(`Saque atualizado para ${status}!`);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Erro ao processar saque.");
    }
  };

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "SUPERADMIN")) {
      router.push("/login");
      return;
    }
    if (user?.role === "SUPERADMIN") {
      fetchData();
    }
  }, [user, authLoading]);

  const handleToggleVerify = async (tenantId: number, currentStatus: boolean) => {
    try {
      await api.put(`/admin/tenants/${tenantId}/verify?verified=${!currentStatus}`);
      toast.success(`Selo de verificação ${!currentStatus ? "aprovado" : "removido"} com sucesso!`);
      fetchData();
    } catch (err) {
      toast.error("Erro ao alterar verificação do organizador.");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        <p className="text-sm text-zinc-400">Carregando painel de administração geral...</p>
      </div>
    );
  }

  const filteredTenants = tenants.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.slug.toLowerCase().includes(search.toLowerCase()) ||
    (t.owner_email && t.owner_email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Painel Super Administrador
            </h1>
            <p className="text-xs text-zinc-400">
              Visão macro de todas as transações, organizadores e receitas da plataforma.
            </p>
          </div>
        </div>
      </div>

      {/* Global Platform Metrics */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-5 space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Volume Total Transacionado</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-white">
              {formatBRL(stats.total_sales_volume)}
            </p>
            <span className="text-[10px] text-zinc-400">Todas as rifas combinadas</span>
          </div>

          <div className="rounded-3xl bg-zinc-900 border border-purple-500/30 p-5 space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-xs text-purple-400 font-bold">
              <span>Receita da Plataforma (Taxas)</span>
              <Percent className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-purple-400">
              {formatBRL(stats.total_platform_revenue)}
            </p>
            <span className="text-[10px] text-purple-400/80 font-medium">Lucro líquido da plataforma</span>
          </div>

          <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-5 space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Organizadores Ativos</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-white">
              {stats.total_organizers}
            </p>
            <span className="text-[10px] text-zinc-400">Lojas cadastradas</span>
          </div>

          <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-5 space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Cotas Vendidas no Total</span>
              <Ticket className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-white">
              {formatNumber(stats.total_tickets_sold)}
            </p>
            <span className="text-[10px] text-zinc-400">Em {stats.total_raffles} campanhas</span>
          </div>
        </div>
      )}

      {/* Withdrawals Approval Table */}
      <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-6 space-y-5 shadow-xl">
        <div className="space-y-1">
          <h2 className="text-lg font-black text-white">Solicitações de Saque dos Organizadores</h2>
          <p className="text-xs text-zinc-400">Aprove saques, marque como concluído após transferência ou rejeite para devolver saldo.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="border-b border-zinc-800 text-zinc-400 font-bold uppercase text-[10px] bg-zinc-950/40">
              <tr>
                <th className="py-3 px-3">Organizador</th>
                <th className="py-3 px-3">Valor</th>
                <th className="py-3 px-3">Chave PIX</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {withdrawals.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 px-3 font-bold text-white">{item.tenant_name || `#${item.tenant_id}`}</td>
                  <td className="py-3 px-3 font-black text-emerald-400">{formatBRL(item.amount)}</td>
                  <td className="py-3 px-3 font-mono text-[11px]">{item.pix_key_type}: {item.pix_key}</td>
                  <td className="py-3 px-3">
                    <span className="font-bold uppercase text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right space-x-2">
                    {item.status === "PENDING" && (
                      <button
                        onClick={() => handleWithdrawal(item.id, "APPROVED")}
                        className="px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-bold hover:bg-blue-500/20"
                      >
                        Aprovar
                      </button>
                    )}
                    {item.status === "APPROVED" && (
                      <button
                        onClick={() => handleWithdrawal(item.id, "COMPLETED")}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/20"
                      >
                        Concluir PIX
                      </button>
                    )}
                    {(item.status === "PENDING" || item.status === "APPROVED") && (
                      <button
                        onClick={() => handleWithdrawal(item.id, "REJECTED")}
                        className="px-3 py-1.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 text-xs font-bold hover:bg-red-500/20"
                      >
                        Rejeitar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {withdrawals.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-zinc-500">
                    Nenhuma solicitação de saque pendente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Organizers List Table */}
      <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-6 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-black text-white">
            Lojas & Organizadores ({filteredTenants.length})
          </h2>

          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar por loja ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl bg-zinc-950 border border-zinc-800 pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[10px] bg-zinc-950/60 font-bold">
              <tr>
                <th className="py-3 px-4">Organizador / Loja</th>
                <th className="py-3 px-4">E-mail</th>
                <th className="py-3 px-4">WhatsApp</th>
                <th className="py-3 px-4">Rifas</th>
                <th className="py-3 px-4">Vendas</th>
                <th className="py-3 px-4">Saldo</th>
                <th className="py-3 px-4">Selo</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredTenants.map((t) => (
                <tr key={t.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      <span>{t.name}</span>
                      {t.is_verified && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </div>
                    <Link
                      href={`/o/${t.slug}`}
                      target="_blank"
                      className="text-[11px] text-emerald-400 hover:underline inline-flex items-center gap-1 font-semibold"
                    >
                      /o/{t.slug} <ExternalLink className="w-2.5 h-2.5" />
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">{t.owner_email || "-"}</td>
                  <td className="py-3 px-4">{t.whatsapp || "-"}</td>
                  <td className="py-3 px-4 font-bold text-white">{t.active_raffles}</td>
                  <td className="py-3 px-4 font-black text-emerald-400">
                    {formatBRL(t.total_sales_amount)}
                  </td>
                  <td className="py-3 px-4 font-bold text-zinc-200">
                    {formatBRL(t.available_balance)}
                  </td>
                  <td className="py-3 px-4">
                    {t.is_verified ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                        Verificado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-medium">
                        Pendente
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleToggleVerify(t.id, t.is_verified)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                        t.is_verified
                          ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30"
                          : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30"
                      }`}
                    >
                      {t.is_verified ? "Remover Selo" : "Aprovar Selo"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
