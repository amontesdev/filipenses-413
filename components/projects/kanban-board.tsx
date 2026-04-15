"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectCard } from "./project-card";
import type { Project, ProjectStatus } from "@/lib/types";
import { PROJECT_STATUS_CONFIG } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

interface KanbanBoardProps {
  projects: Project[];
  onUpdate: () => void;
  isLoading: boolean;
}

const statusOrder: ProjectStatus[] = ["idea", "in_progress", "launched", "archived"];

export function KanbanBoard({ projects, onUpdate, isLoading }: KanbanBoardProps) {
  const [draggedProject, setDraggedProject] = useState<Project | null>(null);

  async function handleDrop(newStatus: ProjectStatus) {
    if (!draggedProject || draggedProject.status === newStatus) return;

    // Optimistically update
    const res = await fetch(`/api/projects/${draggedProject.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.ok) {
      onUpdate();
    }

    setDraggedProject(null);
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusOrder.map((status) => (
          <Card key={status} className="border-border bg-card min-h-[400px]">
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statusOrder.map((status) => {
        const config = PROJECT_STATUS_CONFIG[status];
        const statusProjects = projects.filter((p) => p.status === status);

        return (
          <div
            key={status}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(status)}
            className="min-h-[400px]"
          >
            <Card className="border-border bg-card/50 h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <span className={`inline-block h-2 w-2 rounded-full ${
                    status === 'idea' ? 'bg-amber-500' :
                    status === 'in_progress' ? 'bg-blue-500' :
                    status === 'launched' ? 'bg-emerald-500' :
                    'bg-zinc-500'
                  }`} />
                  {config.label}
                  <span className="ml-auto text-xs text-muted-foreground font-normal">
                    {statusProjects.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 min-h-[300px]">
                {statusProjects.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    No projects
                  </p>
                ) : (
                  statusProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onDragStart={() => setDraggedProject(project)}
                      onUpdate={onUpdate}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
