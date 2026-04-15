"use client";

import useSWR from "swr";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity as ActivityIcon, FolderKanban, KeyRound, Rocket, Trash2, Plus } from "lucide-react";
import Link from "next/link";
import type { ActivityLog } from "@/lib/types";

interface ActivityWithProject extends ActivityLog {
  projects: { name: string } | null;
}

async function fetchActivity(): Promise<{ activities: ActivityWithProject[]; total: number }> {
  const res = await fetch("/api/activity?limit=100");
  if (!res.ok) throw new Error("Failed to fetch activity");
  return res.json();
}

function getActivityIcon(action: string) {
  if (action.includes("Created project")) return Plus;
  if (action.includes("Deleted project") || action.includes("Deleted secret")) return Trash2;
  if (action.includes("status")) return Rocket;
  if (action.includes("secret")) return KeyRound;
  return FolderKanban;
}

function getActivityColor(action: string) {
  if (action.includes("Created")) return "bg-emerald-500";
  if (action.includes("Deleted")) return "bg-red-500";
  if (action.includes("launched")) return "bg-emerald-500";
  if (action.includes("in_progress") || action.includes("in progress")) return "bg-blue-500";
  return "bg-primary";
}

function formatRelativeTime(date: string) {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return then.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: then.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export default function ActivityPage() {
  const { data, error } = useSWR("activity", fetchActivity);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Failed to load activity</p>
      </div>
    );
  }

  const activities = data?.activities || [];
  const isLoading = !data && !error;

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
              <ActivityIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-foreground">Activity Feed</CardTitle>
              <CardDescription>
                Your recent actions across all projects
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ActivityIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No activity yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Your activity will appear here as you create projects, add secrets, and make changes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border bg-card">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {activities.map((activity) => {
                const Icon = getActivityIcon(activity.action);
                const colorClass = getActivityColor(activity.action);
                
                return (
                  <div 
                    key={activity.id} 
                    className="flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{activity.action}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(activity.created_at)}
                        </span>
                        {activity.projects && (
                          <>
                            <span className="text-xs text-muted-foreground">in</span>
                            <Link 
                              href={`/projects/${activity.project_id}`}
                              className="text-xs text-primary hover:underline"
                            >
                              {activity.projects.name}
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {data && data.total > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Showing {activities.length} of {data.total} activities
        </p>
      )}
    </div>
  );
}
