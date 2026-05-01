import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/encryption";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: keys, error } = await supabase
    .from("user_ai_keys")
    .select("id, user_id, provider, name, model_name, created_at, updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ keys });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { provider, name, value, model_name } = body;

  if (!provider || !name) {
    return NextResponse.json(
      { error: "provider and name are required" },
      { status: 400 }
    );
  }

  if (!["openai", "deepseek", "ollama"].includes(provider)) {
    return NextResponse.json(
      { error: "Only OpenAI, DeepSeek, and Ollama are supported." },
      { status: 400 }
    );
  }

  // Check for duplicate
  const { data: existing } = await supabase
    .from("user_ai_keys")
    .select("id")
    .eq("user_id", user.id)
    .eq("provider", provider)
    .eq("name", name)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "A key with this provider and name already exists." },
      { status: 400 }
    );
  }

  // For local providers (ollama), no API key or encryption needed
  if (provider === "ollama") {
    const { data: key, error } = await supabase
      .from("user_ai_keys")
      .insert({
        user_id: user.id,
        provider,
        name,
        model_name: model_name || null,
        // No encrypted_value for local providers
      })
      .select("id, user_id, provider, name, model_name, created_at, updated_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ key }, { status: 201 });
  }

  // Cloud providers require a value (API key)
  if (!value) {
    return NextResponse.json(
      { error: "API key is required for cloud providers." },
      { status: 400 }
    );
  }

  if (!value.startsWith("sk-")) {
    return NextResponse.json(
      { error: "Invalid API key format. Keys start with sk-." },
      { status: 400 }
    );
  }

  let encryptedValue: string;
  try {
    encryptedValue = encrypt(value);
  } catch {
    return NextResponse.json(
      { error: "Encryption failed. Make sure ENCRYPTION_KEY is set." },
      { status: 500 }
    );
  }

  const { data: key, error } = await supabase
    .from("user_ai_keys")
    .insert({
      user_id: user.id,
      provider,
      name,
      encrypted_value: encryptedValue,
    })
    .select("id, user_id, provider, name, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ key }, { status: 201 });
}