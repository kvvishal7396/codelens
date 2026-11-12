import { NextRequest, NextResponse } from "next/server";
import { callGeminiWithRetry, cleanJsonResponse, formatGeminiErrorMessage } from "@/lib/gemini";

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
      prompt = `You are an elite competitive programmer and multi-language compiler engineer.
Translate the following ${language} code into clean, idiomatic, and 100% executable ${targetLanguage}:
\`\`\`${language}
${code}
\`\`\`

CRITICAL EXECUTION & OUTPUT INTEGRITY RULES:
1. IDENTICAL OUTPUT & TEST-CASE FIDELITY:
   - The translated ${targetLanguage} code MUST produce the EXACT SAME runtime output as the original ${language} code.
   - If the source code processes T test cases and prints T lines of results, the translated code MUST print all T lines.
2. STRICT LOOP & SCOPE INTEGRITY (DO NOT MOVE CODE OUTSIDE LOOPS):
   - Pay meticulous attention to indentation levels in ${language}!
   - If any calculation, function call, or print statement (print / println / console.log / cout) is indented inside a loop (e.g., 'for i in range(n):' or 'while'), it MUST remain INSIDE the corresponding loop body '{ ... }' in ${targetLanguage}.
   - NEVER place the output statement after the loop closing brace '}'! Doing so overwrites results and only prints the last item.
3. SANDBOX-COMPATIBLE INPUT / OUTPUT:
   - If the code reads standard input (stdin):
     * For JavaScript / TypeScript (Node.js):
       DO NOT use asynchronous 'readline.question'. Use synchronous reading:
       \`\`\`javascript
       const fs = require('fs');
       const input = fs.readFileSync(0, 'utf-8').trim();
       \`\`\`
       Split input by lines or whitespace and process each test case.
     * For Rust:
       Use 'use std::io::{self, BufRead};'. Read from 'io::stdin().lock().lines()'. Keep processing and 'println!(...)' inside the test-case loop!
     * For C++: Use '#include <iostream>', '#include <string>', '#include <algorithm>'. Use 'cin' and 'cout << ... << "\\n";'.
     * For Java: Use 'public class Main' with 'Scanner sc = new Scanner(System.in);'.
     * For Go: Use 'package main', 'import ("bufio", "fmt", "os")'.
     * For Python: Use standard 'input()' or 'sys.stdin.read().split()'.
4. COMPLETE & FULLY RUNNABLE:
   - Output 100% self-contained code with all necessary imports, modules, helper functions, and the main entry point.

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
    const friendlyMsg = formatGeminiErrorMessage(err);
    return NextResponse.json(
      { error: friendlyMsg },
      { status: 500 }
    );
  }
}
