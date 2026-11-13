import { NextRequest, NextResponse } from "next/server";

// Detect if user's code relies on standard input functions
function detectsInputRequirement(code: string, languageId: number): boolean {
  // Python 3 (100)
  if (languageId === 100 && /\binput\s*\(/.test(code)) return true;
  // C++ (105) / C (103)
  if (
    (languageId === 105 || languageId === 103) &&
    (/\bcin\s*>>/.test(code) ||
      /\bgetline\s*\(\s*cin\b/.test(code) ||
      /\bscanf\s*\(/.test(code) ||
      /\bfgets\s*\(/.test(code))
  )
    return true;
  // Java (91)
  if (
    languageId === 91 &&
    (/\bScanner\b/.test(code) ||
      /\bSystem\.in\b/.test(code) ||
      /\bBufferedReader\b/.test(code))
  )
    return true;
  // Node.js / TS (97, 101)
  if (
    (languageId === 97 || languageId === 101) &&
    (/\bfs\.readFileSync\s*\(\s*0\b/.test(code) || /\breadline\b/.test(code))
  )
    return true;
  // Go (107)
  if (
    languageId === 107 &&
    (/\bScanf?\b/.test(code) || /\bNewReader\b/.test(code))
  )
    return true;
  // Rust (108)
  if (
    languageId === 108 &&
    (/\bread_line\b/.test(code) || /\bstdin\(\)/.test(code))
  )
    return true;
  // Ruby (72)
  if (languageId === 72 && (/\bgets\b/.test(code) || /\breadline\b/.test(code)))
    return true;
  // Bash (46)
  if (languageId === 46 && /\bread\s+/.test(code)) return true;

  return false;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { languageId, code, stdin = "" } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "No code provided to execute." },
        { status: 400 }
      );
    }

    if (!languageId) {
      return NextResponse.json(
        { error: "Programming language ID is required." },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // ATC Normalization 1: Java (JDK 17) class name auto-healing
    // If student pastes "public class Solution" or "public class BubbleSort", rename to "public class Main" so javac succeeds
    let processedCode = code;
    if (languageId === 91) {
      if (
        /public\s+class\s+([A-Za-z0-9_]+)/.test(processedCode) &&
        !/public\s+class\s+Main\b/.test(processedCode)
      ) {
        processedCode = processedCode.replace(
          /public\s+class\s+([A-Za-z0-9_]+)/,
          "public class Main"
        );
      } else if (
        !/class\s+Main\b/.test(processedCode) &&
        /class\s+([A-Za-z0-9_]+)/.test(processedCode)
      ) {
        processedCode = processedCode.replace(
          /class\s+([A-Za-z0-9_]+)/,
          "public class Main"
        );
      }
    }

    // ATC Normalization 2: C++20 modern standards & compiler optimizations
    let compilerOptions: string | undefined = undefined;
    if (languageId === 105) {
      compilerOptions = "-std=c++20 -O2";
    }

    // ATC Normalization 3: Smart Stdin Shield
    // If user's code expects input but stdin is blank, provide non-crashing safe test input
    const requiresInput = detectsInputRequirement(processedCode, languageId);
    let cleanStdin: string | undefined = undefined;
    let autoSuppliedStdin = false;

    if (typeof stdin === "string" && stdin.trim().length > 0) {
      cleanStdin = stdin.endsWith("\n") ? stdin : stdin + "\n";
    } else if (requiresInput) {
      // Safe default input pattern: handles single numbers, counts, arrays, or text lines
      cleanStdin = "10\n1 2 3 4 5\nHello\n";
      autoSuppliedStdin = true;
    }

    // ATC Normalization 4: Full Base64 Byte Transmission
    // Transmitting source_code and stdin as Base64 guarantees 100% byte fidelity for ALL Unicode, math symbols (π, ≤, ≠), emojis, tabs, and escape sequences
    const judge0Base = process.env.JUDGE0_URL || "https://ce.judge0.com";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const payload: Record<string, any> = {
      language_id: languageId,
      source_code: Buffer.from(processedCode, "utf-8").toString("base64"),
      cpu_time_limit: 5.0,
      wall_time_limit: 15.0,
      memory_limit: 256000,
    };

    if (cleanStdin !== undefined) {
      payload.stdin = Buffer.from(cleanStdin, "utf-8").toString("base64");
    }

    if (compilerOptions) {
      payload.compiler_options = compilerOptions;
    }

    const response = await fetch(
      `${judge0Base}/submissions?base64_encoded=true&wait=true`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    const elapsedMs = Date.now() - startTime;

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        {
          error: `Execution engine error (${response.status}): ${errText}`,
          stdout: "",
          stderr: errText,
          code: 1,
          timeMs: elapsedMs,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Helper: decode Base64 outputs with UTF-8 byte fidelity
    const decodeB64 = (s: string | null | undefined): string => {
      if (!s) return "";
      try {
        return Buffer.from(s, "base64").toString("utf-8");
      } catch {
        return s;
      }
    };

    const rawStdout = decodeB64(data.stdout);
    const rawStderr = decodeB64(data.stderr);
    const rawCompileOutput = decodeB64(data.compile_output);
    const rawMessage = decodeB64(data.message);

    // Judge0 status handling: 3 is "Accepted" (Success)
    const statusId = data.status?.id ?? 3;
    const isSuccess = statusId === 3;
    const exitCode = isSuccess ? 0 : 1;

    // Compile error takes precedence over stderr if present
    const stderrOutput = [rawCompileOutput, rawStderr, rawMessage]
      .filter(Boolean)
      .join("\n");

    return NextResponse.json({
      stdout: rawStdout,
      stderr: stderrOutput,
      output: (rawStdout || "") + (stderrOutput ? `\n${stderrOutput}` : ""),
      code: exitCode,
      timeMs: data.time ? Math.round(parseFloat(data.time) * 1000) : elapsedMs,
      memoryKb: data.memory,
      statusDescription:
        data.status?.description || (isSuccess ? "Success" : "Error"),
      requiresInput,
      autoSuppliedStdin,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown server error";
    return NextResponse.json(
      {
        error: `Failed to execute code: ${message}`,
        stdout: "",
        stderr: message,
        code: 1,
        timeMs: 0,
      },
      { status: 500 }
    );
  }
}
