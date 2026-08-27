"use client";

import React, { useState } from "react";
import api from "@/lib/api";
import { formatBRL } from "@/lib/masks";
import { useToast } from "@/context/ToastContext";
import {
  Wallet,
  ArrowDownCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle
} from "lucide-react";

interface WithdrawalsTabProps {
  tenant: any;
  withdrawals: any[];
  onSuccess: () => void;
}

export default function WithdrawalsTab({
  tenant,
  withdrawals,
  onSuccess,
}: WithdrawalsTabProps) {
  const toast = useToast();
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [requestingWithdrawal, setRequestingWithdrawal] = useState(false);

  const availableBalance = tenant?.available_balance || 0;

  const handleRequestWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(withdrawalAmount);
    if (!amount || amount <= 0) {
      toast.error("Informe um valor válido para saque.");
      return;
    }
    if (amount > availableBalance) {
      toast.error("O valor solicitado excede seu saldo disponível.");
      return;
    }
    if (!tenant.pix_key) {
      toast.error("Configure sua chave PIX na aba de Configurações antes de solicitar saques.");
      return;
    }

    setRequestingWithdrawal(true);
    try {
      await api.post("/tenants/me/withdrawals", { amount });
      toast.success(`Solicitação de saque de ${formatBRL(amount)} enviada com sucesso!`, "Saque Solicitado");
      setWithdrawalAmount("");
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Erro ao solicitar saque.");
    } finally {
      setRequestingWithdrawal(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[380px_1fr] items-start">
      {/* Withdrawal Form */}
      <form
        onSubmit={handleRequestWithdrawal}
        className="rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-7 space-y-5 shadow-xl"
      >
        <div className="space-y-1 border-b border-zinc-800 pb-4">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" /> Solicitar Saque
          </h2>
          <p className="text-xs text-zinc-400">
            Transfira os lucros das suas vendas direto para sua conta bancária via PIX.
          </p>
        </div>

        <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-4 space-y-1">
          <span className="text-xs font-bold text-zinc-400">Saldo Disponível para Saque</span>
          <p className="text-2xl font-black text-emerald-400">
            {formatBRL(availableBalance)}
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-200 mb-1.5">
            Valor a Sacar (R$) *
          </label>
          <input
            type="number"
            min="1"
            step="0.01"
            max={availableBalance}
            required
            value={withdrawalAmount}
            onChange={(e) => setWithdrawalAmount(e.target.value)}
            placeholder="Ex: 1500,00"
            className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 font-bold"
          />
        </div>

        <div className="rounded-xl bg-zinc-950/80 border border-zinc-800/80 p-3 text-xs space-y-1">
          <span className="text-zinc-400 font-medium">Chave PIX de Destino:</span>
          <p className="text-white font-mono font-bold">
            {tenant.pix_key ? `${tenant.pix_key_type || "PIX"}: ${tenant.pix_key}` : "Nenhuma chave PIX configurada."}
          </p>
          {!tenant.pix_key && (
            <p className="text-[11px] text-amber-400">Configure sua chave na aba Configurações.</p>
          )}
        </div>

        <button
          type="submit"
          disabled={requestingWithdrawal || !tenant.pix_key || availableBalance <= 0}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-sm font-black text-zinc-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 disabled:opacity-50 transition-all cursor-pointer"
        >
          {requestingWithdrawal ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Processando...
            </>
          ) : (
            <>
              <ArrowDownCircle className="w-4 h-4" /> Confirmar Solicitação de Saque
            </>
          )}
        </button>
      </form>

      {/* Withdrawals History Table */}
      <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-7 space-y-5 shadow-xl">
        <div className="space-y-1">
          <h2 className="text-lg font-black text-white">Histórico de Saques</h2>
          <p className="text-xs text-zinc-400">Acompanhe o status e recibos das suas transferências bancárias.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-800 text-zinc-400 font-bold uppercase text-[10px] bg-zinc-950/40">
              <tr>
                <th className="py-3 px-3">Data</th>
                <th className="py-3 px-3">Valor</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Observações / Comprovante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {withdrawals.map((item) => (
                <tr key={item.id} className="text-zinc-300 hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 px-3 font-mono text-[11px]">
                    {new Date(item.requested_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="py-3 px-3 font-black text-white">
                    {formatBRL(item.amount)}
                  </td>
                  <td className="py-3 px-3">
                    {item.status === "COMPLETED" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" /> Pago via PIX
                      </span>
                    )}
                    {item.status === "APPROVED" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/30 px-2.5 py-0.5 text-[10px] font-bold text-blue-400">
                        <Clock className="w-3 h-3" /> Aprovado (Em envio)
                      </span>
                    )}
                    {item.status === "PENDING" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-400">
                        <Clock className="w-3 h-3" /> Em Análise
                      </span>
                    )}
                    {item.status === "REJECTED" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/30 px-2.5 py-0.5 text-[10px] font-bold text-red-400">
                        <XCircle className="w-3 h-3" /> Rejeitado
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-zinc-400">
                    {item.admin_notes || item.proof_url || "-"}
                  </td>
                </tr>
              ))}
              {withdrawals.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-zinc-500">
                    Nenhum saque solicitado até o momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
