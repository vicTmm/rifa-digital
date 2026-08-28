"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

export default function VerifyEmailPage() {
  const [message, setMessage] = useState("Verificando...");
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) { setMessage("Token de verificação ausente."); return; }
    api.post("/auth/verify-email", null, { params: { token } }).then(r => setMessage(r.data.detail)).catch(() => setMessage("Token inválido ou expirado."));
  }, []);
  return <main className="container mx-auto max-w-md px-4 py-24 text-center space-y-4"><h1 className="text-2xl font-black text-white">Verificação de e-mail</h1><p className="text-sm text-zinc-400">{message}</p><Link href="/login" className="text-sm text-emerald-400 hover:underline">Ir para o login</Link></main>;
}
