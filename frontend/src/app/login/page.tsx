"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { Ticket, Lock, Mail, AlertCircle, Loader2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const { login } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await api.post("/auth/login", {
        email,
        password,
      });

      login(res.data.access_token, res.data.user);
      toast.success(`Bem-vindo(a) de volta, ${res.data.user.full_name}!`);

      if (res.data.user.role === "SUPERADMIN") {
        router.push("/admin");
      } else if (res.data.user.role === "ORGANIZER") {
        router.push("/dashboard");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setErrorMsg(err.response?.data?.detail || "E-mail ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-md px-4 py-16 sm:py-24 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald-500 text-zinc-950 font-black shadow-lg shadow-emerald-500/20">
          <Ticket className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-black text-white">Acesse sua Conta</h1>
        <p className="text-xs text-zinc-400">
          Gerencie suas rifas, vendas e cotas da sorte em um só lugar.
        </p>
      </div>

      {/* Login Card */}
      <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 shadow-2xl space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-red-950/50 border border-red-500/30 p-3 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-bold text-zinc-200">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="email"
                required
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 pl-10 pr-3 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-zinc-200">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 pl-10 pr-3 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-sm font-black text-zinc-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 disabled:opacity-50 transition-all cursor-pointer hover:scale-[1.01]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Entrando...
              </>
            ) : (
              <>
                Entrar no Painel <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Box */}
        <div className="rounded-2xl bg-zinc-950/80 border border-zinc-800 p-4 space-y-2 text-[11px] text-zinc-400">
          <p className="font-bold text-zinc-300">Credenciais para Demonstração:</p>
          <div className="space-y-1">
            <p>
              👑 <strong className="text-zinc-200">Admin:</strong> admin@rifadigital.com / <span className="font-mono text-emerald-400">admin123</span>
            </p>
            <p>
              🎫 <strong className="text-zinc-200">Organizador:</strong> victor@rifas.com / <span className="font-mono text-emerald-400">organizador123</span>
            </p>
          </div>
        </div>

        <div className="text-center pt-2 text-xs text-zinc-400">
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="font-bold text-emerald-400 hover:underline">
            Cadastre-se grátis
          </Link>
        </div>
      </div>
    </div>
  );
}
