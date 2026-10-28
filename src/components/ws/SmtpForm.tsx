import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { hasSmtpPassword, saveSmtpPassword, sendTestEmail } from "@/lib/smtp.functions";

export type SmtpFields = {
  smtp_host: string | null; smtp_port: number | null; smtp_secure: string;
  smtp_user: string | null; smtp_from_name: string | null; smtp_from_email: string | null;
};

export function SmtpForm({ companyId, initial, onSave }: { companyId: string | null; initial: SmtpFields; onSave: (f: SmtpFields) => Promise<string | null> }) {
  const [f, setF] = useState<SmtpFields>(initial);
  const [password, setPassword] = useState("");
  const [saved, setSaved] = useState(false);
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);
  const savePw = useServerFn(saveSmtpPassword);
  const hasPw = useServerFn(hasSmtpPassword);
  const test = useServerFn(sendTestEmail);

  useEffect(() => { hasPw({ data: { companyId } }).then((r) => setSaved(r.saved)).catch(() => {}); }, [companyId, hasPw]);

  const set = (k: keyof SmtpFields, v: string | number) => setF((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setBusy(true);
    try {
      const err = await onSave(f);
      if (err) throw new Error(err);
      if (password) { await savePw({ data: { companyId, password } }); setPassword(""); setSaved(true); }
      toast.success("Mail settings saved");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not save"); }
    setBusy(false);
  };
  const runTest = async () => {
    setBusy(true);
    try {
      const r = await test({ data: { companyId, to } });
      if (r.ok) toast.success(`Test email sent to ${to}`); else toast.error(r.error ?? "Test failed");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Test failed"); }
    setBusy(false);
  };

  return (
    <Card className="space-y-4 p-6 shadow-card">
      <div>
        <h3 className="font-bold">Mail server</h3>
        <p className="text-sm text-muted-foreground">Use port 465 (secure) or 587 (STARTTLS). Gmail needs an app password.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><Label>Server</Label><Input placeholder="smtp.gmail.com" value={f.smtp_host ?? ""} onChange={(e) => set("smtp_host", e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Port</Label><Input type="number" value={f.smtp_port ?? 465} onChange={(e) => set("smtp_port", Number(e.target.value))} /></div>
          <div><Label>Security</Label>
            <Select value={f.smtp_secure} onValueChange={(v) => set("smtp_secure", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="tls">SSL/TLS</SelectItem><SelectItem value="starttls">STARTTLS</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
        <div><Label>Username</Label><Input value={f.smtp_user ?? ""} onChange={(e) => set("smtp_user", e.target.value)} /></div>
        <div><Label>Password {saved && <span className="text-xs text-muted-foreground">(saved — leave blank to keep)</span>}</Label>
          <Input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <div><Label>From name</Label><Input value={f.smtp_from_name ?? ""} onChange={(e) => set("smtp_from_name", e.target.value)} /></div>
        <div><Label>From email</Label><Input type="email" value={f.smtp_from_email ?? ""} onChange={(e) => set("smtp_from_email", e.target.value)} /></div>
      </div>
      <Button onClick={save} disabled={busy}>Save mail settings</Button>
      <div className="flex flex-wrap items-end gap-2 border-t pt-4">
        <div className="flex-1"><Label>Send a test email to</Label><Input type="email" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        <Button variant="outline" onClick={runTest} disabled={busy || !to}>Send test</Button>
      </div>
    </Card>
  );
}
