"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  UploadCloud,
  Image as ImageIcon,
  Loader2,
  X,
  FileCode2,
  Sparkles,
} from "lucide-react";
import { SAMPLE_SNIPPETS } from "@/lib/samples";
import { SampleSnippet } from "@/types";

interface DropzoneProps {
  onImageSelected: (base64Image: string, mimeType: string) => void;
  onSelectSample: (sample: SampleSnippet) => void;
  isExtracting: boolean;
  selectedImage: string | null;
  onClearImage: () => void;
}

export function Dropzone({
  onImageSelected,
  onSelectSample,
  isExtracting,
  selectedImage,
  onClearImage,
}: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global clipboard paste listener
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
      alert("Please upload an image file (PNG, JPG, WebP, etc.)");
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
    <div className="w-full bg-[#11141c] border-b border-gray-800/80 px-4 py-3 sm:px-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Drop / Paste Area or Image Preview Badge */}
        <div className="w-full md:w-auto flex-1 flex items-center gap-3">
          {selectedImage ? (
            <div className="flex items-center gap-3 p-2 rounded-xl bg-[#161a24] border border-indigo-500/30 w-full sm:w-auto">
              {/* Thumbnail */}
              <div
                onClick={() => setShowPreviewModal(true)}
                className="relative group cursor-pointer w-14 h-10 rounded-lg overflow-hidden border border-gray-700 bg-black flex-shrink-0"
                title="Click to view full image"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedImage}
                  alt="Scanned Code"
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                  <ImageIcon className="w-3.5 h-3.5 text-white" />
                </div>
              </div>

              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-200 truncate">
                    Screenshot Loaded
                  </span>
                  {isExtracting ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-indigo-400 font-medium">
                      <Loader2 className="w-3 h-3 animate-spin" /> Scanning with AI...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                      ✓ Extracted
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 truncate">
                  Click thumbnail to view original screenshot
                </p>
              </div>

              <button
                onClick={onClearImage}
                title="Remove image"
                className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex-1 flex items-center justify-between p-2.5 sm:px-4 rounded-xl border border-dashed cursor-pointer transition text-xs ${
                isDragging
                  ? "border-indigo-500 bg-indigo-500/10 text-indigo-300"
                  : "border-gray-700/80 hover:border-indigo-500/50 hover:bg-[#161a24] text-gray-400"
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
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-gray-200">
                    Paste image anywhere (⌘V / Ctrl+V)
                  </span>{" "}
                  <span className="hidden lg:inline text-gray-500">
                    or drag & drop a screenshot to extract code
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700 hidden sm:inline">
                Upload File
              </span>
            </div>
          )}
        </div>

        {/* Sample Snippets Bar */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-[11px] text-gray-400 flex items-center gap-1 whitespace-nowrap mr-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> Test with:
          </span>
          {SAMPLE_SNIPPETS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => onSelectSample(sample)}
              className="px-2.5 py-1 rounded-lg bg-[#161a24] hover:bg-[#1f2433] border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white text-[11px] font-medium transition flex items-center gap-1.5 whitespace-nowrap"
            >
              <FileCode2 className="w-3 h-3 text-indigo-400" />
              <span>{sample.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Full Screenshot Modal Preview */}
      {showPreviewModal && selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150"
          onClick={() => setShowPreviewModal(false)}
        >
          <div
            className="relative max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden border border-gray-800 bg-[#0d1017] shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
              <span className="text-xs font-semibold text-gray-300 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-400" /> Original Screenshot
              </span>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 overflow-auto max-h-[75vh] flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImage}
                alt="Source preview"
                className="max-w-full max-h-[70vh] rounded-lg shadow-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
