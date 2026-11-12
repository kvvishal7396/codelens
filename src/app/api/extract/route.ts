import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const MODELS_TO_TRY = [
  "gemini-3.8-flash",
  "gemini-2.5-flash",
  "gemini-1.5-flash",
];

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

    let responseText = "";
    let lastError: Error | null = null;

    // Loop through model versions (starting with gemini-3.8-flash)
    for (const modelName of MODELS_TO_TRY) {
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
          break; // Successfully got content!
        }
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.warn(`Model ${modelName} failed, trying next:`, lastError.message);
      }
    }

    if (!responseText) {
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

      // Extra post-processing flaw fix: strip leading line numbers if any survived
      // Regex matches lines starting with number + optional space (e.g., "1  def foo" -> "def foo")
      const lines = extractedCode.split("\n");
      const hasSystematicLineNumbers = lines.length > 2 && lines.filter((l: string) => /^\s*\d{1,4}\s+/.test(l)).length / lines.length > 0.6;
      if (hasSystematicLineNumbers) {
        extractedCode = lines.map((l: string) => l.replace(/^\s*\d{1,4}\s+/, "")).join("\n");
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
