"use client";

import React, { useState } from "react";
import api from "@/lib/api";
import { maskPhone, maskCpfOrCnpj } from "@/lib/masks";
import { useToast } from "@/context/ToastContext";
import ImageUpload from "@/components/ui/ImageUpload";
import {
  Settings,
  Store,
  MessageCircle,
  Instagram,
  CreditCard,
  Key,
  CheckCircle2,
  Loader2
} from "lucide-react";

interface SettingsTabProps {
  tenant: any;
  onSuccess: () => void;
}

export default function SettingsTab({ tenant, onSuccess }: SettingsTabProps) {
  const toast = useToast();

  const [storeName, setStoreName] = useState(tenant?.name || "");
  const [storeSlug, setStoreSlug] = useState(tenant?.slug || "");
  const [storeBio, setStoreBio] = useState(tenant?.bio || "");
  const [storeLogoUrl, setStoreLogoUrl] = useState(tenant?.logo_url || "");
  const [storeBannerUrl, setStoreBannerUrl] = useState(tenant?.banner_url || "");
  const [storeWhatsapp, setStoreWhatsapp] = useState(tenant?.whatsapp || "");
  const [storeInstagram, setStoreInstagram] = useState(tenant?.instagram || "");
  const [storePixKey, setStorePixKey] = useState(tenant?.pix_key || "");
  const [storePixKeyType, setStorePixKeyType] = useState(tenant?.pix_key_type || "CPF");
  const [storeMpToken, setStoreMpToken] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);

    try {
      await api.put("/tenants/me/profile", {
        name: storeName,
        slug: storeSlug,
        bio: storeBio,
        logo_url: storeLogoUrl || undefined,
        banner_url: storeBannerUrl || undefined,
        whatsapp: storeWhatsapp.replace(/\D/g, ""),
        instagram: storeInstagram,
        pix_key: storePixKey,
        pix_key_type: storePixKeyType,
        mp_access_token: storeMpToken || undefined,
      });

      toast.success("Configurações da loja e PIX salvas com sucesso!", "Atualizado!");
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Erro ao salvar configurações.");
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 max-w-2xl mx-auto shadow-xl space-y-6">
      <div className="space-y-1 border-b border-zinc-800 pb-4">
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-400" /> Configurações da Loja & PIX
        </h2>
        <p className="text-xs text-zinc-400">
          Personalize sua página pública e cadastre seus dados para recebimento e saques automáticos.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-zinc-200 mb-1.5">
            Nome de Exibição da Loja *
          </label>
          <input
            type="text"
            required
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 font-bold"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-200 mb-1.5">
            Link Personalizado da sua Loja (Slug) *
          </label>
          <div className="flex items-center">
            <span className="rounded-l-xl bg-zinc-800 px-3.5 py-3 text-xs text-zinc-400 border border-r-0 border-zinc-700 font-mono">
              rifadigital.com/o/
            </span>
            <input
              type="text"
              required
              value={storeSlug}
              onChange={(e) => setStoreSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
              className="flex-1 rounded-r-xl bg-zinc-950 border border-zinc-800 px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono font-bold"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-200 mb-1.5">
            Biografia / Slogan da Loja
          </label>
          <textarea
            rows={2}
            value={storeBio}
            onChange={(e) => setStoreBio(e.target.value)}
            placeholder="Ex: Sorteios oficiais toda semana com entrega rápida..."
            className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ImageUpload
            value={storeLogoUrl}
            onChange={(url) => setStoreLogoUrl(url)}
            label="Logo da Loja / Avatar"
            helperText="Formato quadrado (JPG, PNG, WEBP)"
            aspectRatio="1/1"
          />

          <ImageUpload
            value={storeBannerUrl}
            onChange={(url) => setStoreBannerUrl(url)}
            label="Banner de Cabeçalho da Loja"
            helperText="Formato panorâmico (JPG, PNG, WEBP)"
            aspectRatio="16/9"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-zinc-200 mb-1.5">
              WhatsApp de Suporte
            </label>
            <input
              type="tel"
              value={storeWhatsapp}
              onChange={(e) => setStoreWhatsapp(maskPhone(e.target.value))}
              placeholder="(11) 98765-4321"
              className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-200 mb-1.5">
              Instagram da Loja
            </label>
            <input
              type="text"
              value={storeInstagram}
              onChange={(e) => setStoreInstagram(e.target.value)}
              placeholder="@sualoja"
              className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-zinc-800 space-y-3">
          <label className="block text-xs font-bold text-zinc-200">
            Chave PIX para Receber Saques de Lucro *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <select
              value={storePixKeyType}
              onChange={(e) => setStorePixKeyType(e.target.value)}
              className="rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-3 text-xs text-white font-bold"
            >
              <option value="CPF">CPF</option>
              <option value="CNPJ">CNPJ</option>
              <option value="EMAIL">E-mail</option>
              <option value="TELEFONE">Telefone</option>
              <option value="ALEATORIA">Chave Aleatória</option>
            </select>
            <input
              type="text"
              placeholder="Digite sua chave PIX..."
              value={storePixKey}
              onChange={(e) => setStorePixKey(e.target.value)}
              className="sm:col-span-2 rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono font-bold"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-zinc-800 space-y-2">
          <label className="block text-xs font-bold text-zinc-200">
            Token Mercado Pago (Opcional - para receber direto na sua credencial MP)
          </label>
          <input
            type="password"
            placeholder="APP_USR-..."
            value={storeMpToken}
            onChange={(e) => setStoreMpToken(e.target.value)}
            className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
          />
          <span className="text-[11px] text-zinc-400 block">
            Deixando em branco, a plataforma processa via gateway central com saque instantâneo no PIX.
          </span>
        </div>

        <button
          type="submit"
          disabled={savingSettings}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-sm font-black text-zinc-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 disabled:opacity-50 transition-all cursor-pointer hover:scale-[1.01]"
        >
          {savingSettings ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
            </>
          ) : (
            <>
              Salvar Configurações
            </>
          )}
        </button>
      </form>
    </div>
  );
}
