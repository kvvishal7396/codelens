import { NextRequest, NextResponse } from "next/server";

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

    // Ensure stdin has a trailing newline so line-based input readers (Node.js readline, C++ cin, C fgets, Bash read) never block or discard input on EOF
    let cleanStdin: string | undefined = undefined;
    if (typeof stdin === "string" && stdin.trim().length > 0) {
      cleanStdin = stdin.endsWith("\n") ? stdin : stdin + "\n";
    }

    // Call Judge0 CE public engine with timeout protection
    const judge0Base = process.env.JUDGE0_URL || "https://ce.judge0.com";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(
      `${judge0Base}/submissions?base64_encoded=false&wait=true`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language_id: languageId,
          source_code: code,
          stdin: cleanStdin,
        }),
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

    // Judge0 status handling: 3 is "Accepted" (Success)
    const statusId = data.status?.id ?? 3;
    const isSuccess = statusId === 3;
    const exitCode = isSuccess ? 0 : 1;

    // Compile error takes precedence over stderr if present
    const stderrOutput = [data.compile_output, data.stderr, data.message]
      .filter(Boolean)
      .join("\n");

    return NextResponse.json({
      stdout: data.stdout || "",
      stderr: stderrOutput,
      output: (data.stdout || "") + (stderrOutput ? `\n${stderrOutput}` : ""),
      code: exitCode,
      timeMs: data.time ? Math.round(parseFloat(data.time) * 1000) : elapsedMs,
      memoryKb: data.memory,
      statusDescription: data.status?.description || (isSuccess ? "Success" : "Error"),
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
