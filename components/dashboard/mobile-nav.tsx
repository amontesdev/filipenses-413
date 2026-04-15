"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  FolderKanban, 
  KeyRound, 
  Activity,
  Settings,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/lib/types";

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  profile: Profile | null;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Vault", href: "/vault", icon: KeyRound },
  { name: "Activity", href: "/activity", icon: Activity },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function MobileNav({ open, onClose, profile }: MobileNavProps) {
  const pathname = usePathname();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-sidebar border-r border-sidebar-border">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
              <span className="text-lg font-bold text-primary">4</span>
            </div>
            <span className="font-semibold text-sidebar-foreground">filipenses-413</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close menu</span>
          </Button>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
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
        <div className="absolute bottom-0 left-0 right-0 border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 px-3">
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
      </div>
    </div>
  );
}
