import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch("http://localhost:11434/api/tags", {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      if (response.status === 0) {
        return NextResponse.json(
          { error: "Ollama is not running. Start it with 'ollama serve'." },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: "Failed to connect to Ollama." },
        { status: response.status }
      );
    }

    const data = await response.json();

    const models = (data.models || []).map((m: { name: string; size?: number }) => ({
      name: m.name.split(":")[0], // Remove tag (e.g. "llama3.2" from "llama3.2:latest")
      fullName: m.name,
    }));

    return NextResponse.json({ models });
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      return NextResponse.json(
        { error: "Ollama connection timed out. Make sure it is running." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Could not connect to Ollama. Is it running?" },
      { status: 503 }
    );
  }
}