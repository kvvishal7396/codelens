"use client";

import React, { useState } from "react";
import Editor from "@monaco-editor/react";
import {
  Copy,
  Check,
  Download,
  Trash2,
  Maximize2,
  Minimize2,
  FileCode2,
  Sparkles,
} from "lucide-react";
import { LanguageConfig } from "@/types";

interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
  language: LanguageConfig;
  onNotify?: (title: string, message?: string, type?: "success" | "info") => void;
}

export function CodeEditor({ code, onChange, language, onNotify }: CodeEditorProps) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    if (onNotify) {
      onNotify("Copied to Clipboard", "Code snippet copied successfully.", "success");
    }
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `main.${language.extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    if (onNotify) {
      onNotify("Downloaded File", `Saved as main.${language.extension}`, "info");
    }
  };

  const handleClear = () => {
    onChange("");
    if (onNotify) {
      onNotify("Editor Cleared", "Ready for new code.", "info");
    }
  };

  const lineCount = (code || "").split("\n").length;
  const charCount = (code || "").length;

  return (
    <div
      className={`flex flex-col h-full bg-[#11141d] border-r border-white/[0.08] transition-all ${
        isExpanded ? "fixed inset-0 z-50 p-6 bg-black/95 backdrop-blur-2xl" : "relative"
      }`}
    >
      {/* Editor Tab Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.08] bg-[#0e111a] text-xs">
        {/* Active File Tab */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#161a26] border border-white/10 text-gray-200 shadow-sm">
            <FileCode2 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-mono font-semibold text-xs text-white">
              main.{language.extension}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          </div>

          <span className="text-[11px] text-gray-500 font-mono hidden sm:inline">
            {lineCount} lines • {charCount} chars
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            title="Copy Code"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161a26] hover:bg-[#1f2434] border border-white/5 hover:border-white/15 text-gray-300 hover:text-white transition shadow-sm text-xs font-medium"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-gray-400" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            title="Download Code File"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161a26] hover:bg-[#1f2434] border border-white/5 hover:border-white/15 text-gray-300 hover:text-white transition shadow-sm text-xs font-medium"
          >
            <Download className="w-3.5 h-3.5 text-gray-400" />
            <span className="hidden sm:inline">Download</span>
          </button>

          <button
            onClick={handleClear}
            title="Clear Editor"
            className="p-1.5 rounded-xl bg-[#161a26] hover:bg-rose-950/40 hover:text-rose-400 hover:border-rose-500/30 border border-white/5 text-gray-400 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Exit Fullscreen" : "Fullscreen Editor"}
            className="p-1.5 rounded-xl bg-[#161a26] hover:bg-[#1f2434] border border-white/5 hover:border-white/15 text-gray-400 hover:text-white transition"
          >
            {isExpanded ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Monaco Editor Container */}
      <div className="flex-1 w-full min-h-[300px] overflow-hidden">
        <Editor
          height="100%"
          language={language.monacoLang}
          value={code}
          onChange={(val) => onChange(val || "")}
          theme="vs-dark"
          options={{
            fontSize: 14,
            fontFamily: "var(--font-geist-mono), monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            tabSize: 4,
            automaticLayout: true,
            wordWrap: "on",
            renderLineHighlight: "all",
            bracketPairColorization: { enabled: true },
            padding: { top: 14, bottom: 14 },
          }}
          loading={
            <div className="flex items-center justify-center h-full text-gray-500 text-xs">
              <Sparkles className="w-4 h-4 animate-spin mr-2 text-indigo-400" />
              Loading Monaco Editor...
            </div>
          }
        />
      </div>
    </div>
  );
}
