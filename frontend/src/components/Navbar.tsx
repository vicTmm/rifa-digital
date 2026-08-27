"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Ticket, PlusCircle, User, LogOut, Menu, X, ShieldCheck, Sparkles, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Ticket className="h-5 w-5 text-zinc-950 font-bold" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
              RIFA<span className="text-emerald-400">DIGITAL</span>
            </span>
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest -mt-1 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-emerald-400" /> Sorteios Oficiais
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm font-medium text-zinc-300 hover:text-emerald-400 transition-colors">
            Explorar Rifas
          </Link>
          <Link href="/meus-bilhetes" className="text-sm font-medium text-zinc-300 hover:text-emerald-400 flex items-center gap-1.5 transition-colors">
            <Ticket className="w-4 h-4 text-emerald-400" /> Meus Bilhetes
          </Link>
          <Link href="/#como-funciona" className="text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors">
            Como Funciona
          </Link>
        </nav>

        {/* Right CTA / User profile */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {user.role === "SUPERADMIN" && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 rounded-lg bg-purple-950/60 border border-purple-500/30 px-3.5 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-900/60 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> Admin Geral
                </Link>
              )}
              {user.role === "ORGANIZER" && (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" /> Painel Organizador
                </Link>
              )}
              <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
                <span className="text-xs font-medium text-zinc-300 max-w-[120px] truncate">
                  {user.full_name}
                </span>
                <button
                  onClick={logout}
                  title="Sair da conta"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-semibold text-zinc-300 hover:text-white px-3 py-1.5 transition-colors"
              >
                Entrar
              </Link>
              <Link
                href="/cadastro"
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-xs font-bold text-zinc-950 shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-500 transition-all hover:scale-105"
              >
                <PlusCircle className="w-4 h-4" /> Criar Minha Rifa
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-zinc-800 bg-zinc-950 px-4 py-4 space-y-3">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-zinc-300 py-1"
          >
            Explorar Rifas
          </Link>
          <Link
            href="/meus-bilhetes"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-emerald-400 py-1"
          >
            Meus Bilhetes
          </Link>
          <Link
            href="/#como-funciona"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-zinc-400 py-1"
          >
            Como Funciona
          </Link>

          <div className="pt-3 border-t border-zinc-800 space-y-2">
            {user ? (
              <>
                {user.role === "ORGANIZER" && (
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 py-2 text-sm font-semibold text-emerald-400"
                  >
                    Painel do Organizador
                  </Link>
                )}
                {user.role === "SUPERADMIN" && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center rounded-lg bg-purple-950 border border-purple-500/30 py-2 text-sm font-semibold text-purple-300"
                  >
                    Admin Geral
                  </Link>
                )}
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-center text-sm font-medium text-red-400 py-2"
                >
                  Sair da Conta ({user.full_name})
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center rounded-xl bg-zinc-900 border border-zinc-700 py-2 text-sm font-semibold text-white"
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center rounded-xl bg-emerald-500 py-2 text-sm font-bold text-zinc-950"
                >
                  Criar Rifa
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
