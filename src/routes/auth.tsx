import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import "@lovable.dev/cloud-auth-js/styles.css";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <main className="grid min-h-[80vh] place-items-center px-4 py-10">
      <Card className="w-full max-w-sm p-6 shadow-card">
        <h1 className="text-2xl font-extrabold">{mode === "up" ? "Create your account" : "Welcome back"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{mode === "up" ? "Start your free trial or join your team." : "Sign in to your trips."}</p>
        {sent ? (
          <p className="mt-6 rounded-lg bg-muted p-4 text-sm">Check your inbox at <b>{email}</b> and click the confirmation link to finish.</p>
        ) : (
          <>
            <div className="mt-5 space-y-2">
              <Button variant="outline" className="w-full" onClick={() => oauth("google")}>Continue with Google</Button>
              <button type="button" className="lovable-auth-button w-full" onClick={() => oauth("lovable")}>Continue with Lovable</button>
            </div>
            <div className="my-4 text-center text-xs text-muted-foreground">or with email</div>
            <form onSubmit={submit} className="space-y-3">
              {mode === "up" && <div><Label>Your name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>}
              <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
              <div><Label>Password</Label><Input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
              <Button className="w-full" disabled={busy}>{mode === "up" ? "Create account" : "Sign in"}</Button>
            </form>
            {mode === "in" && (
              <button type="button" className="mt-3 w-full text-center text-sm text-muted-foreground underline" onClick={async () => {
                if (!email) { toast.error("Enter your email above first"); return; }
                const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
                if (error) toast.error(error.message); else toast.success("Check your inbox for a reset link");
              }}>Forgot password?</button>
            )}
            <button className="mt-4 w-full text-center text-sm text-primary" onClick={() => setMode(mode === "up" ? "in" : "up")}>
              {mode === "up" ? "Already have an account? Sign in" : "New here? Create an account"}
            </button>
          </>
        )}
      </Card>
    </main>
  );
}
