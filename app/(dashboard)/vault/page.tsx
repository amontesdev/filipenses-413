"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, KeyRound, Shield } from "lucide-react";
import { SecretsList } from "@/components/vault/secrets-list";
import { CreateSecretDialog } from "@/components/vault/create-secret-dialog";
import type { Project } from "@/lib/types";

interface SecretWithProject {
  id: string;
  project_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  projects: { name: string } | null;
}

async function fetchSecrets(projectId?: string): Promise<{ secrets: SecretWithProject[] }> {
  const url = projectId ? `/api/secrets?project_id=${projectId}` : "/api/secrets";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch secrets");
  return res.json();
}

async function fetchProjects(): Promise<{ projects: Project[] }> {
  const res = await fetch("/api/projects");
  if (!res.ok) throw new Error("Failed to fetch projects");
  return res.json();
}

export default function VaultPage() {
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get("project") || undefined;
  
  const [selectedProject, setSelectedProject] = useState<string | undefined>(initialProjectId);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: projectsData } = useSWR("projects", fetchProjects);
  const { data: secretsData, error: secretsError, mutate } = useSWR(
    ["secrets", selectedProject],
    () => fetchSecrets(selectedProject)
  );

  const projects = projectsData?.projects || [];
  const secrets = secretsData?.secrets || [];
  const isLoading = !secretsData && !secretsError;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-foreground">Secure Vault</CardTitle>
              <CardDescription>
                Store deployment credentials and API keys securely with AES-256 encryption
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Select
            value={selectedProject || "all"}
            onValueChange={(value) => setSelectedProject(value === "all" ? undefined : value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => setCreateDialogOpen(true)} disabled={projects.length === 0}>
          <Plus className="mr-2 h-4 w-4" />
          Add Secret
        </Button>
      </div>

      {/* Secrets List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : secrets.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <KeyRound className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No secrets yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
              {projects.length === 0 
                ? "Create a project first, then add secrets to store your credentials securely."
                : "Store your API keys, tokens, and credentials securely with AES-256 encryption."}
            </p>
            {projects.length > 0 && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Secret
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <SecretsList secrets={secrets} onUpdate={mutate} />
      )}

      <CreateSecretDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        projects={projects}
        defaultProjectId={selectedProject}
        onSuccess={() => {
          mutate();
          setCreateDialogOpen(false);
        }}
      />
    </div>
  );
}
