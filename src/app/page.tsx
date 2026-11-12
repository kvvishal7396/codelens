"use client";

import React, { useState, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import { Header } from "@/components/Header";
import { Dropzone } from "@/components/Dropzone";
import { CodeEditor } from "@/components/CodeEditor";
import { Terminal } from "@/components/Terminal";
import { SettingsModal } from "@/components/SettingsModal";
import { AiActionModal } from "@/components/AiActionModal";
import { ToastContainer, ToastMessage } from "@/components/Toast";
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
import { performFreeBrowserOcr } from "@/lib/ocr";

export default function Home() {
  const [currentLanguage, setCurrentLanguage] = useState<LanguageConfig>(DEFAULT_LANGUAGE);
  const [code, setCode] = useState<string>(DEFAULT_LANGUAGE.sampleCode);
  const [stdin, setStdin] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Engine: "universal" (100% Free, 0 tokens, No API Key) vs "gemini" (AI Vision)
  const [ocrEngine, setOcrEngine] = useState<"universal" | "gemini">("universal");

  // Extraction & Execution States
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractStatus, setExtractStatus] = useState<"idle" | "scanning" | "success" | "error">("idle");
  const [lastExtractedTitle, setLastExtractedTitle] = useState<string>("");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);

  // Settings & Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);

  // Toast System
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (title: string, message?: string, type: ToastMessage["type"] = "info") => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, title, message, type }]);
    },
    []
  );

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

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
        addToast("Execution Complete", `Ran in ${data.timeMs}ms with exit code 0`, "success");
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.8 },
          colors: ["#10b981", "#6366f1", "#3b82f6"],
        });
      } else {
        addToast("Execution Error", data.stderr || "Program exited with error", "error");
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
      addToast("Network Error", msg, "error");
    } finally {
      setIsRunning(false);
    }
  }, [isRunning, currentLanguage, code, stdin, addToast]);

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
    const isOldSample = SUPPORTED_LANGUAGES.some(
      (l) => l.sampleCode.trim() === code.trim()
    );
    if (isOldSample) {
      setCode(newLang.sampleCode);
    }
    addToast("Language Selected", `Switched to ${newLang.name}`, "info");
  };

  // Image Selected (via paste or upload)
  const handleImageSelected = async (base64Image: string, mimeType: string) => {
    setSelectedImage(base64Image);
    setIsExtracting(true);
    setExtractStatus("scanning");

    // MODE 1: Universal Free Browser OCR (100% Free, Zero Tokens, Unlimited for all)
    if (ocrEngine === "universal") {
      addToast("Universal Free OCR", "Extracting code in your browser (0 Tokens Used)...", "info");
      try {
        const result = await performFreeBrowserOcr(base64Image);

        if (result.code.trim()) {
          setCode(result.code);
          setExtractStatus("success");
          setLastExtractedTitle(result.title);
          setCurrentLanguage(result.language);

          saveRecentSnippet({
            title: result.title,
            language: result.language.id,
            code: result.code,
          });

          addToast(
            "Code Extracted Successfully!",
            `Detected ${result.language.name} • 100% Free (0 Tokens)`,
            "success"
          );

          confetti({
            particleCount: 50,
            spread: 70,
            origin: { y: 0.2 },
            colors: ["#10b981", "#6366f1", "#06b6d4"],
          });
        } else {
          setExtractStatus("error");
          addToast("Empty Code", "No readable code detected in image.", "warning");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "OCR failed";
        setExtractStatus("error");
        addToast("OCR Error", msg, "error");
      } finally {
        setIsExtracting(false);
      }
      return;
    }

    // MODE 2: Gemini AI Studio Mode (Free Tier with key)
    const key = getStoredApiKey();
    if (!key) {
      setIsSettingsOpen(true);
      setExtractStatus("error");
      setIsExtracting(false);
      addToast(
        "Gemini API Key Needed",
        "Switch to Universal Free OCR or enter your free Gemini key in Settings.",
        "warning"
      );
      return;
    }

    addToast("Scanning Screenshot", "Gemini 3.8 Flash is analyzing code in image...", "info");

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
        setExtractStatus("error");
        if (data.error === "MISSING_API_KEY") {
          setIsSettingsOpen(true);
          addToast("API Key Missing", data.message, "warning");
        } else {
          addToast("Extraction Notice", data.error || "Could not read code. Click Retry.", "warning");
        }
        return;
      }

      if (data.code) {
        setCode(data.code);
        setExtractStatus("success");
        setLastExtractedTitle(data.title || "Extracted Snippet");

        if (data.language) {
          const matchedLang = findLanguageById(data.language);
          setCurrentLanguage(matchedLang);
        }

        saveRecentSnippet({
          title: data.title || "Extracted Snippet",
          language: data.language || currentLanguage.id,
          code: data.code,
        });

        addToast(
          "Code Extracted Successfully!",
          `Detected ${(data.language || "code").toUpperCase()} • Indentations preserved`,
          "success"
        );

        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.2 },
          colors: ["#a855f7", "#6366f1", "#10b981"],
        });
      } else {
        setExtractStatus("error");
        addToast("Empty Code", "No code was detected in this image.", "warning");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error extracting code";
      setExtractStatus("error");
      addToast("Extraction Error", msg, "error");
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
    setExtractStatus("idle");
    setLastExtractedTitle("");
    addToast("Preset Loaded", sample.title, "info");
  };

  // Trigger AI Action (Explain, Fix, Translate)
  const handleTriggerAiAction = async (
    action: "fix-error" | "explain" | "translate",
    targetLang?: string
  ) => {
    const key = getStoredApiKey();
    if (!key) {
      setIsSettingsOpen(true);
      addToast("API Key Needed", "Please configure your Gemini key in Settings for AI Magic.", "warning");
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
        addToast("AI Action Failed", data.error || "Could not complete action", "error");
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
      addToast("AI Action Error", msg, "error");
      setAiModal((prev) => ({ ...prev, isOpen: false }));
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#07090e] text-gray-100 overflow-hidden font-sans antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

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
        extractStatus={extractStatus}
        selectedImage={selectedImage}
        onClearImage={() => {
          setSelectedImage(null);
          setExtractStatus("idle");
          setLastExtractedTitle("");
        }}
        onRetryExtraction={() => {
          if (selectedImage) {
            handleImageSelected(selectedImage, "image/png");
          }
        }}
        lastExtractedTitle={lastExtractedTitle}
        ocrEngine={ocrEngine}
        onToggleEngine={(eng) => {
          setOcrEngine(eng);
          addToast(
            eng === "universal" ? "Universal Free OCR Active" : "Gemini AI Mode Active",
            eng === "universal"
              ? "0 Tokens used • Unlimited client-side extraction"
              : "Uses Google Gemini Vision AI",
            "info"
          );
        }}
      />

      {/* Main Workspace (Editor + Terminal Split) */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        {/* Left Side: VS Code Monaco Editor */}
        <div className="h-full min-h-[350px] overflow-hidden border-b lg:border-b-0 lg:border-r border-white/[0.08]">
          <CodeEditor
            code={code}
            onChange={setCode}
            language={currentLanguage}
            onNotify={(title, msg, type) => addToast(title, msg, type)}
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
            onClear={() => {
              setExecutionResult(null);
              addToast("Terminal Cleared", undefined, "info");
            }}
          />
        </div>
      </main>

      {/* Settings Modal (Gemini API Key) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onApiKeySaved={(key) => {
          setHasApiKey(Boolean(key));
          if (key) {
            addToast("API Key Saved", "Gemini AI Vision is ready!", "success");
          }
        }}
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
          addToast("Code Updated", "Applied changes to editor", "success");
        }}
        onTranslateRequest={(targetLang) =>
          handleTriggerAiAction("translate", targetLang)
        }
      />
    </div>
  );
}
