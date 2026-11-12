const API_KEY_STORAGE_KEY = "codelens_gemini_api_key";
const RECENT_SNIPPETS_KEY = "codelens_recent_snippets";

export interface StoredSnippet {
  id: string;
  title: string;
  language: string;
  code: string;
  timestamp: number;
}

export function getStoredApiKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(API_KEY_STORAGE_KEY) || "";
}

export function setStoredApiKey(key: string): void {
  if (typeof window === "undefined") return;
  if (!key.trim()) {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  } else {
    localStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
  }
}

export function getRecentSnippets(): StoredSnippet[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_SNIPPETS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRecentSnippet(snippet: Omit<StoredSnippet, "id" | "timestamp">): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getRecentSnippets();
    const newSnippet: StoredSnippet = {
      ...snippet,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
    };
    // Keep only last 10
    const updated = [newSnippet, ...existing.filter((s) => s.code !== snippet.code)].slice(0, 10);
    localStorage.setItem(RECENT_SNIPPETS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota errors
  }
}
