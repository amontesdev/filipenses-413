"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Github, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGitHubLogin() {
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
          `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md px-4">
      <Card className="border-border bg-card">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto mb-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">4</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-semibold text-foreground">
            filipenses-413
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Your personal developer project hub
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}
          
          <Button
            onClick={handleGitHubLogin}
            disabled={isLoading}
            className="w-full bg-foreground text-background hover:bg-foreground/90"
            size="lg"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Github className="mr-2 h-4 w-4" />
            )}
            Continue with GitHub
          </Button>

          <p className="text-center text-xs text-muted-foreground pt-4">
            By continuing, you agree to our terms of service and privacy policy.
          </p>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground mt-8">
        &quot;I can do all things through him who strengthens me.&quot;
        <br />
        <span className="text-muted-foreground/70">Philippians 4:13</span>
      </p>
    </div>
  );
}
