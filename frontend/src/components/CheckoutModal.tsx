"use client";

import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import api from "@/lib/api";
import { maskPhone, maskCpf, formatBRL } from "@/lib/masks";
import { useToast } from "@/context/ToastContext";
import {
  X,
  QrCode,
  Copy,
  Check,
  Zap,
  Clock,
  Sparkles,
  Ticket,
  Trophy,
  Share2,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Smartphone,
  ExternalLink,
  MessageCircle
} from "lucide-react";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  raffle: {
    id: number;
    title: string;
    price_per_number: number;
    total_numbers: number;
  };
  quantity: number;
  manualNumbers?: string[];
  unitPrice: number;
  discountAmount: number;
  totalAmount: number;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  raffle,
  quantity,
  manualNumbers,
  unitPrice,
  discountAmount,
  totalAmount,
}: CheckoutModalProps) {
  const toast = useToast();
  const [step, setStep] = useState<"FORM" | "PIX" | "SUCCESS">("FORM");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Order response state
  const [orderData, setOrderData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const TOTAL_TIME = 15 * 60; // 15 minutes
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);

  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  // Trigger Confetti on Success
  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 130,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#22c55e", "#eab308", "#3b82f6", "#ffffff"],
      });
    } catch (e) {
      console.log("Confetti error:", e);
    }
  };

  // 15-minute countdown timer
  useEffect(() => {
    if (step !== "PIX") return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  // Polling for payment status
  useEffect(() => {
    if (step !== "PIX" || !orderData?.id) return;

    pollInterval.current = setInterval(async () => {
      try {
        const res = await api.get(`/orders/${orderData.id}`, {
          headers: orderData.access_token
            ? { "X-Order-Token": orderData.access_token }
            : undefined,
        });
        if (res.data.status === "PAID") {
          setOrderData((prev: any) => ({
            ...prev,
            status: "PAID",
            tickets: res.data.tickets,
            lucky_numbers_won: res.data.lucky_numbers_won,
          }));
          setStep("SUCCESS");
          toast.success("Pagamento confirmado via PIX!", "Parabéns!");
          triggerCelebration();
          if (pollInterval.current) clearInterval(pollInterval.current);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3000);

    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [step, orderData?.id, orderData?.access_token]);

  if (!isOpen) return null;

  // Format Timer mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const timerPercent = (timeLeft / TOTAL_TIME) * 100;

  const handleGeneratePix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || phone.replace(/\D/g, "").length < 10) {
      setErrorMsg("Por favor, preencha seu nome e um WhatsApp válido com DDD.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const response = await api.post("/orders", {
        raffle_id: raffle.id,
        quantity: quantity,
        manual_numbers: manualNumbers && manualNumbers.length > 0 ? manualNumbers : null,
        customer_name: name,
        customer_phone: phone.replace(/\D/g, ""),
        customer_cpf: cpf ? cpf.replace(/\D/g, "") : null,
        customer_email: email ? email : null,
      });

      setOrderData(response.data);
      setStep("PIX");
    } catch (err: any) {
      console.error("Error creating order:", err);
      setErrorMsg(err.response?.data?.detail || "Erro ao gerar PIX. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPix = () => {
    if (orderData?.pix_code) {
      navigator.clipboard.writeText(orderData.pix_code);
      setCopied(true);
      toast.success("Código PIX copiado com sucesso!");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSimulatePayment = async () => {
    if (!orderData?.id) return;
    setSimulating(true);
    try {
      const res = await api.post(`/orders/${orderData.id}/simulate-payment`);
      setOrderData((prev: any) => ({
        ...prev,
        status: "PAID",
        tickets: res.data.tickets,
        lucky_numbers_won: res.data.lucky_numbers_won,
      }));
      setStep("SUCCESS");
      toast.success("Pagamento aprovado no simulador de teste!", "Sucesso!");
      triggerCelebration();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Erro ao simular pagamento.");
    } finally {
      setSimulating(false);
    }
  };

  const handleShareOnWhatsApp = () => {
    if (!orderData) return;
    const ticketSummary = orderData.tickets?.slice(0, 10).join(", ") + (orderData.tickets?.length > 10 ? ` e mais ${orderData.tickets.length - 10} cotas` : "");
    const text = encodeURIComponent(
      `🎟️ *Já estou participando do sorteio oficial!*\n\n` +
      `🏆 *Prêmio:* ${raffle.title}\n` +
      `🔢 *Minhas Cotas:* ${ticketSummary}\n\n` +
      `Participe você também pelo link oficial:`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl shadow-emerald-500/10 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Ticket className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-white leading-tight">
                {step === "FORM" && "Finalizar Participação"}
                {step === "PIX" && "Pagamento Seguro via PIX"}
                {step === "SUCCESS" && "🎉 Compra Confirmada!"}
              </h2>
              <p className="text-xs text-zinc-400 truncate max-w-[280px]">
                {raffle.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[82vh] overflow-y-auto space-y-4">
          {/* STEP 1: FORM */}
          {step === "FORM" && (
            <form onSubmit={handleGeneratePix} className="space-y-4">
              {/* Order Summary Box */}
              <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-4 space-y-2.5 text-xs">
                <div className="flex justify-between text-zinc-300">
                  <span>Quantidade de Cotas:</span>
                  <span className="font-bold text-white">{quantity} bilhetes</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-semibold bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                    <span>Desconto do Combo aplicado:</span>
                    <span>- {formatBRL(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline text-sm font-black pt-2 border-t border-zinc-800/80">
                  <span className="text-zinc-200">Total a Pagar:</span>
                  <span className="text-emerald-400 text-lg font-black">
                    {formatBRL(totalAmount)}
                  </span>
                </div>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 rounded-xl bg-red-950/50 border border-red-500/30 p-3 text-xs text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Form Inputs with Masking */}
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-200 mb-1.5">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: João da Silva"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-3 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-200 mb-1.5">
                    WhatsApp (com DDD) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="(11) 98765-4321"
                    value={phone}
                    onChange={(e) => setPhone(maskPhone(e.target.value))}
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-3 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                  <span className="text-[11px] text-zinc-400 mt-1 block">
                    Seus bilhetes e comprovantes serão vinculados a este número.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-200 mb-1.5">
                      CPF (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      value={cpf}
                      onChange={(e) => setCpf(maskCpf(e.target.value))}
                      className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-3 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-200 mb-1.5">
                      E-mail (Opcional)
                    </label>
                    <input
                      type="email"
                      placeholder="seuemail@exemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-3 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 text-sm font-black text-zinc-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 disabled:opacity-50 transition-all cursor-pointer hover:scale-[1.01]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Gerando QR Code PIX...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 fill-zinc-950" /> Gerar PIX ({formatBRL(totalAmount)})
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: PIX PAYMENT */}
          {step === "PIX" && orderData && (
            <div className="space-y-5 text-center">
              {/* Timer Progress Indicator */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold px-1">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> Tempo para pagamento:
                  </span>
                  <span className={`font-mono text-sm ${timeLeft < 180 ? "text-red-400 animate-pulse" : "text-amber-400"}`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      timeLeft < 180 ? "bg-red-500" : "bg-amber-400"
                    }`}
                    style={{ width: `${timerPercent}%` }}
                  />
                </div>
              </div>

              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative p-3 rounded-2xl bg-white shadow-2xl border-4 border-emerald-500/30">
                  {orderData.pix_qr_code ? (
                    <img
                      src={orderData.pix_qr_code}
                      alt="PIX QR Code"
                      className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-zinc-900">
                      <QrCode className="w-32 h-32" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-zinc-300 mt-2.5 font-medium">
                  Abra o aplicativo do seu banco e escaneie o código acima.
                </p>
              </div>

              {/* Pix Copia e Cola */}
              <div className="space-y-2 text-left">
                <label className="block text-xs font-bold text-zinc-200">
                  Código Copia e Cola (PIX)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={orderData.pix_code || ""}
                    className="flex-1 rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-xs font-mono text-zinc-300 focus:outline-none select-all"
                  />
                  <button
                    onClick={handleCopyPix}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-black transition-all cursor-pointer shrink-0 ${
                      copied
                        ? "bg-emerald-600 text-white"
                        : "bg-emerald-500 text-zinc-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20"
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" /> Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" /> Copiar
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Real-time status indicator */}
              <div className="flex items-center justify-center gap-2 rounded-2xl bg-zinc-950 border border-zinc-800 p-3 text-xs text-zinc-300">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400 shrink-0" />
                <span>Identificando pagamento bancário em tempo real...</span>
              </div>

              {/* Fast Sandbox Simulator Button */}
              <div className="pt-2 border-t border-zinc-800/80">
                <button
                  onClick={handleSimulatePayment}
                  disabled={simulating}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-950/70 border border-purple-500/40 py-2.5 text-xs font-bold text-purple-300 hover:bg-purple-900/80 transition-colors cursor-pointer"
                >
                  {simulating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  )}
                  ⚡ Simular Pagamento PIX (Ambiente de Teste)
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS CELEBRATION */}
          {step === "SUCCESS" && orderData && (
            <div className="space-y-6 text-center animate-in zoom-in-95 duration-300">
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-zinc-950 shadow-xl shadow-emerald-500/30 animate-bounce">
                  <Check className="w-10 h-10 stroke-[3]" />
                </div>
                <h3 className="text-xl font-black text-white">
                  Pagamento Confirmado!
                </h3>
                <p className="text-xs text-zinc-300 max-w-sm">
                  Parabéns, <strong className="text-white">{orderData.customer_name}</strong>! Seus bilhetes foram emitidos e já estão concorrendo.
                </p>
              </div>

              {/* Instant Lucky Prize Alert if Won! */}
              {orderData.lucky_numbers_won && orderData.lucky_numbers_won.length > 0 && (
                <div className="rounded-2xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-2 border-amber-500/50 p-4 text-left space-y-2 glow-amber">
                  <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
                    <Trophy className="w-5 h-5 text-yellow-400 animate-pulse" />
                    VOCÊ ACHOU UMA COTA PREMIADA INSTANTÂNEA!
                  </div>
                  {orderData.lucky_numbers_won.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-xs text-zinc-100 bg-black/60 p-2.5 rounded-xl">
                      <span className="font-mono font-black text-amber-400">Cota {item.number}</span>
                      <span className="font-bold text-white">{item.prize}</span>
                    </div>
                  ))}
                  <p className="text-[11px] text-amber-300/90">
                    O organizador entrará em contato pelo seu WhatsApp para transferir o prêmio instantâneo!
                  </p>
                </div>
              )}

              {/* Assigned Numbers Grid */}
              <div className="space-y-2 text-left">
                <div className="flex justify-between items-center text-xs font-bold text-zinc-200">
                  <span>Seus Números da Sorte ({orderData.tickets?.length || quantity} cotas):</span>
                </div>
                <div className="max-h-44 overflow-y-auto p-3 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-wrap gap-2">
                  {orderData.tickets && orderData.tickets.length > 0 ? (
                    orderData.tickets.map((num: string, idx: number) => (
                      <span
                        key={idx}
                        className="inline-block px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/40 text-xs font-mono font-bold text-emerald-400 shadow-sm"
                      >
                        {num}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-zinc-400">Números processados com sucesso.</span>
                  )}
                </div>
              </div>

              {/* Action CTAs */}
              <div className="space-y-2.5 pt-2">
                <button
                  onClick={handleShareOnWhatsApp}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 py-3 text-xs font-bold text-emerald-300 hover:bg-emerald-600/30 transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" /> Compartilhar Meus Números no WhatsApp
                </button>

                <button
                  onClick={onClose}
                  className="w-full rounded-2xl bg-emerald-500 py-3.5 text-sm font-black text-zinc-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all cursor-pointer"
                >
                  Concluir e Voltar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
