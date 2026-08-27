"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import api from "@/lib/api";
import RaffleCard from "@/components/RaffleCard";
import {
  CheckCircle2,
  MessageCircle,
  Instagram,
  Sparkles,
  Ticket,
  Loader2,
  ShieldCheck
} from "lucide-react";

export default function OrganizerStorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [tenant, setTenant] = useState<any>(null);
  const [raffles, setRaffles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tenantRes, rafflesRes] = await Promise.all([
          api.get(`/tenants/${slug}`),
          api.get(`/tenants/${slug}/raffles`),
        ]);
        setTenant(tenantRes.data);
        setRaffles(rafflesRes.data);
      } catch (err) {
        console.error("Error fetching organizer:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-sm text-zinc-400">Carregando perfil do organizador...</p>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-black text-white">Organizador não encontrado</h2>
        <p className="text-xs text-zinc-400">O organizador informado não existe ou foi desativado.</p>
        <Link
          href="/"
          className="inline-block rounded-xl bg-emerald-500 px-6 py-2.5 text-xs font-bold text-zinc-950"
        >
          Voltar ao Início
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-24">
      {/* Banner & Profile Header */}
      <div className="relative">
        <div className="h-48 sm:h-64 w-full bg-zinc-900 overflow-hidden relative">
          {tenant.banner_url ? (
            <img
              src={tenant.banner_url}
              alt="Banner"
              className="h-full w-full object-cover opacity-60"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-emerald-950 via-zinc-900 to-zinc-950" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
        </div>

        <div className="container mx-auto max-w-7xl px-4 sm:px-6 relative -mt-16 sm:-mt-20">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-3xl bg-zinc-900 border-4 border-zinc-950 overflow-hidden shadow-2xl shrink-0">
                {tenant.logo_url ? (
                  <img src={tenant.logo_url} alt={tenant.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-3xl font-black text-white bg-emerald-600">
                    {tenant.name[0]}
                  </div>
                )}
              </div>

              <div className="space-y-1 pt-2">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-white">{tenant.name}</h1>
                  {tenant.is_verified && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-zinc-400 max-w-lg">
                  {tenant.bio || "Campanhas e sorteios digitais com total segurança e auditoria."}
                </p>
              </div>
            </div>

            {/* Social & Contact Buttons */}
            <div className="flex items-center gap-2 pt-2">
              {tenant.whatsapp && (
                <a
                  href={`https://wa.me/55${tenant.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-zinc-950 shadow-md shadow-emerald-500/20 hover:bg-emerald-400 transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
              )}
              {tenant.instagram && (
                <a
                  href={`https://instagram.com/${tenant.instagram.replace("@", "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-700 transition-all"
                >
                  <Instagram className="w-4 h-4" /> Instagram
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Organizer's Raffles */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg sm:text-xl font-bold text-white">
              Campanhas de {tenant.name}
            </h2>
          </div>
          <span className="text-xs font-semibold text-zinc-400">
            {raffles.length} {raffles.length === 1 ? "rifa encontrada" : "rifas encontradas"}
          </span>
        </div>

        {raffles.length === 0 ? (
          <div className="text-center py-16 rounded-3xl bg-zinc-900/40 border border-zinc-800 p-8 space-y-2">
            <p className="text-sm font-bold text-zinc-300">Este organizador ainda não possui rifas ativas.</p>
            <p className="text-xs text-zinc-500">Volte em breve para conferir novos lançamentos!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {raffles.map((raffle) => (
              <RaffleCard key={raffle.id} raffle={raffle} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
