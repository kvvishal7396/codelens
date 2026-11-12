import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

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

    // Determine API Key: from user input (client localStorage) or environment variable
    const apiKey =
      userApiKey?.trim() ||
      req.headers.get("x-gemini-key")?.trim() ||
      process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "MISSING_API_KEY",
          message:
            "A Gemini API Key is required to extract code from custom screenshots. Click Settings to enter your free key from Google AI Studio.",
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

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are CodeLens, an expert programming OCR and syntax reconstruction AI.
Analyze the provided image which contains source code (a screenshot from an IDE, terminal, website, slide, or book).

Your tasks:
1. Extract the exact code visible in the image.
2. Fix standard OCR errors:
   - Preserve precise indentation (spaces/tabs are critical for languages like Python, YAML, etc.).
   - Distinguish correctly between quotes (use standard " or ' instead of curly/smart quotes).
   - Ensure closing braces, brackets, and semicolons are preserved.
   - Ignore line numbers, UI window borders, or watermarks.
3. Identify the programming language accurately (e.g., "python", "cpp", "javascript", "typescript", "java", "go", "rust", "c", "ruby", "php", "swift", "kotlin").
4. Provide a short 3-6 word title for what the code does.

Return ONLY a valid JSON object matching this schema without any markdown formatting or ticks:
{
  "code": "string with escaped newlines",
  "language": "one of: python | cpp | c | javascript | typescript | java | go | rust | ruby | php | swift | kotlin",
  "title": "short descriptive title",
  "notes": "brief 1-sentence note about what was extracted or corrected"
}`;

    // Call Gemini 2.5 Flash / 1.5 Flash
    // We try gemini-2.5-flash first, and fallback to gemini-1.5-flash if needed
    let responseText = "";
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            inlineData: {
              mimeType: detectedMime,
              data: base64Data,
            },
          },
          systemPrompt,
        ],
      });
      responseText = response.text || "";
    } catch {
      // Fallback model
      const fallbackResponse = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [
          {
            inlineData: {
              mimeType: detectedMime,
              data: base64Data,
            },
          },
          systemPrompt,
        ],
      });
      responseText = fallbackResponse.text || "";
    }

    if (!responseText) {
      return NextResponse.json(
        { error: "No text or code could be detected in the provided image." },
        { status: 422 }
      );
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
      return NextResponse.json({
        code: parsed.code || "",
        language: (parsed.language || "python").toLowerCase().trim(),
        title: parsed.title || "Extracted Code",
        notes: parsed.notes || "Code successfully extracted and formatted.",
      });
    } catch {
      // If JSON parsing fails, return raw text as code
      return NextResponse.json({
        code: responseText,
        language: "python",
        title: "Extracted Code",
        notes: "Extracted as raw code.",
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
