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
  FileCode,
} from "lucide-react";
import { LanguageConfig } from "@/types";

interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
  language: LanguageConfig;
}

export function CodeEditor({ code, onChange, language }: CodeEditorProps) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
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
  };

  const handleClear = () => {
    if (confirm("Are you sure you want to clear the editor?")) {
      onChange("");
    }
  };

  const lineCount = (code || "").split("\n").length;
  const charCount = (code || "").length;

  return (
    <div
      className={`flex flex-col h-full bg-[#1e1e1e] border-r border-gray-800/80 transition-all ${
        isExpanded ? "fixed inset-0 z-50 p-4 bg-black/90" : "relative"
      }`}
    >
      {/* Editor Sub-Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-[#181a1f] text-xs text-gray-300">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-indigo-400" />
          <span className="font-mono font-medium text-gray-200">
            main.{language.extension}
          </span>
          <span className="text-[11px] text-gray-500 font-mono">
            ({lineCount} lines, {charCount} chars)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            title="Copy Code"
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#21252b] hover:bg-[#2c313c] text-gray-300 hover:text-white transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="text-[11px] hidden sm:inline">Copy</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            title="Download Code File"
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#21252b] hover:bg-[#2c313c] text-gray-300 hover:text-white transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden sm:inline">Save</span>
          </button>

          <button
            onClick={handleClear}
            title="Clear Editor"
            className="p-1 rounded bg-[#21252b] hover:bg-red-950/60 hover:text-red-400 text-gray-400 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse Editor" : "Expand Fullscreen"}
            className="p-1 rounded bg-[#21252b] hover:bg-[#2c313c] text-gray-400 hover:text-white transition"
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
            padding: { top: 12, bottom: 12 },
          }}
          loading={
            <div className="flex items-center justify-center h-full text-gray-500 text-xs">
              Loading Monaco Editor...
            </div>
          }
        />
      </div>
    </div>
  );
}
