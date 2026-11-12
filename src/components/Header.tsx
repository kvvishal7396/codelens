"use client";

import React from "react";
import {
  Play,
  Settings,
  Sparkles,
  ChevronDown,
  Layers,
  Code2,
  Wand2,
  RefreshCw,
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

export function Header({
  currentLanguage,
  onLanguageChange,
  onRunCode,
  isRunning,
  onOpenSettings,
  hasApiKey,
  onTriggerAiAction,
}: HeaderProps) {
  const [isLangOpen, setIsLangOpen] = React.useState(false);
  const [isAiMenuOpen, setIsAiMenuOpen] = React.useState(false);
  const langRef = React.useRef<HTMLDivElement>(null);
  const aiRef = React.useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  React.useEffect(() => {
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
    <header className="sticky top-0 z-40 w-full h-16 border-b border-gray-800/80 bg-[#0b0e14]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between text-white select-none">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 shadow-lg shadow-indigo-500/25">
          <Code2 className="w-5 h-5 text-white" />
          <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0b0e14]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              CodeLens
            </h1>
            <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              v1.0
            </span>
          </div>
          <p className="text-[11px] text-gray-400 hidden sm:block">
            Screenshot to Code & Online Compiler
          </p>
        </div>
      </div>

      {/* Center & Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Language Selector Dropdown */}
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141822] hover:bg-[#1a202c] border border-gray-700/60 text-xs font-medium text-gray-200 transition shadow-sm"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>{currentLanguage.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-0.5" />
          </button>

          {isLangOpen && (
            <div className="absolute left-0 sm:right-0 mt-2 w-52 max-h-72 overflow-y-auto rounded-xl bg-[#141824] border border-gray-700/80 shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Select Language
              </div>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => {
                    onLanguageChange(lang);
                    setIsLangOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition ${
                    currentLanguage.id === lang.id
                      ? "bg-indigo-600 text-white font-medium"
                      : "text-gray-300 hover:bg-gray-800/80 hover:text-white"
                  }`}
                >
                  <span>{lang.name}</span>
                  <span className="text-[10px] opacity-60 uppercase font-mono">
                    .{lang.extension}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* AI Actions Dropdown */}
        <div className="relative" ref={aiRef}>
          <button
            onClick={() => setIsAiMenuOpen(!isAiMenuOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500/10 to-indigo-500/10 hover:from-purple-500/20 hover:to-indigo-500/20 border border-purple-500/30 text-purple-300 hover:text-purple-200 text-xs font-medium transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">AI Actions</span>
            <ChevronDown className="w-3 h-3 text-purple-400" />
          </button>

          {isAiMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#141824] border border-gray-700/80 shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 duration-150">
              <button
                onClick={() => {
                  onTriggerAiAction("fix-error");
                  setIsAiMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition text-left"
              >
                <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Fix Syntax / Bugs</span>
              </button>
              <button
                onClick={() => {
                  onTriggerAiAction("explain");
                  setIsAiMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition text-left"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Explain Code</span>
              </button>
              <button
                onClick={() => {
                  onTriggerAiAction("translate");
                  setIsAiMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition text-left"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                <span>Convert to Other Lang</span>
              </button>
            </div>
          )}
        </div>

        {/* Run Code Button */}
        <button
          onClick={onRunCode}
          disabled={isRunning}
          title="Run Code (Cmd/Ctrl + Enter)"
          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition shadow-lg ${
            isRunning
              ? "bg-emerald-600/50 cursor-not-allowed"
              : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25 active:scale-95"
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
              <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[9px] font-mono rounded bg-emerald-700/60 text-emerald-100 border border-emerald-500/40">
                ⌘↵
              </kbd>
            </>
          )}
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          title="Gemini AI Settings"
          className="relative p-2 rounded-lg bg-[#141822] hover:bg-[#1a202c] border border-gray-700/60 text-gray-300 hover:text-white transition"
        >
          <Settings className="w-4 h-4" />
          <span
            className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
              hasApiKey ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
            }`}
          />
        </button>
      </div>
    </header>
  );
}
