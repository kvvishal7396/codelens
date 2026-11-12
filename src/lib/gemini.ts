import { GoogleGenAI } from "@google/genai";

const DEFAULT_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
  "gemini-flash-latest",
];

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function parseApiKeys(apiKeyInput?: string): string[] {
  const envKeys = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.split(/[\s,;]+/) : [];
  const userKeys = apiKeyInput ? apiKeyInput.split(/[\s,;]+/) : [];
  const combined = [...userKeys, ...envKeys]
    .map((k) => k.trim())
    .filter((k) => k.length > 10);
  // Deduplicate keys
  return Array.from(new Set(combined));
}

export function formatGeminiErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("free_tier_requests")
  ) {
    return "Daily free Gemini quota limit reached. You can add another free API key in Settings (each key provides 1,500 requests/day), or switch to free offline OCR!";
  }
  if (msg.includes("503") || msg.includes("high demand") || msg.includes("UNAVAILABLE")) {
    return "Google AI servers are currently experiencing a brief traffic spike. Please click Retry in a few seconds.";
  }
  if (msg.includes("API key not valid") || msg.includes("INVALID_ARGUMENT")) {
    return "The provided Gemini API key is invalid. Please verify your free key in Settings.";
  }
  return msg;
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

    // Filter strictly for production vision-compatible models
    // Exclude preview, experimental, tts, audio, and image-only test checkpoints (which have limit: 0)
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
          !name.includes("image") && // excludes preview-image models with limit: 0
          !name.includes("preview") && // excludes unstable preview models with limit: 0
          !name.includes("realtime") &&
          !name.includes("robotics")
      );

    // Prioritize high-quota flash models and stable 2.5/2.0/1.5 models
    const sorted = available.sort((a: string, b: string) => {
      const getScore = (name: string) => {
        let score = 0;
        if (name.includes("2.5-flash")) score += 70;
        if (name.includes("2.0-flash")) score += 60;
        if (name.includes("1.5-flash")) score += 50;
        if (name.includes("lite")) score += 40;
        if (name.includes("flash")) score += 30;
        if (name.includes("latest")) score += 20;
        if (name.includes("pro")) score -= 30;
        return score;
      };
      return getScore(b) - getScore(a);
    });

    return sorted.length > 0 ? sorted : DEFAULT_MODELS;
  } catch {
    return DEFAULT_MODELS;
  }
}

export async function callGeminiWithRetry(
  apiKeyInput: string,
  contentPayload: any[]
): Promise<string> {
  const keys = parseApiKeys(apiKeyInput);
  if (keys.length === 0) {
    throw new Error("A free Gemini API Key is required. Click Settings to enter your key.");
  }

  let responseText = "";
  let lastError: Error | null = null;

  // Key-Pool Rotation: If key 1 exhausts quota, immediately rotate to key 2!
  for (const apiKey of keys) {
    const ai = new GoogleGenAI({ apiKey, apiVersion: "v1beta" });
    const modelsToTry = await getAvailableGeminiModels(apiKey);

    for (const modelName of modelsToTry) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout after 45s on ${modelName}`)), 45000)
          );

          const generatePromise = (async () => {
            try {
              // Pass thinkingBudget: 0 on models supporting it
              const config: any = {
                temperature: 0.1,
                maxOutputTokens: 2048,
              };
              if (modelName.includes("3.") || modelName.includes("2.5")) {
                config.thinkingConfig = { thinkingBudget: 0 };
              }

              const res = await ai.models.generateContent({
                model: modelName,
                contents: contentPayload,
                config,
              });
              return res.text || "";
            } catch (innerErr: any) {
              const innerMsg = innerErr?.message || "";
              // If thinkingConfig rejected, retry without it
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
          const isQuota = errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED");
          const isBusy = errMsg.includes("503") || errMsg.includes("high demand") || errMsg.includes("fetch failed");

          console.warn(`[Gemini] ${modelName} on key ${apiKey.slice(0, 6)}... failed: ${errMsg.slice(0, 80)}`);

          // If quota exceeded on this model, DO NOT retry same model; immediately try next model!
          if (isQuota) {
            break;
          }

          if (isBusy && attempt < 2) {
            await sleep(1000);
            continue;
          }
          break; // try next model
        }
      }
    }
  }

  if (!responseText) {
    const formatted = formatGeminiErrorMessage(lastError);
    throw new Error(formatted);
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
