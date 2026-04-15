import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/encryption";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("project_id");

  let query = supabase
    .from("secrets")
    .select("id, project_id, name, created_at, updated_at, projects(name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data: secrets, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return secrets without the encrypted values (just metadata)
  return NextResponse.json({ secrets });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { project_id, name, value } = body;

  if (!project_id || !name || !value) {
    return NextResponse.json(
      { error: "project_id, name, and value are required" }, 
      { status: 400 }
    );
  }

  // Verify user owns the project
  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", project_id)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Encrypt the secret value
  let encryptedValue: string;
  try {
    encryptedValue = encrypt(value);
  } catch {
    return NextResponse.json(
      { error: "Encryption failed. Make sure ENCRYPTION_KEY is set." }, 
      { status: 500 }
    );
  }

  const { data: secret, error } = await supabase
    .from("secrets")
    .insert({
      project_id,
      user_id: user.id,
      name,
      encrypted_value: encryptedValue,
    })
    .select("id, project_id, name, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log activity
  await supabase.from("activity_logs").insert({
    user_id: user.id,
    project_id,
    action: `Added secret "${name}" to "${project.name}"`,
  });

  return NextResponse.json({ secret }, { status: 201 });
}
