import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderKanban, KeyRound, Activity, Rocket } from "lucide-react";
import Link from "next/link";
import { PROJECT_STATUS_CONFIG } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch stats
  const [projectsResult, secretsResult, activityResult] = await Promise.all([
    supabase.from("projects").select("id, status").eq("user_id", user?.id),
    supabase.from("secrets").select("id", { count: "exact" }).eq("user_id", user?.id),
    supabase.from("activity_logs").select("*").eq("user_id", user?.id).order("created_at", { ascending: false }).limit(5),
  ]);

  const projects = projectsResult.data || [];
  const secretsCount = secretsResult.count || 0;
  const recentActivity = activityResult.data || [];

  // Count projects by status
  const statusCounts = projects.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const stats = [
    { 
      name: "Total Projects", 
      value: projects.length, 
      icon: FolderKanban, 
      href: "/projects",
      color: "text-primary"
    },
    { 
      name: "In Progress", 
      value: statusCounts["in_progress"] || 0, 
      icon: Activity, 
      href: "/projects?status=in_progress",
      color: "text-blue-400"
    },
    { 
      name: "Launched", 
      value: statusCounts["launched"] || 0, 
      icon: Rocket, 
      href: "/projects?status=launched",
      color: "text-emerald-400"
    },
    { 
      name: "Secrets Stored", 
      value: secretsCount, 
      icon: KeyRound, 
      href: "/vault",
      color: "text-amber-400"
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.name} href={stat.href}>
            <Card className="border-border bg-card hover:bg-card/80 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.name}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Project Status Overview */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Project Status</CardTitle>
            <CardDescription>Overview of your project statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(Object.keys(PROJECT_STATUS_CONFIG) as Array<keyof typeof PROJECT_STATUS_CONFIG>).map((status) => {
                const config = PROJECT_STATUS_CONFIG[status];
                const count = statusCounts[status] || 0;
                const percentage = projects.length > 0 ? (count / projects.length) * 100 : 0;
                
                return (
                  <div key={status} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{config.label}</span>
                      <span className="font-medium text-foreground">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          status === 'idea' ? 'bg-amber-500' :
                          status === 'in_progress' ? 'bg-blue-500' :
                          status === 'launched' ? 'bg-emerald-500' :
                          'bg-zinc-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {projects.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No projects yet. Create your first project to get started.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Activity</CardTitle>
            <CardDescription>Your latest actions</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm text-foreground">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent activity. Start by creating a project.
              </p>
            )}
            {recentActivity.length > 0 && (
              <Link 
                href="/activity" 
                className="block text-center text-sm text-primary hover:underline mt-4"
              >
                View all activity
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
