import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { aiComplete } from "@/lib/ai/openai";
import type { AiField, UserAiKeyWithSecret } from "@/lib/types";
import type { JSONContent } from "@tiptap/react";

// Extract plain text from TipTap JSON content
function extractTextFromTipTap(node: JSONContent | null): string {
  if (!node) return "";

  if (node.text) {
    return node.text;
  }

  if (node.content && Array.isArray(node.content)) {
    const parts = node.content.map((n) => extractTextFromTipTap(n));
    // Add newline between block elements (paragraph, headings, lists)
    const blockTags = new Set(["doc", "paragraph", "heading", "bulletList", "orderedList", "listItem", "blockquote"]);
    if (blockTags.has(node.type || "")) {
      return parts.join("\n");
    }
    return parts.join("");
  }

  return "";
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { field, project_id, project_name, current_value } = body;

  if (!field || !["description", "notes", "name"].includes(field)) {
    return NextResponse.json(
      { error: "Invalid field. Must be 'description', 'notes', or 'name'." },
      { status: 400 }
    );
  }

  // Fetch user's preferred provider
  const { data: prefs } = await supabase
    .from("user_ai_preferences")
    .select("preferred_provider")
    .eq("user_id", user.id)
    .single();

  const preferredProvider = prefs?.preferred_provider || "openai";

  // Fetch user's AI key for preferred provider
  let { data: apiKey } = await supabase
    .from("user_ai_keys")
    .select("*")
    .eq("user_id", user.id)
    .eq("provider", preferredProvider)
    .single();

  // Fallback: use any available key if preferred one doesn't exist
  if (!apiKey) {
    ({ data: apiKey } = await supabase
      .from("user_ai_keys")
      .select("*")
      .eq("user_id", user.id)
      .single());
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: "No AI key configured. Add one in Settings." },
      { status: 404 }
    );
  }

  let projectName: string;
  let currentValue: string | undefined;

  if (project_id) {
    // Existing project — fetch from DB
    const { data: project } = await supabase
      .from("projects")
      .select("id, name, description, notes")
      .eq("id", project_id)
      .eq("user_id", user.id)
      .single();

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    projectName = project.name;

    // Get current value based on field type
    if (field === "notes") {
      currentValue = extractTextFromTipTap(project.notes ? project.notes as JSONContent : null);
    } else if (field === "description") {
      currentValue = String(project.description || "");
    } else if (field === "name") {
      currentValue = project.name; // existing name as context
    }

    
  } else if (project_name) {
    // New project — use name directly from form
    projectName = project_name;
    // Use current_value from form if provided (e.g. description/name filled before AI fill)
    currentValue = current_value || undefined;
  } else {
    return NextResponse.json(
      { error: "project_id or project_name is required" },
      { status: 400 }
    );
  }

  try {
    const completion = await aiComplete({
      apiKey: apiKey as UserAiKeyWithSecret,
      field: field as AiField,
      projectName,
      currentValue,
    });

    return NextResponse.json({ completion });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    if (message.includes("401") || message.includes("Incorrect API key")) {
      return NextResponse.json(
        { error: "Invalid API key. Please check your key in Settings." },
        { status: 500 }
      );
    }

    if (message.includes("429") || message.includes("rate limit")) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again in a moment." },
        { status: 500 }
      );
    }

    if (message.includes("connection refused") || message.includes("ECONNREFUSED")) {
      return NextResponse.json(
        { error: "Ollama is not running. Start it with 'ollama serve'." },
        { status: 503 }
      );
    }

    if (message.includes("model")) {
      return NextResponse.json(
        { error: "Model not found. Check your Ollama model is downloaded." },
        { status: 500 }
      );
    }

    console.error("AI completion error:", message);

    return NextResponse.json(
      { error: "AI service error. Please try again." },
      { status: 500 }
    );
  }
}