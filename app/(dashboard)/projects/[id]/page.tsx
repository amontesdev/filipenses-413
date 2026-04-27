"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Github, ExternalLink, Loader2, KeyRound } from "lucide-react";
import { PROJECT_STATUS_CONFIG, type Project, type ProjectStatus } from "@/lib/types";
import { ProjectNotes } from "@/components/projects/project-notes";
import { FillWithAiButton } from "@/components/ai/fill-with-ai-button";

async function fetchProject(id: string): Promise<{ project: Project }> {
  const res = await fetch(`/api/projects/${id}`);
  if (!res.ok) throw new Error("Failed to fetch project");
  return res.json();
}

export default function ProjectDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data, error, mutate } = useSWR(`project-${id}`, () => fetchProject(id));
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Project> | null>(null);

  // Initialize form data when project loads
  if (data?.project && !formData) {
    setFormData({
      name: data.project.name,
      description: data.project.description,
      status: data.project.status,
      github_url: data.project.github_url,
      live_url: data.project.live_url,
    });
  }

  async function handleSave() {
    if (!formData) return;
    setIsSaving(true);

    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      mutate();
    }

    setIsSaving(false);
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link href="/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Link>
        </Button>
        <p className="text-destructive">Failed to load project</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const project = data.project;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/vault?project=${id}`}>
            <KeyRound className="mr-2 h-4 w-4" />
            View Secrets
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Project Details */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Project Details</CardTitle>
            <CardDescription>Update your project information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="name">Name</Label>
                <FillWithAiButton
                  projectId={id}
                  field="name"
                  onComplete={(value) => setFormData({ ...formData, name: value })}
                />
              </div>
              <Input
                id="name"
                value={formData?.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">Description</Label>
                <FillWithAiButton
                  projectId={id}
                  field="description"
                  onComplete={(value) => setFormData({ ...formData, description: value })}
                />
              </div>
              <Textarea
                id="description"
                value={formData?.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData?.status}
                onValueChange={(value: ProjectStatus) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROJECT_STATUS_CONFIG).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="github_url">GitHub URL</Label>
              <div className="flex gap-2">
                <Input
                  id="github_url"
                  type="url"
                  value={formData?.github_url || ""}
                  onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                  placeholder="https://github.com/..."
                />
                {formData?.github_url && (
                  <Button variant="outline" size="icon" asChild>
                    <a href={formData.github_url} target="_blank" rel="noopener noreferrer">
                      <Github className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="live_url">Live URL</Label>
              <div className="flex gap-2">
                <Input
                  id="live_url"
                  type="url"
                  value={formData?.live_url || ""}
                  onChange={(e) => setFormData({ ...formData, live_url: e.target.value })}
                  placeholder="https://..."
                />
                {formData?.live_url && (
                  <Button variant="outline" size="icon" asChild>
                    <a href={formData.live_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>

            <div className="pt-4">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Project Notes */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Notes</CardTitle>
            <CardDescription>Rich text notes for this project</CardDescription>
          </CardHeader>
          <CardContent>
            <ProjectNotes 
              projectId={id} 
              initialContent={project.notes} 
              onSave={mutate}
            />
          </CardContent>
        </Card>
      </div>

      {/* Metadata */}
      <Card className="border-border bg-card">
        <CardContent className="pt-6">
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>
            <span>Updated: {new Date(project.updated_at).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
