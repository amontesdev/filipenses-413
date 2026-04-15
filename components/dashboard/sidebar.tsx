"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  FolderKanban, 
  KeyRound, 
  Activity,
  Settings
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types";

interface DashboardSidebarProps {
  user: User;
  profile: Profile | null;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Vault", href: "/vault", icon: KeyRound },
  { name: "Activity", href: "/activity", icon: Activity },
];

export function DashboardSidebar({ profile }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-shrink-0 border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
          <span className="text-lg font-bold text-primary">4</span>
        </div>
        <span className="font-semibold text-sidebar-foreground">filipenses-413</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-sidebar-border p-4">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/settings"
              ? "bg-sidebar-accent text-sidebar-primary"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <div className="mt-3 flex items-center gap-3 px-3">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <span className="text-xs font-medium text-muted-foreground">
              {profile?.display_name?.charAt(0)?.toUpperCase() || "U"}
            </span>
          </div>
          <div className="flex-1 truncate">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {profile?.display_name || "User"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
