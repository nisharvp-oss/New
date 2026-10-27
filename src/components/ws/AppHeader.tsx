import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";

export function AppHeader() {
  const { user } = useSession();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { plan: undefined }, replace: true });
  };
  return (
    <header className="sticky top-0 z-40 bg-gradient-ocean text-navy-foreground">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5">
        <Link to="/" className="flex items-center gap-2 font-extrabold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-sunset shadow-glow"><Compass className="h-5 w-5" /></span>
          WanderSync
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link to="/demo" className="hidden px-2 text-navy-foreground/80 hover:text-navy-foreground sm:inline">Demo</Link>
          {user ? (
            <>
              <Button size="sm" variant="secondary" asChild><Link to="/dashboard">My workspace</Link></Button>
              <Button size="sm" variant="ghost" onClick={signOut}>Sign out</Button>
            </>
          ) : (
            <Button size="sm" variant="secondary" asChild><Link to="/auth" search={{ plan: undefined }}>Sign in</Link></Button>
          )}
        </nav>
      </div>
    </header>
  );
}
