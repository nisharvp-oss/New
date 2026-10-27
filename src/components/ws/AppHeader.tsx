import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Crown, Home, LogOut, Megaphone, PlayCircle, UserRound } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { supabase } from "@/integrations/supabase/client";
import { must } from "@/lib/must";
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";
import { Wordmark } from "./Brand";

function useSignOut() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { plan: undefined }, replace: true });
  };
}

function useIsAdmin(userId: string | undefined) {
  return useQuery({
    queryKey: ["is-admin", userId],
    enabled: !!userId,
    queryFn: async () => (await must(supabase.rpc("has_role", { _user_id: userId!, _role: "super_admin" }))) ?? false,
  });
}

export function AppHeader() {
  const { user } = useSession();
  const signOut = useSignOut();
  return (
    <header className="pt-safe sticky top-0 z-40 border-b border-navy-foreground/10 bg-navy/95 text-navy-foreground backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4">
        <Link to={user ? "/dashboard" : "/"} aria-label="WanderSync home"><Wordmark /></Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link to="/demo" className="hidden rounded-lg px-3 py-2 text-navy-foreground/75 hover:text-navy-foreground md:inline">Demo</Link>
          {user ? (
            <>
              <Link to="/dashboard" className="hidden rounded-lg px-3 py-2 text-navy-foreground/75 hover:text-navy-foreground md:inline">Workspace</Link>
              <Link to="/sponsor" className="hidden rounded-lg px-3 py-2 text-navy-foreground/75 hover:text-navy-foreground md:inline">Sponsors</Link>
              <Button size="sm" variant="ghost" className="hidden text-navy-foreground hover:bg-navy-foreground/10 hover:text-navy-foreground md:inline-flex" onClick={signOut}>Sign out</Button>
            </>
          ) : (
            <Button size="sm" className="bg-sunset text-sunset-foreground hover:bg-sunset/90" asChild><Link to="/auth" search={{ plan: undefined }}>Sign in</Link></Button>
          )}
        </nav>
      </div>
    </header>
  );
}

/** Bottom navigation for signed-in users on phones — the app's primary nav. */
export function MobileTabBar() {
  const { user } = useSession();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const isAdmin = useIsAdmin(user?.id);
  const signOut = useSignOut();
  if (!user) return null;

  const item = (active: boolean) =>
    cn(
      "press relative flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-semibold transition-colors",
      active ? "text-primary" : "text-muted-foreground",
    );
  const dot = (active: boolean) => active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />;
  const isHome = path === "/dashboard" || path.startsWith("/company") || path.startsWith("/trip");

  return (
    <>
      <nav aria-label="Primary" className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t bg-card/90 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-md px-2">
          <Link to="/dashboard" className={item(isHome)}>{dot(isHome)}<Home className="h-5 w-5" />Trips</Link>
          <Link to="/sponsor" className={item(path === "/sponsor")}>{dot(path === "/sponsor")}<Megaphone className="h-5 w-5" />Sponsor</Link>
          <Link to="/demo" className={item(path === "/demo")}>{dot(path === "/demo")}<PlayCircle className="h-5 w-5" />Demo</Link>
          <button type="button" onClick={() => setOpen(true)} className={item(open)}>{dot(open)}<UserRound className="h-5 w-5" />Account</button>
        </div>
      </nav>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="pb-safe">
          <div className="space-y-2 px-4 pb-6 pt-2">
            <DrawerTitle className="font-display text-lg">Account</DrawerTitle>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            {isAdmin.data && (
              <Button variant="outline" className="h-12 w-full justify-start" asChild onClick={() => setOpen(false)}>
                <Link to="/admin"><Crown className="text-primary" /> Platform admin</Link>
              </Button>
            )}
            <Button variant="outline" className="h-12 w-full justify-start text-destructive hover:text-destructive" onClick={() => { setOpen(false); signOut(); }}>
              <LogOut /> Sign out
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
