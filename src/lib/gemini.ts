import { GoogleGenerativeAI } from "@google/generative-ai";

const DEFAULT_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.8-flash-lite",
  "gemini-3-flash",
  "gemini-2.5-flash",
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
          !name.includes("embed")
      );

    const sorted = available.sort((a: string, b: string) => {
      const aScore =
        (a.includes("3.8") ? 10 : 0) +
        (a.includes("flash") ? 5 : 0) -
        (a.includes("pro") ? 2 : 0);
      const bScore =
        (b.includes("3.8") ? 10 : 0) +
        (b.includes("flash") ? 5 : 0) -
        (b.includes("pro") ? 2 : 0);
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
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelsToTry = await getAvailableGeminiModels(apiKey);

  let responseText = "";
  let lastError: Error | null = null;

  for (const modelName of modelsToTry.slice(0, 3)) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048,
            // Disable thinking delay to ensure sub-5s response time
            // @ts-ignore
            thinkingConfig: { thinkingBudget: 0 },
          },
        });

        // 12-second timeout per attempt to guarantee fast response
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Gemini timeout after 12s")), 12000)
        );

        const generatePromise = model
          .generateContent(contentPayload)
          .then((result) => result.response)
          .then((res) => res.text());

        responseText = await Promise.race([generatePromise, timeoutPromise]);
        if (responseText) return responseText;
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const isBusy =
          lastError.message.includes("503") ||
          lastError.message.includes("high demand") ||
          lastError.message.includes("timeout") ||
          lastError.message.includes("429");

        if (isBusy && attempt < 2) {
          console.log(`[Gemini] ${modelName} spike. Quick retry in 1s (${attempt}/2)...`);
          await sleep(1000);
          continue;
        }
        break; // try next model immediately
      }
    }
  }

  if (!responseText) {
    throw lastError || new Error("Failed to generate response from Gemini AI.");
  }

  return responseText;
}

export function cleanJsonResponse(rawText: string): any {
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  return JSON.parse(cleaned);
}
