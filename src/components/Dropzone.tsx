"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  UploadCloud,
  Image as ImageIcon,
  Loader2,
  X,
  Sparkles,
  Zap,
  Eye,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Cpu,
} from "lucide-react";
import { SAMPLE_SNIPPETS } from "@/lib/samples";
import { SampleSnippet } from "@/types";

interface DropzoneProps {
  onImageSelected: (base64Image: string, mimeType: string) => void;
  onSelectSample: (sample: SampleSnippet) => void;
  isExtracting: boolean;
  extractStatus: "idle" | "scanning" | "success" | "error";
  selectedImage: string | null;
  onClearImage: () => void;
  onRetryExtraction?: () => void;
  lastExtractedTitle?: string;
  ocrEngine: "universal" | "gemini";
  onToggleEngine: (engine: "universal" | "gemini") => void;
}

export function Dropzone({
  onImageSelected,
  onSelectSample,
  isExtracting,
  extractStatus,
  selectedImage,
  onClearImage,
  onRetryExtraction,
  lastExtractedTitle,
  ocrEngine,
  onToggleEngine,
}: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      if (!e.clipboardData) return;
      const items = e.clipboardData.items;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processFile(file);
            break;
          }
        }
      }
    }

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        onImageSelected(result, file.type);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="relative w-full bg-[#0a0d14] border-b border-white/[0.08] px-4 py-3 sm:px-6">
      {/* Laser scanner animation while extracting */}
      {isExtracting && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_12px_rgba(168,85,247,0.8)] animate-pulse" />
      )}

      <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Drop / Paste Area or Image Preview Badge */}
        <div className="w-full lg:w-auto flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Mode Switcher Pill */}
          <div className="flex items-center p-1 rounded-2xl bg-[#121624] border border-white/10 flex-shrink-0">
            <button
              onClick={() => onToggleEngine("universal")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                ocrEngine === "universal"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30"
                  : "text-gray-400 hover:text-white"
              }`}
              title="100% Free Client-Side OCR. Zero API Keys, Zero Tokens, Unlimited use for everyone."
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Universal Free OCR</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-black/30 font-normal">
                0 Tokens
              </span>
            </button>

            <button
              onClick={() => onToggleEngine("gemini")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                ocrEngine === "gemini"
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30"
                  : "text-gray-400 hover:text-white"
              }`}
              title="Deep Gemini Vision AI Extraction (Uses free Google AI Studio key)"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              <span>Gemini AI Mode</span>
            </button>
          </div>

          {selectedImage ? (
            <div className="relative flex-1 flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-gradient-to-r from-[#131828] to-[#161c2e] border border-indigo-500/40 shadow-lg shadow-indigo-500/5">
              <div className="flex items-center gap-3 min-w-0">
                {/* Thumbnail */}
                <div
                  onClick={() => setShowPreviewModal(true)}
                  className="relative group cursor-pointer w-14 h-11 rounded-xl overflow-hidden border border-white/10 bg-black flex-shrink-0 shadow-md"
                  title="Click to zoom original screenshot"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedImage}
                    alt="Scanned Code"
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <Eye className="w-4 h-4 text-white" />
                  </div>
                </div>

                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-100 truncate">
                      {lastExtractedTitle || "Screenshot Attached"}
                    </span>
                    {extractStatus === "scanning" && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/20 text-[10px] text-indigo-300 font-semibold border border-indigo-500/30">
                        <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
                        {ocrEngine === "universal" ? "Extracting locally..." : "Scanning with Gemini..."}
                      </span>
                    )}
                    {extractStatus === "success" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-[10px] text-emerald-300 font-semibold border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Loaded in Editor
                      </span>
                    )}
                    {extractStatus === "error" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-[10px] text-rose-300 font-semibold border border-rose-500/30">
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                        Extraction Failed
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 truncate mt-0.5">
                    {extractStatus === "success"
                      ? "Code loaded into editor • Edit and click Run"
                      : extractStatus === "error"
                      ? "Click Retry to scan again"
                      : ocrEngine === "universal"
                      ? "Universal Free OCR engine active (Zero token cost)"
                      : "Gemini Vision AI active"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {extractStatus === "error" && onRetryExtraction && (
                  <button
                    onClick={onRetryExtraction}
                    title="Retry Extraction"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition"
                  >
                    <RotateCw className="w-3 h-3" /> Retry
                  </button>
                )}

                <button
                  onClick={onClearImage}
                  title="Remove image"
                  className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`group flex-1 flex items-center justify-between p-2.5 sm:px-4 rounded-2xl border transition-all duration-200 cursor-pointer text-xs ${
                isDragging
                  ? "border-indigo-400 bg-indigo-500/15 text-indigo-200 shadow-lg shadow-indigo-500/10"
                  : "border-dashed border-white/10 hover:border-indigo-500/50 hover:bg-[#131726]/80 text-gray-400"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    processFile(e.target.files[0]);
                  }
                }}
              />
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:scale-105 transition">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-gray-200 group-hover:text-white transition">
                    Paste screenshot anywhere (⌘V / Ctrl+V)
                  </span>{" "}
                  <span className="hidden xl:inline text-gray-500 font-normal">
                    • 100% Free & Unlimited for all visitors
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-semibold uppercase px-2.5 py-1 rounded-lg bg-[#181d2c] text-indigo-300 border border-white/5 shadow-inner">
                  Upload Screenshot
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Sample Snippets Bar */}
        <div className="flex items-center gap-1.5 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          <span className="text-[11px] text-gray-400 flex items-center gap-1 whitespace-nowrap mr-1 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Presets:
          </span>
          {SAMPLE_SNIPPETS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => onSelectSample(sample)}
              className="group px-3 py-1.5 rounded-xl bg-[#141824] hover:bg-[#1c2234] border border-white/10 hover:border-indigo-500/40 text-gray-300 hover:text-white text-xs font-semibold transition flex items-center gap-2 whitespace-nowrap shadow-sm hover:shadow-indigo-500/10"
            >
              <Zap className="w-3 h-3 text-indigo-400 group-hover:scale-110 transition" />
              <span>{sample.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Full Screenshot Modal Preview */}
      {showPreviewModal && selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 animate-in fade-in duration-200"
          onClick={() => setShowPreviewModal(false)}
        >
          <div
            className="relative max-w-4xl max-h-[85vh] rounded-3xl overflow-hidden border border-white/10 bg-[#0e111a] shadow-2xl p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
              <span className="text-xs font-bold text-gray-200 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-400" /> Original Screenshot
              </span>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[75vh] flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImage}
                alt="Source preview"
                className="max-w-full max-h-[70vh] rounded-xl shadow-2xl object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
