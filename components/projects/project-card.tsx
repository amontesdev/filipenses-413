"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Github, ExternalLink, Trash2 } from "lucide-react";
import type { Project } from "@/lib/types";
import { useState } from "react";
import { DeleteProjectDialog } from "./delete-project-dialog";

interface ProjectCardProps {
  project: Project;
  onDragStart: () => void;
  onUpdate: () => void;
}

export function ProjectCard({ project, onDragStart, onUpdate }: ProjectCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  return (
    <>
      <Card
        draggable
        onDragStart={onDragStart}
        className="border-border bg-card hover:bg-card/80 cursor-grab active:cursor-grabbing transition-colors"
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <Link href={`/projects/${project.id}`} className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground truncate hover:text-primary transition-colors">
                {project.name}
              </h3>
              {project.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {project.description}
                </p>
              )}
            </Link>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/projects/${project.id}`}>
                    View Details
                  </Link>
                </DropdownMenuItem>
                {project.github_url && (
                  <DropdownMenuItem asChild>
                    <a href={project.github_url} target="_blank" rel="noopener noreferrer">
                      <Github className="mr-2 h-4 w-4" />
                      GitHub
                    </a>
                  </DropdownMenuItem>
                )}
                {project.live_url && (
                  <DropdownMenuItem asChild>
                    <a href={project.live_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Live Site
                    </a>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2 mt-3">
            {project.github_url && (
              <a 
                href={project.github_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <Github className="h-4 w-4" />
              </a>
            )}
            {project.live_url && (
              <a 
                href={project.live_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
            <span className="ml-auto text-xs text-muted-foreground">
              {new Date(project.updated_at).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>

      <DeleteProjectDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        project={project}
        onSuccess={onUpdate}
      />
    </>
  );
}
