"use client";

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { KanbanBoard } from "@/components/projects/kanban-board";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import type { Project } from "@/lib/types";

async function fetchProjects(): Promise<{ projects: Project[] }> {
  const res = await fetch("/api/projects");
  if (!res.ok) throw new Error("Failed to fetch projects");
  return res.json();
}

export default function ProjectsPage() {
  const { data, error, mutate } = useSWR("projects", fetchProjects);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Failed to load projects</p>
      </div>
    );
  }

  const projects = data?.projects || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">
            Drag and drop projects between columns to update their status
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      <KanbanBoard 
        projects={projects} 
        onUpdate={mutate}
        isLoading={!data && !error}
      />

      <CreateProjectDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          mutate();
          setCreateDialogOpen(false);
        }}
      />
    </div>
  );
}
