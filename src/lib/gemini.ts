import { GoogleGenAI } from "@google/genai";

const DEFAULT_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.8-flash-lite",
  "gemini-3-flash",
  "gemini-flash-latest",
  "gemini-2.5-flash",
  "gemini-1.5-flash",
];

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getAvailableGeminiModels(apiKey: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      { cache: "no-store" }
    );
    if (!res.ok) return DEFAULT_MODELS;
    const data = await res.json();
    if (!data.models || !Array.isArray(data.models)) return DEFAULT_MODELS;

    const available = data.models
      .filter((m: any) =>
        m.supportedGenerationMethods?.includes("generateContent")
      )
      .map((m: any) => m.name.replace(/^models\//, ""))
      .filter(
        (name: string) =>
          name.includes("gemini") &&
          !name.includes("tts") &&
          !name.includes("audio") &&
          !name.includes("embed") &&
          !name.includes("imagen") &&
          !name.includes("realtime") &&
          !name.includes("robotics")
      );

    const sorted = available.sort((a: string, b: string) => {
      const aScore =
        (a.includes("3.8") ? 100 : 0) +
        (a.includes("flash") ? 40 : 0) +
        (a.includes("2.5") ? 30 : 0) +
        (a.includes("2.0") ? 25 : 0) +
        (a.includes("latest") ? 20 : 0) +
        (a.includes("1.5") ? 15 : 0) -
        (a.includes("preview") ? 60 : 0) -
        (a.includes("pro") ? 20 : 0);
      const bScore =
        (b.includes("3.8") ? 100 : 0) +
        (b.includes("flash") ? 40 : 0) +
        (b.includes("2.5") ? 30 : 0) +
        (b.includes("2.0") ? 25 : 0) +
        (b.includes("latest") ? 20 : 0) +
        (b.includes("1.5") ? 15 : 0) -
        (b.includes("preview") ? 60 : 0) -
        (b.includes("pro") ? 20 : 0);
      return bScore - aScore;
    });

    return sorted.length > 0 ? sorted : DEFAULT_MODELS;
  } catch {
    return DEFAULT_MODELS;
  }
}

export async function callGeminiWithRetry(
  apiKey: string,
  contentPayload: any[]
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey, apiVersion: "v1beta" });
  const modelsToTry = await getAvailableGeminiModels(apiKey);

  let responseText = "";
  let lastError: Error | null = null;

  for (const modelName of modelsToTry.slice(0, 4)) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        // 45-second timeout with Promise.race
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout after 45s on ${modelName}`)), 45000)
        );

        // Attempt 1: Fast inference with thinkingBudget: 0 to disable reasoning delay
        const generatePromise = (async () => {
          try {
            const res = await ai.models.generateContent({
              model: modelName,
              contents: contentPayload,
              config: {
                temperature: 0.1,
                maxOutputTokens: 2048,
                thinkingConfig: {
                  thinkingBudget: 0,
                },
              },
            });
            return res.text || "";
          } catch (innerErr: any) {
            const innerMsg = innerErr?.message || "";
            // If model does not support thinkingConfig, immediately fallback without it
            if (innerMsg.includes("thinkingConfig") || innerMsg.includes("INVALID_ARGUMENT")) {
              const fallbackRes = await ai.models.generateContent({
                model: modelName,
                contents: contentPayload,
                config: {
                  temperature: 0.1,
                  maxOutputTokens: 2048,
                },
              });
              return fallbackRes.text || "";
            }
            throw innerErr;
          }
        })();

        responseText = await Promise.race([generatePromise, timeoutPromise]);
        if (responseText) return responseText;
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const errMsg = lastError.message;
        const isBusy =
          errMsg.includes("503") ||
          errMsg.includes("high demand") ||
          errMsg.includes("429") ||
          errMsg.includes("fetch failed");

        console.warn(`[Gemini] ${modelName} attempt ${attempt} warning: ${errMsg}`);

        if (isBusy && attempt < 2) {
          await sleep(1200);
          continue;
        }
        break; // try next model immediately
      }
    }
  }

  if (!responseText) {
    throw lastError || new Error("Failed to generate response from Gemini AI. Please try again.");
  }

  return responseText;
}

export function cleanJsonResponse(rawText: string): any {
  let cleaned = rawText.trim();

  // Try direct parse
  try {
    return JSON.parse(cleaned);
  } catch {}

  // Strip markdown code fences if wrapped in ```json ... ``` or ``` ... ```
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch && fenceMatch[1]) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {}
  }

  // Find outermost JSON object { ... }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const jsonSub = cleaned.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(jsonSub);
    } catch {}
  }

  throw new Error("Could not parse JSON response from AI");
}
