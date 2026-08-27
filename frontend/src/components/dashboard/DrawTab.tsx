"use client";

import React, { useState } from "react";
import api from "@/lib/api";
import confetti from "canvas-confetti";
import { formatNumber } from "@/lib/masks";
import { useToast } from "@/context/ToastContext";
import {
  Trophy,
  Play,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Dices
} from "lucide-react";

interface DrawTabProps {
  myRaffles: any[];
  selectedRaffle: any;
  onSelectRaffle: (raffle: any) => void;
  onSuccess: () => void;
}

export default function DrawTab({
  myRaffles,
  selectedRaffle,
  onSelectRaffle,
  onSuccess,
}: DrawTabProps) {
  const toast = useToast();
  const [drawWinningNumber, setDrawWinningNumber] = useState("");
  const [drawingLoading, setDrawingLoading] = useState(false);
  const [drawResult, setDrawResult] = useState<any>(null);
  const [animatedNumber, setAnimatedNumber] = useState("00000");

  const handleExecuteDraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRaffle) {
      toast.error("Selecione uma campanha para sortear.");
      return;
    }

    setDrawingLoading(true);

    // Visual spinning animation
    let count = 0;
    const interval = setInterval(() => {
      const randomStr = Math.floor(Math.random() * selectedRaffle.total_numbers)
        .toString()
        .padStart((selectedRaffle.total_numbers - 1).toString().length, "0");
      setAnimatedNumber(randomStr);
      count++;
      if (count > 25) clearInterval(interval);
    }, 80);

    try {
      const res = await api.post(`/raffles/${selectedRaffle.id}/draw`, {
        winning_number: drawWinningNumber ? drawWinningNumber.trim() : null,
      });

      clearInterval(interval);
      setAnimatedNumber(res.data.winner_number);
      setDrawResult(res.data);
      
      confetti({
        particleCount: 160,
        spread: 90,
        origin: { y: 0.6 },
        colors: ["#f59e0b", "#22c55e", "#3b82f6", "#ffffff"]
      });

      toast.success(`Sorteio realizado com sucesso! Cota sorteada: ${res.data.winner_number}`, "Temos um Ganhador!");
      onSuccess();
    } catch (err: any) {
      clearInterval(interval);
      toast.error(err.response?.data?.detail || "Erro ao realizar sorteio. Verifique se há cotas pagas.");
    } finally {
      setDrawingLoading(false);
    }
  };

  return (
    <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 max-w-2xl mx-auto shadow-xl space-y-6">
      <div className="space-y-1 border-b border-zinc-800 pb-4">
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" /> Módulo de Sorteio Auditado
        </h2>
        <p className="text-xs text-zinc-400">
          Gire o sorteador eletrônico auditável ou insira o resultado da extração da Loteria Federal.
        </p>
      </div>

      <form onSubmit={handleExecuteDraw} className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-zinc-200 mb-1.5">
            Selecione a Rifa para Sortear *
          </label>
          <select
            required
            value={selectedRaffle?.id || ""}
            onChange={(e) => {
              const r = myRaffles.find((item) => item.id === parseInt(e.target.value));
              onSelectRaffle(r || null);
              setDrawResult(null);
            }}
            className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 font-bold"
          >
            <option value="">Selecione uma campanha...</option>
            {myRaffles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title} ({formatNumber(r.sold_count)} cotas pagas de {formatNumber(r.total_numbers)})
              </option>
            ))}
          </select>
        </div>

        {/* Animated Display Screen if drawing */}
        {drawingLoading && (
          <div className="rounded-2xl bg-zinc-950 border border-amber-500/40 p-6 text-center space-y-2 glow-amber animate-pulse">
            <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">Sorteando ao vivo...</span>
            <p className="text-4xl sm:text-5xl font-black font-mono text-amber-400 tracking-widest">
              {animatedNumber}
            </p>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-zinc-200 mb-1.5">
            Número Sorteado Oficial (Opcional - deixe vazio para sorteio aleatório entre cotas pagas)
          </label>
          <input
            type="text"
            placeholder="Ex: 04215 (extração oficial da Loteria Federal)"
            value={drawWinningNumber}
            onChange={(e) => setDrawWinningNumber(e.target.value)}
            className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-3 text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
          />
          <span className="text-[11px] text-zinc-400 mt-1 block">
            Se informado, o sistema validará automaticamente o comprador proprietário deste número.
          </span>
        </div>

        <button
          type="submit"
          disabled={!selectedRaffle || drawingLoading}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 py-4 text-sm font-black text-zinc-950 shadow-xl shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 transition-all cursor-pointer hover:scale-[1.01]"
        >
          {drawingLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Realizando Auditoria do Sorteio...
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-zinc-950" /> Executar e Divulgar Sorteio Agora
            </>
          )}
        </button>
      </form>

      {/* Sorteio Result Box */}
      {drawResult && (
        <div className="rounded-3xl bg-gradient-to-r from-amber-500/20 to-emerald-500/20 border-2 border-amber-500/50 p-6 text-center space-y-4 animate-in zoom-in-95 glow-amber">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-amber-400 text-zinc-950 mx-auto shadow-lg">
            <Trophy className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black text-white">Ganhador Oficial Apurado!</h3>
            <p className="text-xs text-zinc-300">O sorteio foi registrado e o status da rifa atualizado para Sorteada.</p>
          </div>

          <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2">
            <p className="text-xs text-zinc-400 font-bold">Cota Campeã:</p>
            <p className="text-4xl font-black text-amber-400 font-mono tracking-widest">
              {drawResult.winner_number}
            </p>
            <p className="text-sm font-bold text-white pt-1">
              Ganhador(a): <strong className="text-emerald-400">{drawResult.winner_name}</strong>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
