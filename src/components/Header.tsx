"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Settings,
  Sparkles,
  ChevronDown,
  Layers,
  Code2,
  Wand2,
  RefreshCw,
  Zap,
} from "lucide-react";
import { LanguageConfig } from "@/types";
import { SUPPORTED_LANGUAGES } from "@/lib/languages";

interface HeaderProps {
  currentLanguage: LanguageConfig;
  onLanguageChange: (lang: LanguageConfig) => void;
  onRunCode: () => void;
  isRunning: boolean;
  onOpenSettings: () => void;
  hasApiKey: boolean;
  onTriggerAiAction: (action: "explain" | "fix-error" | "translate") => void;
}

const LANGUAGE_DOT_COLORS: Record<string, string> = {
  python: "bg-yellow-400 shadow-yellow-400/50",
  javascript: "bg-amber-300 shadow-amber-300/50",
  typescript: "bg-blue-400 shadow-blue-400/50",
  cpp: "bg-cyan-400 shadow-cyan-400/50",
  c: "bg-sky-500 shadow-sky-500/50",
  java: "bg-orange-500 shadow-orange-500/50",
  go: "bg-teal-400 shadow-teal-400/50",
  rust: "bg-rose-500 shadow-rose-500/50",
  ruby: "bg-red-500 shadow-red-500/50",
  php: "bg-indigo-400 shadow-indigo-400/50",
  swift: "bg-orange-400 shadow-orange-400/50",
  kotlin: "bg-purple-400 shadow-purple-400/50",
  bash: "bg-emerald-400 shadow-emerald-400/50",
};

export function Header({
  currentLanguage,
  onLanguageChange,
  onRunCode,
  isRunning,
  onOpenSettings,
  hasApiKey,
  onTriggerAiAction,
}: HeaderProps) {
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const aiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
      if (aiRef.current && !aiRef.current.contains(e.target as Node)) {
        setIsAiMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="relative z-40 w-full h-16 border-b border-white/[0.08] bg-[#0c0f17]/95 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between text-white select-none">
      {/* Subtle top glow line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent pointer-events-none" />

      {/* Brand & Logo */}
      <div className="flex items-center gap-3.5">
        <div className="relative group cursor-pointer">
          <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-60 blur-sm group-hover:opacity-100 transition duration-300" />
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-[#121622] border border-white/10 shadow-xl">
            <Code2 className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
              CodeLens
            </h1>
            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-300 shadow-sm shadow-indigo-500/10">
              AI Vision
            </span>
          </div>
          <p className="text-[11px] text-gray-400 hidden md:block tracking-wide">
            Turn screenshots into runnable code in seconds
          </p>
        </div>
      </div>

      {/* Center & Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Language Selector Dropdown */}
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#151926] hover:bg-[#1b2133] border border-white/10 hover:border-indigo-500/40 text-xs font-semibold text-gray-200 transition shadow-inner"
          >
            <span
              className={`w-2 h-2 rounded-full shadow-sm ${
                LANGUAGE_DOT_COLORS[currentLanguage.id] || "bg-indigo-400"
              }`}
            />
            <span className="tracking-wide">{currentLanguage.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-0.5" />
          </button>

          {isLangOpen && (
            <div className="absolute left-0 sm:right-0 mt-2 w-56 max-h-80 overflow-y-auto rounded-2xl bg-[#131724] border border-white/10 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl">
              <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-white/5 mb-1 flex items-center justify-between">
                <span>Select Language</span>
                <span className="text-indigo-400 font-mono">13 Available</span>
              </div>
              <div className="space-y-0.5">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => {
                      onLanguageChange(lang);
                      setIsLangOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition ${
                      currentLanguage.id === lang.id
                        ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30"
                        : "text-gray-300 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          LANGUAGE_DOT_COLORS[lang.id] || "bg-gray-400"
                        }`}
                      />
                      <span>{lang.name}</span>
                    </div>
                    <span className="text-[10px] opacity-60 uppercase font-mono tracking-wider">
                      .{lang.extension}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AI Actions Dropdown */}
        <div className="relative" ref={aiRef}>
          <button
            onClick={() => setIsAiMenuOpen(!isAiMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-indigo-500/10 hover:from-purple-500/20 hover:to-indigo-500/20 border border-purple-500/30 text-purple-200 text-xs font-semibold transition shadow-sm shadow-purple-500/5"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span className="hidden sm:inline">AI Magic</span>
            <ChevronDown className="w-3 h-3 text-purple-400" />
          </button>

          {isAiMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-[#141826] border border-white/10 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl">
              <button
                onClick={() => {
                  onTriggerAiAction("fix-error");
                  setIsAiMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-gray-200 hover:bg-white/[0.07] hover:text-white transition text-left"
              >
                <div className="p-1 rounded-lg bg-amber-500/10 text-amber-400">
                  <Wand2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-gray-100">Fix Syntax & Bugs</p>
                  <p className="text-[10px] text-gray-400">Auto-fix error with AI</p>
                </div>
              </button>

              <button
                onClick={() => {
                  onTriggerAiAction("explain");
                  setIsAiMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-gray-200 hover:bg-white/[0.07] hover:text-white transition text-left"
              >
                <div className="p-1 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-gray-100">Explain Code</p>
                  <p className="text-[10px] text-gray-400">Breakdown & complexity</p>
                </div>
              </button>

              <button
                onClick={() => {
                  onTriggerAiAction("translate");
                  setIsAiMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-gray-200 hover:bg-white/[0.07] hover:text-white transition text-left"
              >
                <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-gray-100">Convert Language</p>
                  <p className="text-[10px] text-gray-400">Translate to other langs</p>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Run Code Button */}
        <button
          onClick={onRunCode}
          disabled={isRunning}
          title="Run Code (Cmd/Ctrl + Enter)"
          className={`relative group flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold text-white transition-all duration-200 shadow-lg ${
            isRunning
              ? "bg-emerald-600/50 cursor-not-allowed"
              : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-emerald-500/25 active:scale-95 hover:shadow-emerald-500/40"
          }`}
        >
          {isRunning ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Running...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run</span>
              <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono rounded-md bg-black/30 text-emerald-200 border border-white/10">
                ⌘↵
              </kbd>
            </>
          )}
        </button>

        {/* GitHub link button */}
        <a
          href="https://github.com/kvvishal7396/codelens"
          target="_blank"
          rel="noreferrer"
          title="View on GitHub"
          className="p-2 rounded-xl bg-[#151926] hover:bg-[#1b2133] border border-white/10 text-gray-300 hover:text-white transition"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </a>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          title="Gemini AI Settings"
          className="relative p-2 rounded-xl bg-[#151926] hover:bg-[#1b2133] border border-white/10 text-gray-300 hover:text-white transition"
        >
          <Settings className="w-4 h-4" />
          <span
            className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${
              hasApiKey
                ? "bg-emerald-400 shadow-sm shadow-emerald-400"
                : "bg-amber-400 animate-pulse"
            }`}
          />
        </button>
      </div>
    </header>
  );
}
