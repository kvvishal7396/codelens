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
    const {
      action, // "fix-error" | "explain" | "translate"
      code,
      language,
      targetLanguage,
      errorOutput,
      apiKey: userApiKey,
    } = body;

    const apiKey =
      userApiKey?.trim() ||
      req.headers.get("x-gemini-key")?.trim() ||
      process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "MISSING_API_KEY",
          message:
            "A Gemini API Key is required for AI actions. Click Settings to enter your free key.",
        },
        { status: 401 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: "Code content is required." },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    let prompt = "";

    if (action === "fix-error") {
      prompt = `You are an expert software engineer and debugger.
Here is source code written in ${language}:
\`\`\`${language}
${code}
\`\`\`

When executed, it produced the following runtime/compiler error:
\`\`\`
${errorOutput || "Unknown execution error"}
\`\`\`

Your task:
1. Identify the bug causing this error.
2. Fix the code.
3. Respond ONLY with a valid JSON object matching:
{
  "fixedCode": "the complete corrected code string",
  "explanation": "2-3 sentences explaining what caused the bug and how it was fixed"
}`;
    } else if (action === "translate") {
      prompt = `You are a multi-language programming translator.
Translate the following ${language} code into idiomatic, modern ${targetLanguage}:
\`\`\`${language}
${code}
\`\`\`

Respond ONLY with a valid JSON object matching:
{
  "translatedCode": "the full translated code in ${targetLanguage}",
  "explanation": "Brief note on language-specific differences or libraries used"
}`;
    } else if (action === "explain") {
      prompt = `You are a computer science educator.
Explain the following ${language} code in concise, clear, and educational points:
\`\`\`${language}
${code}
\`\`\`

Respond ONLY with a valid JSON object matching:
{
  "summary": "1 sentence high level overview",
  "steps": ["Step 1 explanation", "Step 2 explanation", "Step 3 explanation"],
  "timeComplexity": "e.g., O(N) or N/A",
  "spaceComplexity": "e.g., O(1) or N/A"
}`;
    } else {
      return NextResponse.json(
        { error: "Invalid action. Supported: fix-error, translate, explain" },
        { status: 400 }
      );
    }

    let responseText = "";
    let lastErr: Error | null = null;

    for (const modelName of MODELS_TO_TRY) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        responseText = response.text() || "";
        if (responseText) break;
      } catch (err: unknown) {
        lastErr = err instanceof Error ? err : new Error(String(err));
      }
    }

    if (!responseText) {
      throw lastErr || new Error("Failed to generate response from Gemini AI.");
    }

    let text = responseText.trim();
    if (text.startsWith("```json")) {
      text = text.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (text.startsWith("```")) {
      text = text.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `AI Assistant failed: ${msg}` },
      { status: 500 }
    );
  }
}
