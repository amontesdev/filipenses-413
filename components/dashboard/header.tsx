"use client";

import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, LogOut, Settings, User as UserIcon } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types";
import { MobileNav } from "./mobile-nav";
import { useState } from "react";

interface DashboardHeaderProps {
  user: User;
  profile: Profile | null;
}

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/projects": "Projects",
  "/vault": "Vault",
  "/activity": "Activity",
  "/settings": "Settings",
};

export function DashboardHeader({ user, profile }: DashboardHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  
  // Get page title, handling dynamic routes
  const getPageTitle = () => {
    if (pathname.startsWith("/projects/") && pathname !== "/projects") {
      return "Project Details";
    }
    return pageTitles[pathname] || "Dashboard";
  };

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 lg:px-6">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileNavOpen(true)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>

        {/* Page title */}
        <h1 className="text-lg font-semibold text-foreground">
          {getPageTitle()}
        </h1>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <span className="text-xs font-medium text-muted-foreground">
                  {profile?.display_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex flex-col space-y-1 p-2">
              <p className="text-sm font-medium">{profile?.display_name || "User"}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings/profile")}>
              <UserIcon className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <MobileNav 
        open={mobileNavOpen} 
        onClose={() => setMobileNavOpen(false)} 
        profile={profile}
      />
    </>
  );
}
