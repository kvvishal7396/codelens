import { NextRequest, NextResponse } from "next/server";
import { callGeminiWithRetry, cleanJsonResponse } from "@/lib/gemini";

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

    let prompt = "";

    if (action === "fix-error") {
      prompt = `You are an expert software engineer and debugger.
Here is source code written in ${language}:
\`\`\`${language}
${code}
\`\`\`

When executed in an isolated Linux sandbox environment, it produced the following runtime/compiler error:
\`\`\`
${errorOutput || "Unknown execution error"}
\`\`\`

Note: If the error mentions missing files/directories (like "cannot access 'workspace': No such file or directory"), fix the script by ensuring the necessary directories or files are created first (e.g. "mkdir -p workspace", "touch old_draft.txt") so the script runs without errors.

Respond ONLY with a valid JSON object matching this schema without any markdown ticks:
{
  "fixedCode": "the complete corrected runnable code string",
  "explanation": "2-3 sentences explaining what caused the bug and how it was fixed"
}`;
    } else if (action === "translate") {
      prompt = `You are an expert multi-language software engineer and competitive programming specialist.
Translate the following ${language} code into clean, idiomatic, and 100% executable ${targetLanguage}:
\`\`\`${language}
${code}
\`\`\`

CRITICAL EXECUTION & OUTPUT RULES:
1. IDENTICAL OUTPUT GUARANTEE:
   - The translated ${targetLanguage} code MUST produce the EXACT SAME runtime output as the original ${language} code when executed.
   - If the original code calculates values, loops, or prints results, preserve the exact formatting, spacing, and output logic.
2. SANDBOX-COMPATIBLE INPUT / OUTPUT:
   - If the code reads standard input (stdin):
     * For JavaScript / TypeScript (Node.js):
       DO NOT use asynchronous 'readline.question' (it can fail on non-interactive piped sandbox runners).
       Use synchronous stdin reading with fallback:
       \`\`\`javascript
       const fs = require('fs');
       let input = '';
       try { input = fs.readFileSync(0, 'utf-8').trim(); } catch (e) {}
       \`\`\`
       If input is empty, fallback to the default sample input (e.g. 10 or test case) so that clicking "Run" executes and produces output immediately!
     * For C++: Use '#include <iostream>', 'std::cin', and 'std::cout'.
     * For Java: Use a public class Main with 'Scanner scanner = new Scanner(System.in);'.
     * For Python: Use 'input()' or 'sys.stdin.read()'.
     * For Go: Use 'package main', 'import ("fmt", "os")'.
3. SELF-CONTAINED & RUNNABLE:
   - Include all necessary imports, headers, and main execution entry points so the code compiles and runs in an isolated Linux sandbox without errors.

Respond ONLY with a valid JSON object matching this schema without any markdown ticks:
{
  "translatedCode": "the complete executable ${targetLanguage} code",
  "explanation": "Brief note on language-specific differences or libraries used"
}`;
    } else if (action === "explain") {
      prompt = `You are a computer science educator.
Explain the following ${language} code in concise, clear, and educational points:
\`\`\`${language}
${code}
\`\`\`

Respond ONLY with a valid JSON object matching this schema without any markdown ticks:
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

    const responseText = await callGeminiWithRetry(apiKey, [prompt]);

    try {
      const parsed = cleanJsonResponse(responseText);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({
        fixedCode: code,
        explanation: responseText,
      });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `AI Assistant failed: ${msg}` },
      { status: 500 }
    );
  }
}
