import { NextRequest, NextResponse } from "next/server";
import { callGeminiWithRetry, cleanJsonResponse, formatGeminiErrorMessage } from "@/lib/gemini";

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

    const contentPayload = [
      systemPrompt,
      {
        inlineData: {
          mimeType: detectedMime,
          data: base64Data,
        },
      },
    ];

    const responseText = await callGeminiWithRetry(apiKey, contentPayload);

    try {
      const parsed = cleanJsonResponse(responseText);
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
    const friendlyMsg = formatGeminiErrorMessage(err);
    return NextResponse.json(
      { error: friendlyMsg },
      { status: 500 }
    );
  }
}
