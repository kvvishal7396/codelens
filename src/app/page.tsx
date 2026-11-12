"use client";

import React, { useState, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import { Header } from "@/components/Header";
import { Dropzone } from "@/components/Dropzone";
import { CodeEditor } from "@/components/CodeEditor";
import { Terminal } from "@/components/Terminal";
import { SettingsModal } from "@/components/SettingsModal";
import { AiActionModal } from "@/components/AiActionModal";
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  findLanguageById,
} from "@/lib/languages";
import { LanguageConfig, ExecutionResult, SampleSnippet } from "@/types";
import {
  getStoredApiKey,
  saveRecentSnippet,
} from "@/lib/storage";

export default function Home() {
  const [currentLanguage, setCurrentLanguage] = useState<LanguageConfig>(DEFAULT_LANGUAGE);
  const [code, setCode] = useState<string>(DEFAULT_LANGUAGE.sampleCode);
  const [stdin, setStdin] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Loading States
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);

  // Settings & Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);

  // AI Modal
  const [aiModal, setAiModal] = useState<{
    isOpen: boolean;
    actionType: "fix-error" | "explain" | "translate";
    isLoading: boolean;
    data: any;
  }>({
    isOpen: false,
    actionType: "explain",
    isLoading: false,
    data: null,
  });

  // Check stored API key on mount
  useEffect(() => {
    const key = getStoredApiKey();
    setHasApiKey(Boolean(key));
  }, []);

  // Handle Code Execution
  const handleRunCode = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    setExecutionResult(null);

    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          languageId: currentLanguage.judge0Id,
          code,
          stdin,
        }),
      });

      const data = await res.json();
      setExecutionResult(data);

      if (data.code === 0 && !data.stderr) {
        // Trigger subtle confetti celebration on successful run
        confetti({
          particleCount: 30,
          spread: 60,
          origin: { y: 0.8 },
          colors: ["#10b981", "#6366f1", "#3b82f6"],
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Execution failed";
      setExecutionResult({
        stdout: "",
        stderr: msg,
        output: msg,
        code: 1,
        timeMs: 0,
      });
    } finally {
      setIsRunning(false);
    }
  }, [isRunning, currentLanguage, code, stdin]);

  // Global Keyboard Shortcuts (Cmd+Enter / Ctrl+Enter to Run)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleRunCode();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleRunCode]);

  // Switch Language
  const handleLanguageChange = (newLang: LanguageConfig) => {
    setCurrentLanguage(newLang);
    // If the editor has the old language's default sample code, switch to the new language's default
    const isOldSample = SUPPORTED_LANGUAGES.some(
      (l) => l.sampleCode.trim() === code.trim()
    );
    if (isOldSample) {
      setCode(newLang.sampleCode);
    }
  };

  // Image Selected (via paste or upload)
  const handleImageSelected = async (base64Image: string, mimeType: string) => {
    setSelectedImage(base64Image);
    const key = getStoredApiKey();

    if (!key) {
      setIsSettingsOpen(true);
      return;
    }

    setIsExtracting(true);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64Image,
          mimeType,
          apiKey: key,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "MISSING_API_KEY") {
          setIsSettingsOpen(true);
        } else {
          alert(data.error || "Failed to extract code from screenshot.");
        }
        return;
      }

      if (data.code) {
        setCode(data.code);
        if (data.language) {
          const matchedLang = findLanguageById(data.language);
          setCurrentLanguage(matchedLang);
        }
        saveRecentSnippet({
          title: data.title || "Extracted Snippet",
          language: data.language || currentLanguage.id,
          code: data.code,
        });

        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.2 },
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error extracting code";
      alert(msg);
    } finally {
      setIsExtracting(false);
    }
  };

  // Select Built-in Sample Snippet
  const handleSelectSample = (sample: SampleSnippet) => {
    const matched = findLanguageById(sample.language);
    setCurrentLanguage(matched);
    setCode(sample.code);
    setSelectedImage(null);
    setExecutionResult(null);
  };

  // Trigger AI Action (Explain, Fix, Translate)
  const handleTriggerAiAction = async (
    action: "fix-error" | "explain" | "translate",
    targetLang?: string
  ) => {
    const key = getStoredApiKey();
    if (!key) {
      setIsSettingsOpen(true);
      return;
    }

    setAiModal({
      isOpen: true,
      actionType: action,
      isLoading: true,
      data: null,
    });

    try {
      const res = await fetch("/api/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          code,
          language: currentLanguage.name,
          targetLanguage: targetLang || "javascript",
          errorOutput: executionResult?.stderr || "",
          apiKey: key,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "AI Action failed.");
        setAiModal((prev) => ({ ...prev, isOpen: false }));
        return;
      }

      setAiModal((prev) => ({
        ...prev,
        isLoading: false,
        data,
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "AI Action failed";
      alert(msg);
      setAiModal((prev) => ({ ...prev, isOpen: false }));
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#090b10] text-gray-100 overflow-hidden font-sans">
      {/* Top Header */}
      <Header
        currentLanguage={currentLanguage}
        onLanguageChange={handleLanguageChange}
        onRunCode={handleRunCode}
        isRunning={isRunning}
        onOpenSettings={() => setIsSettingsOpen(true)}
        hasApiKey={hasApiKey}
        onTriggerAiAction={(action) => handleTriggerAiAction(action)}
      />

      {/* Image Upload / Paste / Sample Bar */}
      <Dropzone
        onImageSelected={handleImageSelected}
        onSelectSample={handleSelectSample}
        isExtracting={isExtracting}
        selectedImage={selectedImage}
        onClearImage={() => setSelectedImage(null)}
      />

      {/* Main Workspace (Editor + Terminal Split) */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        {/* Left Side: VS Code Monaco Editor */}
        <div className="h-full min-h-[350px] overflow-hidden border-b lg:border-b-0 lg:border-r border-gray-800/80">
          <CodeEditor
            code={code}
            onChange={setCode}
            language={currentLanguage}
          />
        </div>

        {/* Right Side: Execution Terminal & Stdin */}
        <div className="h-full min-h-[250px] overflow-hidden">
          <Terminal
            result={executionResult}
            isRunning={isRunning}
            stdin={stdin}
            onStdinChange={setStdin}
            onFixWithAi={() => handleTriggerAiAction("fix-error")}
            onClear={() => setExecutionResult(null)}
          />
        </div>
      </main>

      {/* Settings Modal (Gemini API Key) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onApiKeySaved={(key) => setHasApiKey(Boolean(key))}
      />

      {/* AI Action Modal (Fix, Explain, Translate) */}
      <AiActionModal
        isOpen={aiModal.isOpen}
        onClose={() => setAiModal((prev) => ({ ...prev, isOpen: false }))}
        actionType={aiModal.actionType}
        isLoading={aiModal.isLoading}
        data={aiModal.data}
        currentLanguage={currentLanguage}
        onApplyCode={(newCode, newLang) => {
          setCode(newCode);
          if (newLang) {
            setCurrentLanguage(newLang);
          }
        }}
        onTranslateRequest={(targetLang) =>
          handleTriggerAiAction("translate", targetLang)
        }
      />
    </div>
  );
}
