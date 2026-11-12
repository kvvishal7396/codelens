"use client";

import React, { useState, useEffect } from "react";
import { Key, ExternalLink, Check, Trash2, X, ShieldAlert } from "lucide-react";
import { getStoredApiKey, setStoredApiKey } from "@/lib/storage";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApiKeySaved?: (key: string) => void;
}

export function SettingsModal({ isOpen, onClose, onApiKeySaved }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiKey(getStoredApiKey());
      setIsSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    setStoredApiKey(apiKey);
    setIsSaved(true);
    if (onApiKeySaved) onApiKeySaved(apiKey);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleRemove = () => {
    setStoredApiKey("");
    setApiKey("");
    if (onApiKeySaved) onApiKeySaved("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-[#13161c] border border-gray-800 shadow-2xl overflow-hidden text-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/80 bg-[#161a22]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">AI Vision Settings</h2>
              <p className="text-xs text-gray-400">Google Gemini API Configuration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/20 text-xs text-blue-200/90 leading-relaxed">
            <span className="font-semibold text-blue-400">100% Free for Students:</span> Google AI Studio grants <strong>1,500 free requests/day</strong> for every free key (no credit card needed).
            <div className="mt-2">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-semibold text-indigo-400 hover:text-indigo-300 underline"
              >
                Get Free Gemini API Key <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <p className="mt-2 text-[11px] text-blue-300/80">
              💡 <strong>Pro Tip:</strong> You can paste multiple free keys separated by commas (e.g., <code>key1, key2</code>) to pool 3,000+ free requests every day!
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-300">
              Gemini API Key(s) <span className="text-gray-500 font-normal">(separate multiple keys with commas)</span>
            </label>
            <textarea
              rows={2}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy... (or key1, key2)"
              className="w-full px-3.5 py-2 rounded-lg bg-[#0d1017] border border-gray-700/80 text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-1">
              <ShieldAlert className="w-3.5 h-3.5 text-gray-400" />
              Saved only in your browser&apos;s local storage. Never logged or shared.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800 bg-[#161a22]">
          {apiKey ? (
            <button
              onClick={handleRemove}
              className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-medium transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove Key
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition shadow-md shadow-indigo-600/20"
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" /> Saved!
                </>
              ) : (
                "Save Key"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
