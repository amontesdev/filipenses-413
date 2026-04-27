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
    .select("id, user_id, provider, name, created_at, updated_at")
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
  const { provider, name, value } = body;

  if (!provider || !name || !value) {
    return NextResponse.json(
      { error: "provider, name, and value are required" },
      { status: 400 }
    );
  }

  if (provider !== "openai" && provider !== "deepseek") {
    return NextResponse.json(
      { error: "Only OpenAI and DeepSeek are supported at this time" },
      { status: 400 }
    );
  }

  if (!value.startsWith("sk-")) {
    return NextResponse.json(
      { error: "Invalid API key format. Keys start with sk-." },
      { status: 400 }
    );
  }

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