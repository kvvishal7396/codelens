"use client";

import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from "lucide-react";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed top-20 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />,
    info: <Info className="w-4 h-4 text-sky-400 flex-shrink-0" />,
  };

  const borders = {
    success: "border-emerald-500/30 bg-[#0d1713]/90 shadow-emerald-500/10",
    error: "border-rose-500/30 bg-[#1a0f12]/90 shadow-rose-500/10",
    warning: "border-amber-500/30 bg-[#1a150c]/90 shadow-amber-500/10",
    info: "border-sky-500/30 bg-[#0c141d]/90 shadow-sky-500/10",
  };

  return (
    <div
      className={`pointer-events-auto flex items-start justify-between gap-3 p-3.5 rounded-xl border backdrop-blur-xl shadow-xl transition-all duration-300 animate-in slide-in-from-top-3 fade-in ${
        borders[toast.type]
      }`}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <div className="mt-0.5">{icons[toast.type]}</div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white tracking-wide">
            {toast.title}
          </p>
          {toast.message && (
            <p className="text-[11px] text-gray-300 mt-0.5 leading-relaxed break-words">
              {toast.message}
            </p>
          )}
        </div>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-gray-400 hover:text-white p-0.5 rounded transition flex-shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
