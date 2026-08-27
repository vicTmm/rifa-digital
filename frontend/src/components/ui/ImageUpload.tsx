"use client";

import React, { useState, useRef } from "react";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { Upload, X, Loader2, Image as ImageIcon, CheckCircle2 } from "lucide-react";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  helperText?: string;
  aspectRatio?: "16/9" | "16/10" | "1/1" | "4/3";
}

export default function ImageUpload({
  value,
  onChange,
  label = "Imagem de Capa (Foto em Alta Resolução)",
  helperText = "Arraste uma foto ou clique para fazer upload (JPG, PNG, WEBP até 10MB)",
  aspectRatio = "16/10",
}: ImageUploadProps) {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUpload = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione um arquivo de imagem válido (JPG, PNG, WEBP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("A imagem selecionada ultrapassa o limite de 10MB.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/uploads", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Format URL with backend origin if relative
      const uploadedUrl = response.data.url.startsWith("http")
        ? response.data.url
        : `${api.defaults.baseURL?.replace("/api", "") || "http://localhost:8000"}${response.data.url}`;

      onChange(uploadedUrl);
      toast.success("Foto enviada com sucesso!", "Upload Concluído");
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.response?.data?.detail || "Erro ao fazer upload da imagem.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-bold text-zinc-200">{label}</label>}

      {value ? (
        <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 group">
          <div className={`relative w-full aspect-[${aspectRatio}] max-h-56`}>
            <img
              src={value}
              alt="Uploaded Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-bold hover:bg-zinc-800 transition-all cursor-pointer"
              >
                Trocar Imagem
              </button>
              <button
                type="button"
                onClick={() => onChange("")}
                className="p-2 rounded-xl bg-red-950/80 border border-red-500/40 text-red-400 hover:bg-red-900 transition-all cursor-pointer"
                title="Remover imagem"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl transition-all cursor-pointer text-center ${
            dragActive
              ? "border-emerald-500 bg-emerald-500/10 scale-[1.01]"
              : "border-zinc-800 bg-zinc-950/70 hover:border-zinc-700 hover:bg-zinc-950"
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center space-y-2 py-4">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
              <p className="text-xs font-bold text-zinc-200">Enviando imagem para a nuvem...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2 py-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-emerald-400 shadow-md">
                <Upload className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-white">
                  Arraste e solte sua foto aqui ou <span className="text-emerald-400 underline">procure no dispositivo</span>
                </p>
                <p className="text-[11px] text-zinc-400">{helperText}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
