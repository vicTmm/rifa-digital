"use client";

import React, { useState } from "react";
import api from "@/lib/api";
import { formatBRL, formatNumber } from "@/lib/masks";
import { useToast } from "@/context/ToastContext";
import ImageUpload from "@/components/ui/ImageUpload";
import {
  PlusCircle,
  Plus,
  Trash2,
  Trophy,
  Tag,
  Gift,
  Loader2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Flame,
  Calendar
} from "lucide-react";

interface NewRaffleTabProps {
  onSuccess: () => void;
}

export default function NewRaffleTab({ onSuccess }: NewRaffleTabProps) {
  const toast = useToast();

  const [title, setTitle] = useState("");
  const [category, setNewCategory] = useState("Automóveis");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [price, setPrice] = useState(0.50);
  const [totalNumbers, setTotalNumbers] = useState(10000);
  const [minPurchase, setMinPurchase] = useState(1);
  const [drawType, setDrawType] = useState("FEDERAL");
  const [drawDate, setDrawDate] = useState("");
  const [badge, setBadge] = useState("🔥 LANÇAMENTO");

  // Dynamic Combo Discounts
  const [combos, setCombos] = useState<Array<{ quantity: number; discount_percentage: number }>>([
    { quantity: 50, discount_percentage: 10.0 },
    { quantity: 100, discount_percentage: 15.0 },
    { quantity: 250, discount_percentage: 20.0 },
  ]);

  // Dynamic Lucky Numbers
  const [luckyNumbers, setLuckyNumbers] = useState<Array<{ number: string; prize: string }>>([
    { number: "00777", prize: "R$ 500 no PIX" },
    { number: "12345", prize: "R$ 500 no PIX" },
  ]);

  const [loading, setLoading] = useState(false);

  const handleAddCombo = () => {
    setCombos((prev) => [...prev, { quantity: 500, discount_percentage: 25.0 }]);
  };

  const handleRemoveCombo = (index: number) => {
    setCombos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddLuckyNumber = () => {
    setLuckyNumbers((prev) => [...prev, { number: "99999", prize: "R$ 250 no PIX" }]);
  };

  const handleRemoveLuckyNumber = (index: number) => {
    setLuckyNumbers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Informe o título da campanha.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title,
        description,
        category,
        images: imageUrl ? [imageUrl] : ["https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80"],
        price_per_number: Number(price),
        total_numbers: Number(totalNumbers),
        min_purchase: Number(minPurchase),
        max_purchase: 10000,
        draw_type: drawType,
        draw_date: drawDate ? new Date(drawDate).toISOString() : null,
        badge_text: badge,
        is_featured: true,
        discount_combos: combos,
        lucky_numbers: luckyNumbers.map((l) => ({ ...l, claimed: false })),
        ranking_prizes: [
          { position: 1, prize: "R$ 1.000 no PIX" },
          { position: 2, prize: "R$ 300 no PIX" },
        ],
      };

      const res = await api.post("/raffles", payload);
      toast.success(`Campanha "${res.data.title}" criada com sucesso!`, "Parabéns!");
      onSuccess();
    } catch (err: any) {
      console.error("Create raffle error:", err);
      toast.error(err.response?.data?.detail || "Erro ao criar rifa. Verifique os dados.");
    } finally {
      setLoading(false);
    }
  };

  const previewImage = imageUrl || "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left 7 cols: Form Wizard */}
      <form onSubmit={handleSubmit} className="lg:col-span-7 rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="space-y-1 border-b border-zinc-800 pb-4">
          <h2 className="text-xl font-black text-white">Criar Nova Campanha de Rifa</h2>
          <p className="text-xs text-zinc-400">
            Configure detalhes, combos com descontos progressivos e cotas premiadas instantâneas.
          </p>
        </div>

        {/* Basic Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-200 mb-1.5">
              Título da Campanha *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Honda Civic G10 Turbo ou R$ 85.000 no PIX"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-200 mb-1.5">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Automóveis">Automóveis</option>
                <option value="Eletrônicos">Eletrônicos</option>
                <option value="Dinheiro / Pix">Dinheiro / Pix</option>
                <option value="Geral">Outros</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-200 mb-1.5">
                Selo de Destaque (Badge)
              </label>
              <input
                type="text"
                placeholder="Ex: 🔥 MAIS VENDIDA"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-200 mb-1.5">
                Preço por Cota (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value))}
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono font-bold text-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-200 mb-1.5">
                Total de Cotas *
              </label>
              <select
                value={totalNumbers}
                onChange={(e) => setTotalNumbers(parseInt(e.target.value))}
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 font-bold"
              >
                <option value={100}>100 Cotas (00 a 99)</option>
                <option value={1000}>1.000 Cotas (000 a 999)</option>
                <option value={10000}>10.000 Cotas (0000 a 9999)</option>
                <option value={100000}>100.000 Cotas (00000 a 99999)</option>
                <option value={1000000}>1.000.000 Cotas (6 dígitos)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-200 mb-1.5">
                Compra Mínima
              </label>
              <input
                type="number"
                min="1"
                required
                value={minPurchase}
                onChange={(e) => setMinPurchase(parseInt(e.target.value))}
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 font-bold"
              />
            </div>
          </div>

          <ImageUpload
            value={imageUrl}
            onChange={(url) => setImageUrl(url)}
            label="Foto de Capa do Prêmio (Upload Direto ou URL)"
            helperText="Envie a foto do carro, moto, iPhone ou prêmio (JPG, PNG, WEBP até 10MB)"
          />

          <div>
            <label className="block text-xs font-bold text-zinc-200 mb-1.5">
              Descrição e Detalhes do Prêmio
            </label>
            <textarea
              rows={3}
              placeholder="Descreva opcionais, documentação paga, entrega em domicílio..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-200 mb-1.5">
                Tipo de Sorteio
              </label>
              <select
                value={drawType}
                onChange={(e) => setDrawType(e.target.value)}
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="FEDERAL">Loteria Federal (Oficial Caixa)</option>
                <option value="AUTOMATIC">Eletrônico Automático</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-200 mb-1.5">
                Data Prevista do Sorteio
              </label>
              <input
                type="datetime-local"
                value={drawDate}
                onChange={(e) => setDrawDate(e.target.value)}
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Combos Section */}
        <div className="pt-4 border-t border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> Combos Promocionais de Desconto
            </h3>
            <button
              type="button"
              onClick={handleAddCombo}
              className="flex items-center gap-1 text-xs font-bold text-zinc-300 hover:text-white bg-zinc-800 px-2.5 py-1 rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar Combo
            </button>
          </div>

          <div className="space-y-2">
            {combos.map((combo, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-xs">
                <span className="text-zinc-400">Ao comprar</span>
                <input
                  type="number"
                  min="2"
                  value={combo.quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setCombos((prev) => prev.map((c, i) => i === idx ? { ...c, quantity: val } : c));
                  }}
                  className="w-20 rounded-lg bg-zinc-900 border border-zinc-700 px-2 py-1 text-white font-bold text-center"
                />
                <span className="text-zinc-400">cotas, aplicar</span>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={combo.discount_percentage}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setCombos((prev) => prev.map((c, i) => i === idx ? { ...c, discount_percentage: val } : c));
                  }}
                  className="w-16 rounded-lg bg-zinc-900 border border-zinc-700 px-2 py-1 text-emerald-400 font-bold text-center"
                />
                <span className="text-zinc-400">% de desconto</span>

                <button
                  type="button"
                  onClick={() => handleRemoveCombo(idx)}
                  className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-800 ml-auto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Lucky Numbers Section */}
        <div className="pt-4 border-t border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" /> Cotas Premiadas (Instantâneas)
            </h3>
            <button
              type="button"
              onClick={handleAddLuckyNumber}
              className="flex items-center gap-1 text-xs font-bold text-zinc-300 hover:text-white bg-zinc-800 px-2.5 py-1 rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar Cota Premiada
            </button>
          </div>

          <div className="space-y-2">
            {luckyNumbers.map((lucky, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-xs">
                <span className="text-zinc-400">Número</span>
                <input
                  type="text"
                  value={lucky.number}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLuckyNumbers((prev) => prev.map((l, i) => i === idx ? { ...l, number: val } : l));
                  }}
                  placeholder="00777"
                  className="w-24 rounded-lg bg-zinc-900 border border-zinc-700 px-2 py-1 text-amber-400 font-mono font-black text-center"
                />
                <span className="text-zinc-400">Ganha:</span>
                <input
                  type="text"
                  value={lucky.prize}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLuckyNumbers((prev) => prev.map((l, i) => i === idx ? { ...l, prize: val } : l));
                  }}
                  placeholder="R$ 500 no PIX"
                  className="flex-1 rounded-lg bg-zinc-900 border border-zinc-700 px-2 py-1 text-white font-bold"
                />

                <button
                  type="button"
                  onClick={() => handleRemoveLuckyNumber(idx)}
                  className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-800 ml-auto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 text-sm font-black text-zinc-950 shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 disabled:opacity-50 transition-all cursor-pointer hover:scale-[1.01]"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Publicando Rifa...
            </>
          ) : (
            <>
              <PlusCircle className="w-5 h-5" /> Publicar e Ativar Campanha
            </>
          )}
        </button>
      </form>

      {/* Right 5 cols: Live Real-time Preview */}
      <div className="lg:col-span-5 space-y-4 sticky top-24">
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
          <Eye className="w-4 h-4 text-emerald-400" /> Prévia ao Vivo do Card de Venda
        </div>

        <div className="rounded-3xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-2xl">
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-950">
            <img
              src={previewImage}
              alt="Prévia"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/40" />

            <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-black text-zinc-950 shadow-md">
                <Flame className="w-3 h-3 fill-zinc-950" /> {badge || "LANÇAMENTO"}
              </span>

              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900/90 backdrop-blur-md border border-emerald-500/40 px-2.5 py-1 text-xs font-black text-emerald-400">
                {formatBRL(price || 0.5)}
              </span>
            </div>

            <div className="absolute bottom-3 left-3 text-xs text-white bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
              <span>{category} • {formatNumber(totalNumbers)} cotas</span>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <h3 className="text-base font-bold text-white line-clamp-2">
              {title || "Título da sua campanha aparecerá aqui..."}
            </h3>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-zinc-400">Progresso (0%)</span>
                <span className="text-emerald-400">0 cotas pagas</span>
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-950 overflow-hidden border border-zinc-800">
                <div className="h-full bg-emerald-500 w-[5%]" />
              </div>
            </div>

            {luckyNumbers.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl text-xs text-amber-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Trophy className="w-3.5 h-3.5" /> {luckyNumbers.length} Cotas Premiadas configuradas
                </div>
              </div>
            )}

            <div className="w-full text-center rounded-xl bg-emerald-500 py-3 text-xs font-black text-zinc-950">
              Participar Agora (Exemplo)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
