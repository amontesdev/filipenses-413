import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("user_ai_preferences")
    .select("preferred_provider")
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ preferred_provider: "openai" });
  }

  return NextResponse.json({ preferred_provider: data.preferred_provider });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { preferred_provider } = body;

  if (!preferred_provider) {
    return NextResponse.json(
      { error: "preferred_provider is required" },
      { status: 400 }
    );
  }

  if (!["openai", "deepseek"].includes(preferred_provider)) {
    return NextResponse.json(
      { error: "Only OpenAI and DeepSeek are supported" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("user_ai_preferences")
    .upsert({ user_id: user.id, preferred_provider }, { onConflict: "user_id" })
    .select("preferred_provider")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ preferred_provider: data.preferred_provider });
}