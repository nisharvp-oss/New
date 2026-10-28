import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — WanderSync" },
      { name: "description", content: "Choose a new password for your WanderSync account." },
      { property: "og:title", content: "Reset password — WanderSync" },
      { property: "og:description", content: "Choose a new password for your WanderSync account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated");
    navigate({ to: "/dashboard", replace: true });
  };
  return (
    <main className="grid min-h-[80vh] place-items-center px-4 py-10">
      <Card className="w-full max-w-sm p-6 shadow-card">
        <h1 className="text-2xl font-extrabold">Set a new password</h1>
        <p className="mt-1 text-sm text-muted-foreground">Open this page from the link in your reset email.</p>
        <form onSubmit={submit} className="mt-5 space-y-3">
          <div><Label>New password</Label><Input type="password" minLength={8} required value={pw} onChange={(e) => setPw(e.target.value)} /></div>
          <Button className="w-full" disabled={busy}>Update password</Button>
        </form>
      </Card>
    </main>
  );
}
