"use client";

import React, { useState } from "react";
import {
  Terminal as TerminalIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  RotateCcw,
  Sliders,
  Cpu,
  CornerDownRight,
  ShieldCheck,
} from "lucide-react";
import { ExecutionResult } from "@/types";

interface TerminalProps {
  result: ExecutionResult | null;
  isRunning: boolean;
  stdin: string;
  onStdinChange: (value: string) => void;
  onFixWithAi: () => void;
  onClear: () => void;
}

export function Terminal({
  result,
  isRunning,
  stdin,
  onStdinChange,
  onFixWithAi,
  onClear,
}: TerminalProps) {
  const [activeTab, setActiveTab] = useState<"output" | "stdin">("output");

  const hasError = result && (result.code !== 0 || !!result.stderr);

  return (
    <div className="flex flex-col h-full bg-[#0a0d14] text-gray-200">
      {/* Terminal Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.08] bg-[#0e111a] text-xs">
        {/* Tabs */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab("output")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition text-xs font-semibold ${
              activeTab === "output"
                ? "bg-[#181d2c] text-white border border-white/10 shadow-sm"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]"
            }`}
          >
            <TerminalIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Console Output</span>
          </button>

          <button
            onClick={() => setActiveTab("stdin")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition text-xs font-semibold relative ${
              activeTab === "stdin"
                ? "bg-[#181d2c] text-white border border-white/10 shadow-sm"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]"
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Interactive Input</span>
            {stdin.trim() && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* ATC Badge & Status Controls */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-300 font-medium">
            <ShieldCheck className="w-3 h-3 text-indigo-400" />
            <span>ATC Sandbox Active</span>
          </div>
          {isRunning && (
            <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-semibold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Compiling in sandbox...
            </span>
          )}

          {!isRunning && result && (
            <div className="flex items-center gap-2">
              {hasError ? (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] font-semibold">
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Failed ({result.code})</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Success</span>
                </span>
              )}

              <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.04] text-[10px] text-gray-400 font-mono">
                <Clock className="w-3 h-3 text-indigo-400" />
                <span>{result.timeMs}ms</span>
              </span>
            </div>
          )}

          <button
            onClick={onClear}
            title="Clear Console"
            className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.08] transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Terminal Area */}
      <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed select-text">
        {activeTab === "output" ? (
          <div className="space-y-3">
            {/* Smart Stdin Shield Notice */}
            {result?.autoSuppliedStdin && (
              <div className="p-3 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-200 shadow-sm animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 text-sm">💡</span>
                  <div>
                    <span className="font-bold text-amber-300">Input Detected:</span> This program requests user input. We provided safe sample inputs so it ran without crashing!
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("stdin")}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold transition whitespace-nowrap"
                >
                  Customize Input →
                </button>
              </div>
            )}

            {/* If Error present, show ATC AI Diagnosis Banner */}
            {hasError && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-950/40 via-purple-950/40 to-indigo-950/40 border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-rose-950/20 animate-in fade-in duration-200">
                <div className="flex items-center gap-2.5 text-xs text-rose-200">
                  <div className="p-1.5 rounded-xl bg-rose-500/20 text-rose-300 flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-purple-300" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-100">Execution Error Encountered</p>
                    <p className="text-[11px] text-gray-400">
                      ATC Auto-Heal can diagnose and patch the bug with 1 click
                    </p>
                  </div>
                </div>
                <button
                  onClick={onFixWithAi}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-bold transition shadow-lg shadow-purple-600/30 whitespace-nowrap flex items-center gap-2 active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  <span>✨ ATC Auto-Heal</span>
                </button>
              </div>
            )}

            {/* Output Display */}
            {result ? (
              <div className="space-y-2.5">
                {result.stdout && (
                  <div className="p-3.5 rounded-2xl bg-[#0e121b] border border-white/5 shadow-inner">
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-1.5">
                      <CornerDownRight className="w-3 h-3" /> Standard Output (stdout)
                    </div>
                    <pre className="text-emerald-100 whitespace-pre-wrap break-words leading-relaxed font-mono">
                      {result.stdout}
                    </pre>
                  </div>
                )}

                {result.stderr && (
                  <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/30 shadow-inner">
                    <div className="flex items-center gap-1.5 text-[10px] text-rose-400 font-bold uppercase tracking-wider mb-1.5">
                      <XCircle className="w-3 h-3" /> Error Stream (stderr)
                    </div>
                    <pre className="text-rose-200 whitespace-pre-wrap break-words leading-relaxed font-mono">
                      {result.stderr}
                    </pre>
                  </div>
                )}

                {!result.stdout && !result.stderr && (
                  <div className="text-gray-500 italic p-4 text-center">
                    Program exited with code 0 and produced no output.
                  </div>
                )}
              </div>
            ) : isRunning ? (
              <div className="flex items-center gap-3 text-indigo-300 py-6">
                <div className="w-3 h-3 rounded-full bg-indigo-500 animate-ping" />
                <span>Compiling in sandboxed environment...</span>
              </div>
            ) : (
              <div className="text-gray-500 space-y-1.5 py-4 px-2">
                <p className="flex items-center gap-2 text-gray-400">
                  <span className="text-indigo-400 font-bold">&gt;</span> CodeLens Execution Engine Ready.
                </p>
                <p className="text-[11px] text-gray-600 pl-4">
                  Paste or drop a screenshot, or click &apos;Run&apos; (⌘+Enter) to execute your code.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Stdin View */
          <div className="h-full flex flex-col space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-gray-400 font-sans">
              <span>
                Standard input passed to interactive functions (e.g.{" "}
                <code className="text-indigo-300 font-mono">input()</code> or{" "}
                <code className="text-indigo-300 font-mono">cin &gt;&gt;</code>):
              </span>
              {stdin && (
                <button
                  onClick={() => onStdinChange("")}
                  className="text-xs text-rose-400 hover:text-rose-300 font-medium"
                >
                  Clear input
                </button>
              )}
            </div>

            {/* Quick Presets Bar */}
            <div className="flex flex-wrap items-center gap-1.5 font-sans">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mr-1">
                Quick Presets:
              </span>
              <button
                type="button"
                onClick={() => onStdinChange("10\n")}
                className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[11px] text-gray-300 border border-white/5 transition"
              >
                Number: <span className="text-amber-400 font-mono">10</span>
              </button>
              <button
                type="button"
                onClick={() => onStdinChange("5\n10 20 30 40 50\n")}
                className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[11px] text-gray-300 border border-white/5 transition"
              >
                Array: <span className="text-amber-400 font-mono">5 \n 10 20...</span>
              </button>
              <button
                type="button"
                onClick={() => onStdinChange("Hello World\n")}
                className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[11px] text-gray-300 border border-white/5 transition"
              >
                Text: <span className="text-amber-400 font-mono">&quot;Hello World&quot;</span>
              </button>
              <button
                type="button"
                onClick={() => onStdinChange("2\n29\n13\n")}
                className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[11px] text-gray-300 border border-white/5 transition"
              >
                Multi Test: <span className="text-amber-400 font-mono">2 \n 29 \n 13</span>
              </button>
            </div>

            <textarea
              value={stdin}
              onChange={(e) => onStdinChange(e.target.value)}
              placeholder="Type your inputs here (one per line)..."
              className="flex-1 w-full p-3.5 rounded-2xl bg-[#080b12] border border-white/10 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none font-mono text-xs leading-relaxed"
              rows={8}
            />
          </div>
        )}
      </div>
    </div>
  );
}
