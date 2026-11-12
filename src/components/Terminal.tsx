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
    <div className="flex flex-col h-full bg-[#0e1117] text-gray-200">
      {/* Terminal Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-[#141822] text-xs">
        {/* Tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("output")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition font-medium text-xs ${
              activeTab === "output"
                ? "bg-[#1c2230] text-white border border-gray-700/60"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
            }`}
          >
            <TerminalIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Output</span>
          </button>

          <button
            onClick={() => setActiveTab("stdin")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition font-medium text-xs relative ${
              activeTab === "stdin"
                ? "bg-[#1c2230] text-white border border-gray-700/60"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Input (stdin)</span>
            {stdin.trim() && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            )}
          </button>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center gap-2">
          {isRunning && (
            <span className="flex items-center gap-1.5 text-[11px] text-amber-400 font-medium">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Executing...
            </span>
          )}

          {!isRunning && result && (
            <div className="flex items-center gap-2">
              {hasError ? (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-medium">
                  <XCircle className="w-3 h-3" /> Exited {result.code}
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Exited 0
                </span>
              )}

              <span className="flex items-center gap-1 text-[11px] text-gray-500 font-mono">
                <Clock className="w-3 h-3" /> {result.timeMs}ms
              </span>
            </div>
          )}

          <button
            onClick={onClear}
            title="Clear Console"
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Terminal View */}
      <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed">
        {activeTab === "output" ? (
          <div className="space-y-3">
            {/* If Error present, show AI Fix Suggestion Banner */}
            {hasError && (
              <div className="p-3 rounded-xl bg-gradient-to-r from-red-950/40 via-purple-950/30 to-indigo-950/40 border border-red-500/30 flex items-center justify-between gap-3 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-xs text-red-300">
                  <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>Execution failed. Let AI diagnose and fix the error.</span>
                </div>
                <button
                  onClick={onFixWithAi}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[11px] font-semibold transition shadow-md shadow-purple-600/30 whitespace-nowrap flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3" /> Fix with AI
                </button>
              </div>
            )}

            {/* Output Display */}
            {result ? (
              <div className="space-y-2">
                {result.stdout && (
                  <pre className="text-gray-100 whitespace-pre-wrap break-words">
                    {result.stdout}
                  </pre>
                )}

                {result.stderr && (
                  <pre className="text-red-400 bg-red-950/20 p-2.5 rounded-lg border border-red-900/40 whitespace-pre-wrap break-words">
                    {result.stderr}
                  </pre>
                )}

                {!result.stdout && !result.stderr && (
                  <div className="text-gray-500 italic">
                    Program exited with no output.
                  </div>
                )}
              </div>
            ) : isRunning ? (
              <div className="text-gray-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Compiling code and sending to sandbox...
              </div>
            ) : (
              <div className="text-gray-600 space-y-1">
                <p>&gt; CodeLens Terminal Ready.</p>
                <p>&gt; Press &apos;Run&apos; (⌘+Enter) to execute your program.</p>
              </div>
            )}
          </div>
        ) : (
          /* Stdin View */
          <div className="h-full flex flex-col space-y-2">
            <p className="text-[11px] text-gray-400 font-sans">
              Enter any standard input (stdin) that your code expects (e.g. for{" "}
              <code className="text-indigo-300">input()</code> in Python or{" "}
              <code className="text-indigo-300">cin &gt;&gt;</code> in C++):
            </p>
            <textarea
              value={stdin}
              onChange={(e) => onStdinChange(e.target.value)}
              placeholder="Type inputs here, one per line..."
              className="flex-1 w-full p-3 rounded-lg bg-[#080a0f] border border-gray-800 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none font-mono text-xs"
              rows={8}
            />
          </div>
        )}
      </div>
    </div>
  );
}
