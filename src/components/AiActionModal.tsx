"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Wand2,
  RefreshCw,
  X,
  Check,
  ArrowRight,
  Clock,
  Cpu,
} from "lucide-react";
import { SUPPORTED_LANGUAGES } from "@/lib/languages";
import { LanguageConfig } from "@/types";

interface AiActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionType: "fix-error" | "explain" | "translate";
  isLoading: boolean;
  data: any; // Response from /api/assist
  currentLanguage: LanguageConfig;
  onApplyCode: (code: string, newLanguage?: LanguageConfig) => void;
  onTranslateRequest?: (targetLang: string) => void;
}

export function AiActionModal({
  isOpen,
  onClose,
  actionType,
  isLoading,
  data,
  currentLanguage,
  onApplyCode,
  onTranslateRequest,
}: AiActionModalProps) {
  const [selectedTargetLang, setSelectedTargetLang] = useState("javascript");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-[#12151d] border border-gray-800 shadow-2xl overflow-hidden text-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#161a24]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              {actionType === "fix-error" && <Wand2 className="w-5 h-5" />}
              {actionType === "explain" && <Sparkles className="w-5 h-5" />}
              {actionType === "translate" && <RefreshCw className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">
                {actionType === "fix-error" && "AI Bug Fix & Diagnosis"}
                {actionType === "explain" && "Code Explanation & Analysis"}
                {actionType === "translate" && "Language Converter"}
              </h2>
              <p className="text-xs text-gray-400">
                Powered by Google Gemini Intelligence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-8 h-8 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
              <p className="text-sm font-medium text-gray-300">
                {actionType === "fix-error" && "Diagnosing bugs and applying fix..."}
                {actionType === "explain" && "Analyzing code logic and complexity..."}
                {actionType === "translate" && "Converting syntax to target language..."}
              </p>
            </div>
          ) : (
            <>
              {/* Fix Bug View */}
              {actionType === "fix-error" && data && (
                <div className="space-y-4">
                  {data.explanation && (
                    <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-200">
                      <span className="font-semibold text-indigo-400 block mb-1">
                        Root Cause & Fix:
                      </span>
                      {data.explanation}
                    </div>
                  )}

                  {data.fixedCode && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-medium text-gray-300">
                        Corrected Code:
                      </span>
                      <pre className="p-3.5 rounded-xl bg-[#0a0d13] border border-gray-800 font-mono text-xs text-emerald-300 overflow-x-auto max-h-60">
                        {data.fixedCode}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Explain View */}
              {actionType === "explain" && data && (
                <div className="space-y-4 text-xs">
                  {data.summary && (
                    <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/20 text-purple-200">
                      <span className="font-semibold text-purple-400 block mb-1">
                        Summary:
                      </span>
                      {data.summary}
                    </div>
                  )}

                  {data.steps && Array.isArray(data.steps) && (
                    <div className="space-y-2">
                      <span className="font-semibold text-gray-300 block">
                        Step-by-Step Logic:
                      </span>
                      <ol className="space-y-1.5 list-decimal list-inside text-gray-300">
                        {data.steps.map((step: string, idx: number) => (
                          <li key={idx} className="leading-relaxed">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {(data.timeComplexity || data.spaceComplexity) && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="p-3 rounded-xl bg-[#141824] border border-gray-800 flex items-center gap-2.5">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-semibold">
                            Time Complexity
                          </p>
                          <p className="font-mono text-xs font-bold text-gray-100">
                            {data.timeComplexity || "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-[#141824] border border-gray-800 flex items-center gap-2.5">
                        <Cpu className="w-4 h-4 text-cyan-400" />
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-semibold">
                            Space Complexity
                          </p>
                          <p className="font-mono text-xs font-bold text-gray-100">
                            {data.spaceComplexity || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Translate View */}
              {actionType === "translate" && (
                <div className="space-y-4">
                  {/* Selector Bar */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 font-medium">From:</span>
                    <span className="px-2.5 py-1 rounded-lg bg-gray-800 text-xs font-mono text-gray-200">
                      {currentLanguage.name}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-500" />
                    <span className="text-xs text-gray-400 font-medium">To:</span>
                    <select
                      value={selectedTargetLang}
                      onChange={(e) => setSelectedTargetLang(e.target.value)}
                      className="px-2.5 py-1 rounded-lg bg-[#0d1017] border border-gray-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      {SUPPORTED_LANGUAGES.filter(
                        (l) => l.id !== currentLanguage.id
                      ).map((lang) => (
                        <option key={lang.id} value={lang.id}>
                          {lang.name}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => onTranslateRequest && onTranslateRequest(selectedTargetLang)}
                      className="ml-auto px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition"
                    >
                      Convert Now
                    </button>
                  </div>

                  {data && data.translatedCode && (
                    <div className="space-y-2">
                      {data.explanation && (
                        <p className="text-xs text-gray-400 italic">
                          {data.explanation}
                        </p>
                      )}
                      <pre className="p-3.5 rounded-xl bg-[#0a0d13] border border-gray-800 font-mono text-xs text-emerald-300 overflow-x-auto max-h-60">
                        {data.translatedCode}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800 bg-[#161a24]">
          <div className="text-[11px] text-gray-500">
            {actionType === "fix-error" && "Review before applying to editor"}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white transition"
            >
              Close
            </button>

            {actionType === "fix-error" && data?.fixedCode && (
              <button
                onClick={() => {
                  onApplyCode(data.fixedCode);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition shadow-md shadow-emerald-600/20"
              >
                <Check className="w-4 h-4" /> Apply Fix to Editor
              </button>
            )}

            {actionType === "translate" && data?.translatedCode && (
              <button
                onClick={() => {
                  const targetConfig = SUPPORTED_LANGUAGES.find(
                    (l) => l.id === selectedTargetLang
                  );
                  onApplyCode(data.translatedCode, targetConfig);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition shadow-md shadow-emerald-600/20"
              >
                <Check className="w-4 h-4" /> Replace in Editor
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
