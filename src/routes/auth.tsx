import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import "@lovable.dev/cloud-auth-js/styles.css";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wordmark } from "@/components/ws/Brand";
import { cn } from "@/lib/utils";
import { useSiteImages } from "@/lib/site-images.functions";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ plan: typeof s["plan"] === "string" ? s["plan"] : undefined }),
  head: () => ({
    meta: [
      { title: "Sign in — WanderSync" },
      { name: "description", content: "Sign in or create your WanderSync account to manage group trips." },
      { property: "og:title", content: "Sign in — WanderSync" },
      { property: "og:description", content: "Sign in or create your WanderSync account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const photos = useSiteImages();
  const { plan } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("up");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (plan) sessionStorage.setItem("ws-plan", plan);
    const go = () => navigate({ to: "/dashboard", replace: true });
    supabase.auth.getUser().then(({ data }) => data.user && go());
    const { data } = supabase.auth.onAuthStateChange((e) => e === "SIGNED_IN" && go());
    return () => data.subscription.unsubscribe();
  }, [plan, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (mode === "up") {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/dashboard", data: { full_name: name } } });
      if (error) toast.error(error.message); else setSent(true);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
    }
    setBusy(false);
  };

  const oauth = async (p: "google" | "lovable") => {
    const r = await lovable.auth.signInWithOAuth(p, { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error("Sign-in failed. Please try again.");
  };

  return (
    <main className="min-h-dvh bg-background text-white lg:grid lg:grid-cols-[1fr_minmax(28rem,36rem)]">
      <section className="pt-safe relative flex flex-col overflow-hidden px-5 pb-14 sm:px-10 lg:m-3 lg:min-h-[calc(100dvh-1.5rem)] lg:rounded-[2.5rem] lg:pb-12">
        <img src={photos.auth_panel.src} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/80" />
        <div className="relative flex h-16 items-center">
          <Link to="/" aria-label="WanderSync home"><Wordmark /></Link>
        </div>
        <div className="relative mt-10 max-w-lg lg:mb-0 lg:mt-auto">
          <h1 className="rise font-display text-[clamp(2.1rem,5vw,3.75rem)] font-bold leading-[1] tracking-[-0.03em]">
            {mode === "up" ? "Your next group trip starts here." : "Welcome back."}
          </h1>
          <p className="rise mt-4 text-lg text-white/85" style={{ "--d": "120ms" } as React.CSSProperties}>
            {mode === "up" ? "Create an account to start your company's free trial, plan a trip for friends, or join the team that invited you." : "Sign in to see your trips, tickets and team."}
          </p>
        </div>
      </section>
      <section className="pb-safe relative -mt-6 rounded-t-[2rem] bg-background text-foreground lg:mt-0 lg:grid lg:place-items-center lg:rounded-none">
        <div className="mx-auto w-full max-w-sm px-5 py-8 sm:py-10">
          {sent ? (
            <div className="rounded-2xl bg-secondary p-5">
              <p className="font-display text-xl font-semibold">Check your inbox</p>
              <p className="mt-2 text-sm text-muted-foreground">We sent a confirmation link to <b className="text-foreground">{email}</b>. Open it on this device to finish.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 rounded-xl bg-muted p-1 text-sm font-semibold" role="tablist" aria-label="Account">
                {(["up", "in"] as const).map((m) => (
                  <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)}
                    className={cn("rounded-lg py-2 transition-colors", mode === m ? "bg-card text-foreground shadow-card" : "text-muted-foreground")}>
                    {m === "up" ? "Create account" : "Sign in"}
                  </button>
                ))}
              </div>
              <div className="mt-6 space-y-2.5">
                <Button variant="outline" size="lg" className="w-full" onClick={() => oauth("google")}><GoogleIcon /> Continue with Google</Button>
                <button type="button" className="lovable-auth-button w-full" onClick={() => oauth("lovable")}>Continue with Lovable</button>
              </div>
              <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or with email<span className="h-px flex-1 bg-border" /></div>
              <form onSubmit={submit} className="space-y-4">
                {mode === "up" && <div className="space-y-1.5"><Label htmlFor="name">Your name</Label><Input id="name" className="h-12 rounded-xl" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required /></div>}
                <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" className="h-12 rounded-xl" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {mode === "in" && (
                      <button type="button" className="text-sm font-medium text-primary" onClick={async () => {
                        if (!email) { toast.error("Enter your email first, then tap Forgot password"); return; }
                        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
                        if (error) toast.error(error.message); else toast.success("Check your inbox for a reset link");
                      }}>Forgot password?</button>
                    )}
                  </div>
                  <Input id="password" className="h-12 rounded-xl" type="password" autoComplete={mode === "up" ? "new-password" : "current-password"} minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
                  {mode === "up" && <p className="text-xs text-muted-foreground">At least 8 characters.</p>}
                </div>
                <Button size="lg" className="w-full" disabled={busy}>{busy ? "One moment…" : mode === "up" ? "Create account" : "Sign in"}</Button>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8.1z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7.1H2.1a11 11 0 0 0 0 9.9l3.7-2.8z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z" />
    </svg>
  );
}
