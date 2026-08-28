"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

export default function RecoverPasswordPage() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function requestReset(event: FormEvent) {
    event.preventDefault(); setError("");
    try {
      const response = await api.post("/auth/request-password-reset", { email });
      setMessage(response.data.debug_token ? `Token de desenvolvimento: ${response.data.debug_token}` : response.data.detail);
    } catch (err: any) { setError(err.response?.data?.detail || "Não foi possível solicitar a recuperação."); }
  }

  async function resetPassword(event: FormEvent) {
    event.preventDefault(); setError("");
    try {
      const response = await api.post("/auth/reset-password", { token, new_password: password });
      setMessage(response.data.detail); setToken(""); setPassword("");
    } catch (err: any) { setError(err.response?.data?.detail || "Token inválido ou expirado."); }
  }

  return <main className="container mx-auto max-w-md px-4 py-16 space-y-6">
    <div className="text-center"><h1 className="text-2xl font-black text-white">Recuperar senha</h1><p className="text-sm text-zinc-400 mt-2">Solicite um token e defina uma nova senha.</p></div>
    <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-6 space-y-6">
      <form onSubmit={requestReset} className="space-y-3"><label className="text-xs text-zinc-300">E-mail</label><input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-3 text-sm text-white" /><button className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-bold text-zinc-950">Solicitar recuperação</button></form>
      <form onSubmit={resetPassword} className="space-y-3 border-t border-zinc-800 pt-5"><label className="text-xs text-zinc-300">Token recebido</label><input required value={token} onChange={e => setToken(e.target.value)} className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-3 text-xs text-white font-mono" /><label className="text-xs text-zinc-300">Nova senha</label><input required minLength={8} type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-3 text-sm text-white" /><button className="w-full rounded-xl border border-emerald-500/50 py-3 text-sm font-bold text-emerald-400">Redefinir senha</button></form>
      {message && <p className="text-xs text-emerald-400 break-all">{message}</p>}{error && <p className="text-xs text-red-400">{error}</p>}
      <Link href="/login" className="block text-center text-xs text-zinc-400 hover:text-white">Voltar para o login</Link>
    </div>
  </main>;
}
