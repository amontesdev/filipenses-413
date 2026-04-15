import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ project });
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
  const { name, description, status, notes, github_url, live_url } = body;

  // First, get the current project to compare status
  const { data: currentProject } = await supabase
    .from("projects")
    .select("status, name")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (status !== undefined) updateData.status = status;
  if (notes !== undefined) updateData.notes = notes;
  if (github_url !== undefined) updateData.github_url = github_url;
  if (live_url !== undefined) updateData.live_url = live_url;

  const { data: project, error } = await supabase
    .from("projects")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log activity for status changes
  if (status && currentProject && status !== currentProject.status) {
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      project_id: id,
      action: `Changed "${currentProject.name}" status to ${status.replace("_", " ")}`,
      details: { from: currentProject.status, to: status },
    });
  }

  return NextResponse.json({ project });
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

  // Get project name for activity log
  const { data: project } = await supabase
    .from("projects")
    .select("name")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log activity
  if (project) {
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      action: `Deleted project "${project.name}"`,
    });
  }

  return NextResponse.json({ success: true });
}
