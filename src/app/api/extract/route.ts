import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
            "A free Gemini API Key is required. Click Settings to enter your free key from Google AI Studio (1,500 free requests/day).",
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
Analyze the provided image which contains source code (this might be a screenshot, or a camera photo of a monitor/laptop screen).

CRITICAL EXTRACTION RULES:
1. FOCUS ONLY ON THE CODE:
   - Completely ignore browser tabs, URLs, window titlebars, photographer watermarks, camera ISO stamps, or screen glare.
   - Strip out any line numbers at the start of lines (e.g. "1 chmod 777" -> "chmod 777").
2. ACCURACY:
   - Output exact executable code.
   - Preserve exact spaces, tabs, indentation, braces, and quotes.
3. DETECT LANGUAGE:
   - Identify: "bash", "python", "cpp", "c", "javascript", "typescript", "java", "go", "rust", "ruby", "php", "swift", "kotlin".

Return ONLY a valid JSON object matching this schema without any markdown ticks:
{
  "code": "the exact extracted clean code without line numbers or non-code noise",
  "language": "one of: bash | python | cpp | c | javascript | typescript | java | go | rust | ruby | php | swift | kotlin",
  "title": "short descriptive title"
}`;

    // Query active models for this key
    let modelsToTry = ["gemini-3.8-flash", "gemini-3.8-pro", "gemini-3-flash", "gemini-2.5-pro"];
    try {
      const modelListRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );
      if (modelListRes.ok) {
        const data = await modelListRes.json();
        if (data.models && Array.isArray(data.models)) {
          const valid = data.models
            .filter((m: any) => m.supportedGenerationMethods?.includes("generateContent"))
            .map((m: any) => m.name.replace(/^models\//, ""))
            .filter((name: string) => name.includes("gemini"));
          if (valid.length > 0) {
            // Prioritize 3.8 and flash
            modelsToTry = valid.sort((a: string, b: string) => {
              const aScore = (a.includes("3.8") ? 10 : 0) + (a.includes("flash") ? 5 : 0);
              const bScore = (b.includes("3.8") ? 10 : 0) + (b.includes("flash") ? 5 : 0);
              return bScore - aScore;
            });
          }
        }
      }
    } catch {
      // Use default priority list
    }

    console.log("CodeLens Vision: Attempting models:", modelsToTry.slice(0, 4));

    let responseText = "";
    let lastError: Error | null = null;

    // Try available models with retries for 503 high-demand spikes
    for (const modelName of modelsToTry.slice(0, 4)) {
      for (let attempt = 1; attempt <= 3; attempt++) {
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
          if (responseText) {
            console.log(`CodeLens Vision: Succeeded with model ${modelName} on attempt ${attempt}`);
            break;
          }
        } catch (err: unknown) {
          lastError = err instanceof Error ? err : new Error(String(err));
          const isBusy =
            lastError.message.includes("503") ||
            lastError.message.includes("high demand") ||
            lastError.message.includes("429");

          if (isBusy && attempt < 3) {
            console.log(`Model ${modelName} returned 503 (high demand). Retrying in 1.5s (attempt ${attempt}/3)...`);
            await sleep(1500);
            continue;
          }
          console.warn(`Model ${modelName} failed (attempt ${attempt}):`, lastError.message);
          break; // move to next model
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
              "Google Gemini servers are temporarily busy (503). Please click Retry in 2-3 seconds.",
          },
          { status: 503 }
        );
      }
      throw lastError || new Error("Failed to extract code using Gemini Vision.");
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
      });
    } catch {
      return NextResponse.json({
        code: responseText,
        language: "python",
        title: "Extracted Code",
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
