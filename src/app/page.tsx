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

export default function Home() {
  const [currentLanguage, setCurrentLanguage] = useState<LanguageConfig>(DEFAULT_LANGUAGE);
  const [code, setCode] = useState<string>(DEFAULT_LANGUAGE.sampleCode);
  const [stdin, setStdin] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Extraction & Execution States
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractStatus, setExtractStatus] = useState<"idle" | "scanning" | "success" | "error">("idle");
  const [lastExtractedTitle, setLastExtractedTitle] = useState<string>("");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);

  // Language Conversion State
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [convertingTargetLang, setConvertingTargetLang] = useState<string | null>(null);
  const [originalSnippet, setOriginalSnippet] = useState<{
    code: string;
    language: LanguageConfig;
  } | null>(null);

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
    const key = getStoredApiKey();

    if (!key) {
      setIsSettingsOpen(true);
      setExtractStatus("error");
      addToast(
        "Gemini API Key Needed",
        "Please paste your free Gemini API key in Settings (1,500 free requests/day).",
        "warning"
      );
      return;
    }

    const startTime = Date.now();
    setIsExtracting(true);
    setExtractStatus("scanning");
    addToast("Scanning Screenshot", "Gemini Vision is analyzing code in image...", "info");

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
          addToast("Server Notice", data.error || "Google AI is busy. Please click Retry.", "warning");
        }
        return;
      }

      if (data.code) {
        const matchedLang = data.language
          ? findLanguageById(data.language)
          : currentLanguage;

        setCode(data.code);
        setCurrentLanguage(matchedLang);
        setExtractStatus("success");
        setLastExtractedTitle(data.title || "Extracted Snippet");

        setOriginalSnippet({
          code: data.code,
          language: matchedLang,
        });

        saveRecentSnippet({
          title: data.title || "Extracted Snippet",
          language: matchedLang.id,
          code: data.code,
        });

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        addToast(
          "Code Extracted Successfully!",
          `Clean ${matchedLang.name.toUpperCase()} loaded into editor in ${elapsed}s • Indentations preserved`,
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
        addToast("Empty Code", "No code detected. Please ensure code is visible in image.", "warning");
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
    setOriginalSnippet({
      code: sample.code,
      language: matched,
    });
    addToast("Preset Loaded", sample.title, "info");
  };

  // 1-Click Language Interchange / Code Translation
  const handleDirectTranslate = async (targetLang: LanguageConfig) => {
    if (isConverting) return;
    if (!code.trim()) {
      addToast("No Code to Convert", "Please paste an image or enter code in the editor.", "warning");
      return;
    }
    if (targetLang.id === currentLanguage.id) {
      addToast("Already " + targetLang.name, `The current code is already ${targetLang.name}.`, "info");
      return;
    }

    const key = getStoredApiKey();
    if (!key) {
      setIsSettingsOpen(true);
      addToast(
        "API Key Required",
        "Please enter your free Gemini API key to convert code between languages.",
        "warning"
      );
      return;
    }

    // Save initial snippet as original if not already recorded
    if (!originalSnippet) {
      setOriginalSnippet({
        code,
        language: currentLanguage,
      });
    }

    const startTime = Date.now();
    setIsConverting(true);
    setConvertingTargetLang(targetLang.name);
    addToast(
      "Converting Code",
      `Translating from ${currentLanguage.name} to ${targetLang.name} using Gemini AI...`,
      "info"
    );

    try {
      const res = await fetch("/api/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "translate",
          code,
          language: currentLanguage.name,
          targetLanguage: targetLang.name,
          apiKey: key,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        addToast("Conversion Failed", data.error || "Could not translate code.", "error");
        return;
      }

      if (data.translatedCode) {
        setCode(data.translatedCode);
        setCurrentLanguage(targetLang);
        setExecutionResult(null);

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        addToast(
          `Converted to ${targetLang.name}!`,
          `Code converted in ${duration}s • Ready to Run (⌘↵)`,
          "success"
        );

        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.2 },
          colors: ["#a855f7", "#3b82f6", "#10b981"],
        });
      } else {
        addToast("Empty Translation", "AI did not return converted code.", "warning");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error translating code";
      addToast("Translation Error", msg, "error");
    } finally {
      setIsConverting(false);
      setConvertingTargetLang(null);
    }
  };

  // Revert back to original extracted snippet
  const handleRevertOriginal = () => {
    if (!originalSnippet) return;
    setCode(originalSnippet.code);
    setCurrentLanguage(originalSnippet.language);
    setExecutionResult(null);
    addToast(
      "Restored Original",
      `Switched back to original ${originalSnippet.language.name} code`,
      "info"
    );
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
        onDirectTranslate={handleDirectTranslate}
        isConverting={isConverting}
        convertingTargetLang={convertingTargetLang}
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
            onDirectTranslate={handleDirectTranslate}
            isConverting={isConverting}
            convertingTargetLang={convertingTargetLang}
            originalSnippet={originalSnippet}
            onRevertOriginal={handleRevertOriginal}
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
