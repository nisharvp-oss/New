import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { savePaymentSecret, paymentSecretStatus } from "@/lib/payment-settings.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function PaymentAccounts() {
  const qc = useQueryClient();
  const settings = useQuery({ queryKey: ["pay-settings"], queryFn: async () => (await supabase.from("platform_settings").select("paypal_email,paypal_client_id,paypal_mode,stripe_publishable_key,stripe_account_email").eq("id", 1).single()).data });
  const status = useQuery({ queryKey: ["pay-secrets"], queryFn: () => paymentSecretStatus() });
  const [f, setF] = useState({ paypal_email: "", paypal_client_id: "", paypal_mode: "sandbox", stripe_publishable_key: "", stripe_account_email: "" });
  const [pp, setPp] = useState("");
  const [sk, setSk] = useState("");
  useEffect(() => { if (settings.data) setF(settings.data); }, [settings.data]);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("platform_settings").update(f).eq("id", 1);
    if (error) { toast.error(error.message); return; }
    try {
      if (pp) await savePaymentSecret({ data: { provider: "paypal", secret: pp } });
      if (sk) await savePaymentSecret({ data: { provider: "stripe", secret: sk } });
    } catch (err) { toast.error((err as Error).message); return; }
    setPp(""); setSk("");
    toast.success("Payment accounts saved");
    qc.invalidateQueries({ queryKey: ["pay-secrets"] });
  };

  return (
    <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
      <Card className="space-y-3 p-5 shadow-card">
        <h3 className="font-bold">PayPal</h3>
        <div><Label>PayPal account email</Label><Input type="email" value={f.paypal_email} onChange={set("paypal_email")} /></div>
        <div><Label>Client ID</Label><Input value={f.paypal_client_id} onChange={set("paypal_client_id")} /></div>
        <div><Label>Secret {status.data?.paypal && <Badge variant="secondary" className="ml-1">Saved</Badge>}</Label><Input type="password" placeholder={status.data?.paypal ? "Leave empty to keep" : ""} value={pp} onChange={(e) => setPp(e.target.value)} /></div>
        <div><Label>Mode</Label>
          <Select value={f.paypal_mode} onValueChange={(v) => setF({ ...f, paypal_mode: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="sandbox">Test (sandbox)</SelectItem><SelectItem value="live">Live</SelectItem></SelectContent>
          </Select>
        </div>
      </Card>
      <Card className="space-y-3 p-5 shadow-card">
        <h3 className="font-bold">Stripe</h3>
        <div><Label>Stripe account email</Label><Input type="email" value={f.stripe_account_email} onChange={set("stripe_account_email")} /></div>
        <div><Label>Publishable key</Label><Input placeholder="pk_…" value={f.stripe_publishable_key} onChange={set("stripe_publishable_key")} /></div>
        <div><Label>Secret key {status.data?.stripe && <Badge variant="secondary" className="ml-1">Saved</Badge>}</Label><Input type="password" placeholder={status.data?.stripe ? "Leave empty to keep" : "sk_…"} value={sk} onChange={(e) => setSk(e.target.value)} /></div>
      </Card>
      <div className="md:col-span-2 space-y-2">
        <p className="text-sm text-muted-foreground">Secret keys are hidden once saved and only used by the server. These accounts receive platform money only (trip unlocks, sponsor fees, subscriptions), never trip payments.</p>
        <Button>Save payment accounts</Button>
      </div>
    </form>
  );
}

export function SuperAdmins({ myId }: { myId: string }) {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["super-admins"], queryFn: async () => (await supabase.rpc("list_super_admins")).data ?? [] });
  const [email, setEmail] = useState("");
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.rpc("grant_super_admin", { _email: email });
    if (error) { toast.error(error.message); return; }
    setEmail(""); toast.success("Admin added");
    qc.invalidateQueries({ queryKey: ["super-admins"] });
  };
  const remove = async (id: string) => {
    const { error } = await supabase.rpc("revoke_super_admin", { _user: id });
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["super-admins"] });
  };
  return (
    <Card className="max-w-xl space-y-4 p-5 shadow-card">
      <h3 className="font-bold">Platform admins</h3>
      <ul className="divide-y">
        {(list.data ?? []).map((a) => (
          <li key={a.user_id} className="flex items-center gap-2 py-2">
            <span className="flex-1">{a.email}</span>
            {a.user_id === myId ? <Badge variant="secondary">You</Badge> : <Button size="icon" variant="ghost" aria-label="Remove admin" onClick={() => remove(a.user_id)}><Trash2 className="h-4 w-4" /></Button>}
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="flex gap-2">
        <Input type="email" required placeholder="Email of an existing account" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button>Make admin</Button>
      </form>
    </Card>
  );
}
