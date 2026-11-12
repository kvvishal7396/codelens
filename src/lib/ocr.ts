import { createWorker } from "tesseract.js";
import { findLanguageById } from "./languages";
import { LanguageConfig } from "@/types";

export interface OcrResult {
  code: string;
  language: LanguageConfig;
  title: string;
  confidence: number;
}

// Detect language using syntax and keyword heuristics
export function detectLanguageFromCode(text: string): LanguageConfig {
  const lower = text.toLowerCase();

  // Scoring matrix
  const scores: Record<string, number> = {
    bash: 0,
    python: 0,
    cpp: 0,
    c: 0,
    javascript: 0,
    typescript: 0,
    java: 0,
    go: 0,
    rust: 0,
    php: 0,
    ruby: 0,
  };

  // Bash indicators
  if (/\b(chmod|chown|mkdir|touch|grep|sudo|echo|cat|cd|ls|rm|curl|export)\b/.test(lower)) scores.bash += 4;
  if (/#!/i.test(text) || /\b(fi|done|esac)\b/.test(lower)) scores.bash += 5;

  // Python indicators
  if (/\b(def|elif|import|from|print\(|None|True|False|self|in range)\b/.test(text)) scores.python += 4;
  if (/:(\s*)$/m.test(text)) scores.python += 2;

  // C++ indicators
  if (/#include\s*<iostream>|std::|cout|cin|vector<|nullptr/.test(text)) scores.cpp += 6;
  if (/#include\s*</.test(text)) scores.cpp += 3;

  // C indicators
  if (/#include\s*<stdio\.h>|printf\(|scanf\(/.test(text)) scores.c += 5;

  // JS/TS indicators
  if (/\b(const|let|var|console\.log|function|=>)\b/.test(text)) scores.javascript += 3;
  if (/\b(interface|type|enum|as string|as number)\b/.test(text)) scores.typescript += 4;

  // Java indicators
  if (/\b(public class|public static void main|System\.out\.print)/.test(text)) scores.java += 6;

  // Go indicators
  if (/\b(package main|func main|fmt\.Print)/.test(text)) scores.go += 6;

  // Rust indicators
  if (/\b(fn main|let mut|println!|Vec<|impl)\b/.test(text)) scores.rust += 6;

  // Find highest score
  let bestLang = "python";
  let maxScore = 0;
  for (const [lang, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestLang = lang;
    }
  }

  return findLanguageById(bestLang);
}

// Clean raw OCR output, remove line numbers, normalize quotes and whitespace
export function cleanCodeOcr(rawText: string): string {
  let lines = rawText.split("\n");

  // 1. Remove obvious noise lines (e.g. browser URLs, window headers, photographer stamps)
  lines = lines.filter((line) => {
    const l = line.trim();
    if (!l) return true; // keep blank lines for structure
    if (/^(http|https):\/\//i.test(l)) return false;
    if (/\b(YouTube|Photographer|ISO\d+|f\/\d+\.\d+|Newton Scho|All Bookmarks)\b/i.test(l)) return false;
    if (/^[^\w\s]{4,}$/.test(l)) return false; // purely random symbols
    return true;
  });

  // 2. Normalize smart/curly quotes to standard programming quotes
  lines = lines.map((line) =>
    line
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/[—–]/g, "-")
  );

  // 3. Strip editor line numbers at start of lines (e.g. "1 chmod", "  2  cd workspace")
  const numberedLinesCount = lines.filter((l) => /^\s*\d{1,4}\s+/.test(l)).length;
  if (numberedLinesCount >= Math.min(3, lines.length * 0.3)) {
    lines = lines.map((l) => l.replace(/^\s*\d{1,4}\s+/, ""));
  }

  // 4. Remove leading/trailing empty lines
  while (lines.length > 0 && lines[0].trim() === "") lines.shift();
  while (lines.length > 0 && lines[lines.length - 1].trim() === "") lines.pop();

  return lines.join("\n");
}

// Universal Client-Side OCR Execution
export async function performFreeBrowserOcr(
  imageSrc: string,
  onProgress?: (progress: number) => void
): Promise<OcrResult> {
  const worker = await createWorker("eng");

  if (onProgress) {
    onProgress(30);
  }

  const ret = await worker.recognize(imageSrc);
  await worker.terminate();

  const cleanedCode = cleanCodeOcr(ret.data.text || "");
  const detectedLang = detectLanguageFromCode(cleanedCode);

  let title = "Extracted Code";
  if (detectedLang.id === "bash") title = "Shell Script";
  else if (detectedLang.id === "python") title = "Python Script";
  else if (detectedLang.id === "cpp") title = "C++ Program";
  else if (detectedLang.id === "javascript") title = "JavaScript Code";

  return {
    code: cleanedCode,
    language: detectedLang,
    title,
    confidence: ret.data.confidence,
  };
}
