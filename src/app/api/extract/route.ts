import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Fallback priority list if dynamic model fetch fails
const DEFAULT_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.8-flash-lite",
  "gemini-3-flash",
  "gemini-3.8-pro",
];

async function getAvailableModels(apiKey: string): Promise<string[]> {
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
      .filter((name: string) => name.includes("gemini"));

    // Prioritize 3.8 and flash models
    const sorted = available.sort((a: string, b: string) => {
      const aScore = (a.includes("3.8") ? 10 : 0) + (a.includes("flash") ? 5 : 0);
      const bScore = (b.includes("3.8") ? 10 : 0) + (b.includes("flash") ? 5 : 0);
      return bScore - aScore;
    });

    return sorted.length > 0 ? sorted : DEFAULT_MODELS;
  } catch {
    return DEFAULT_MODELS;
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, mimeType = "image/png", apiKey: userApiKey } = body;

    if (!image) {
      return NextResponse.json(
        { error: "No image provided. Please paste or upload an image." },
        { status: 400 }
      );
    }

    const apiKey =
      userApiKey?.trim() ||
      req.headers.get("x-gemini-key")?.trim() ||
      process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "MISSING_API_KEY",
          message:
            "A Gemini API Key is required to extract code from screenshots. Click Settings to enter your free key from Google AI Studio.",
        },
        { status: 401 }
      );
    }

    // Extract base64 payload if data URL is provided
    let base64Data = image;
    let detectedMime = mimeType;
    if (image.includes(";base64,")) {
      const parts = image.split(";base64,");
      const mimeMatch = parts[0].match(/data:(.*?)$/);
      if (mimeMatch) {
        detectedMime = mimeMatch[1];
      }
      base64Data = parts[1];
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const systemPrompt = `You are CodeLens, an elite computer vision programming OCR and code reconstruction engine.
Analyze the provided image which contains source code (this might be a direct screenshot, or a photo taken of a laptop/monitor screen from a phone camera).

CRITICAL EXTRACTION RULES:
1. Strip out line numbers at the start of lines! (Example: if the screen shows "1 chmod 777" or "  1  def foo():", extract "chmod 777" or "def foo():" WITHOUT the line number).
2. Clean up OCR glitches:
   - Handle phone photo artifacts: glare, moiré pattern, reflections, perspective skew, browser tabs, or window headers. Focus only on the code editor/terminal area.
   - Preserve exact indentations (spaces/tabs). This is critical for Python, YAML, etc.
   - Preserve standard quotes (" or ') instead of slanted/curly quotes.
   - Preserve all brackets, braces, colons, and semicolons.
3. Detect the programming language accurately:
   - "python", "cpp", "c", "bash", "javascript", "typescript", "java", "go", "rust", "ruby", "php", "swift", "kotlin".
4. Provide a concise 3-5 word title for what the code accomplishes.

Return ONLY a valid JSON object matching this schema without any markdown backticks:
{
  "code": "the exact extracted clean code without line numbers",
  "language": "one of: python | cpp | c | bash | javascript | typescript | java | go | rust | ruby | php | swift | kotlin",
  "title": "short descriptive title",
  "notes": "brief summary of what was extracted"
}`;

    // Get live available models for this specific API key
    const modelsToTry = await getAvailableModels(apiKey);
    let responseText = "";
    let lastError: Error | null = null;

    // Loop through available models
    for (const modelName of modelsToTry.slice(0, 4)) {
      // Allow up to 2 attempts per model for temporary 503 high-demand errors
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent([
            systemPrompt,
            {
              inlineData: {
                mimeType: detectedMime,
                data: base64Data,
              },
            },
          ]);
          const res = await result.response;
          responseText = res.text();
          if (responseText) break;
        } catch (err: unknown) {
          lastError = err instanceof Error ? err : new Error(String(err));
          const isOverloaded = lastError.message.includes("503") || lastError.message.includes("high demand") || lastError.message.includes("429");
          if (isOverloaded && attempt === 0) {
            // Wait 1.2s before retry
            await sleep(1200);
            continue;
          }
          break; // Try next model in list
        }
      }
      if (responseText) break;
    }

    if (!responseText) {
      const errMsg = lastError?.message || "Failed to extract code.";
      if (errMsg.includes("503") || errMsg.includes("high demand")) {
        return NextResponse.json(
          {
            error:
              "Google Gemini servers are temporarily experiencing high demand (503). Please click Retry or try again in a few moments.",
          },
          { status: 503 }
        );
      }
      throw lastError || new Error("Failed to extract code using available Gemini models.");
    }

    // Clean JSON response (strip markdown fences if present)
    let cleaned = responseText.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    try {
      const parsed = JSON.parse(cleaned);
      let extractedCode = parsed.code || "";

      // Post-processing flaw fix: strip leading line numbers if any survived
      const lines = extractedCode.split("\n");
      const hasSystematicLineNumbers =
        lines.length > 2 &&
        lines.filter((l: string) => /^\s*\d{1,4}\s+/.test(l)).length / lines.length > 0.6;
      if (hasSystematicLineNumbers) {
        extractedCode = lines
          .map((l: string) => l.replace(/^\s*\d{1,4}\s+/, ""))
          .join("\n");
      }

      return NextResponse.json({
        code: extractedCode,
        language: (parsed.language || "python").toLowerCase().trim(),
        title: parsed.title || "Extracted Code",
        notes: parsed.notes || "Code successfully extracted and cleaned.",
      });
    } catch {
      return NextResponse.json({
        code: responseText,
        language: "python",
        title: "Extracted Code",
        notes: "Raw extracted code.",
      });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Code extraction failed: ${msg}` },
      { status: 500 }
    );
  }
}
