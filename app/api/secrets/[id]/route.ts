import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decrypt, encrypt } from "@/lib/encryption";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: secret, error } = await supabase
    .from("secrets")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !secret) {
    return NextResponse.json({ error: "Secret not found" }, { status: 404 });
  }

  // Decrypt the value
  let decryptedValue: string;
  try {
    decryptedValue = decrypt(secret.encrypted_value);
  } catch {
    return NextResponse.json(
      { error: "Decryption failed" }, 
      { status: 500 }
    );
  }

  return NextResponse.json({
    secret: {
      id: secret.id,
      project_id: secret.project_id,
      name: secret.name,
      value: decryptedValue,
      created_at: secret.created_at,
      updated_at: secret.updated_at,
    },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, value } = body;

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (name) updateData.name = name;
  
  if (value) {
    try {
      updateData.encrypted_value = encrypt(value);
    } catch {
      return NextResponse.json(
        { error: "Encryption failed" }, 
        { status: 500 }
      );
    }
  }

  const { data: secret, error } = await supabase
    .from("secrets")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, project_id, name, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ secret });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get secret info for activity log
  const { data: secret } = await supabase
    .from("secrets")
    .select("name, project_id, projects(name)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  const { error } = await supabase
    .from("secrets")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log activity
  if (secret) {
    const projectName = (secret.projects as { name: string } | null)?.name || "Unknown";
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      project_id: secret.project_id,
      action: `Deleted secret "${secret.name}" from "${projectName}"`,
    });
  }

  return NextResponse.json({ success: true });
}
