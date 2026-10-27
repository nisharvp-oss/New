import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Circle, FileText, Plane, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { must } from "@/lib/must";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Traveler = { id: string; name: string };
type Doc = { id: string; traveler_id: string; kind: string; title: string; path: string; uploaded_by: string; created_at: string };

const useTravelerList = (tripId: string) =>
  useQuery({ queryKey: ["travelers", tripId], queryFn: async () => (await must(supabase.from("trip_travelers").select("*").eq("trip_id", tripId).order("created_at"))) ?? [] });

/* ---------- check-ins (staff) ---------- */
export function StaffCheckins({ tripId }: { tripId: string }) {
  const qc = useQueryClient();
  const travelers = useTravelerList(tripId);
  const checkins = useQuery({ queryKey: ["checkins", tripId], refetchInterval: 5000, queryFn: async () => (await must(supabase.from("trip_checkins").select("*").eq("trip_id", tripId).order("created_at"))) ?? [] });
  const checkpoints = [...new Set((checkins.data ?? []).map((c) => c.checkpoint))];
  const [current, setCurrent] = useState("");
  const [newName, setNewName] = useState("");
  const active = current || checkpoints[checkpoints.length - 1] || "";
  const here = new Map((checkins.data ?? []).filter((c) => c.checkpoint === active).map((c) => [c.traveler_id, c]));
  const refresh = () => qc.invalidateQueries({ queryKey: ["checkins", tripId] });

  const toggle = async (travelerId: string) => {
    const existing = here.get(travelerId);
    if (existing) {
      const { error } = await supabase.from("trip_checkins").delete().eq("id", existing.id);
      if (error) toast.error(error.message);
    } else {
      const { data: u } = await supabase.auth.getUser();
      const { data: p } = await supabase.from("profiles").select("full_name,email").eq("id", u.user!.id).single();
      const { error } = await supabase.from("trip_checkins").insert({ trip_id: tripId, traveler_id: travelerId, checkpoint: active, checked_by_name: p?.full_name || p?.email || "" });
      if (error) toast.error(error.message);
    }
    refresh();
  };
  const total = travelers.data?.length ?? 0;

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-end gap-2 p-4 shadow-card">
        <div className="min-w-48 flex-1">
          <Label>Checkpoint</Label>
          <Select value={active} onValueChange={setCurrent}>
            <SelectTrigger><SelectValue placeholder="Start a checkpoint first" /></SelectTrigger>
            <SelectContent>{checkpoints.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <form className="flex flex-1 gap-2" onSubmit={(e) => { e.preventDefault(); if (newName.trim()) { setCurrent(newName.trim()); setNewName(""); } }}>
          <Input placeholder="New checkpoint, e.g. Day 2 bus 08:00" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Button>Start</Button>
        </form>
      </Card>
      {active ? (
        <Card className="divide-y shadow-card">
          <div className="flex items-center justify-between p-3">
            <p className="font-bold">{active}</p>
            <Badge variant={here.size === total && total > 0 ? "default" : "secondary"}>{here.size}/{total} checked in</Badge>
          </div>
          {travelers.data?.map((t) => {
            const c = here.get(t.id);
            return (
              <button key={t.id} type="button" onClick={() => toggle(t.id)} className="flex w-full items-center gap-3 p-3 text-left hover:bg-muted">
                {c ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                <span className="flex-1">{t.name}</span>
                {c && <span className="text-xs text-muted-foreground">{c.checked_by_name} · {new Date(c.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
              </button>
            );
          })}
          {total === 0 && <p className="p-4 text-muted-foreground">Add travelers first.</p>}
        </Card>
      ) : <p className="text-muted-foreground">Start a checkpoint to take a roll call. Every organiser and caretaker sees the same list live.</p>}
    </div>
  );
}

/* ---------- documents ---------- */
async function openDoc(path: string) {
  const { data, error } = await supabase.storage.from("trip-docs").createSignedUrl(path, 300);
  if (error || !data) { toast.error("Couldn't open file"); return; }
  window.open(data.signedUrl, "_blank", "noopener");
}

async function upload(tripId: string, travelerId: string, file: File, title: string, kind: "document" | "boarding_pass") {
  const safe = file.name.replace(/[^\w.-]+/g, "_").slice(-80);
  const path = `${tripId}/${crypto.randomUUID()}-${safe}`;
  const up = await supabase.storage.from("trip-docs").upload(path, file);
  if (up.error) return up.error.message;
  const { error } = await supabase.from("trip_documents").insert({ trip_id: tripId, traveler_id: travelerId, kind, title: title || file.name, path });
  if (error) { await supabase.storage.from("trip-docs").remove([path]); return error.message; }
  return null;
}

function DocRow({ d, who, canDelete, onDelete }: { d: Doc; who?: string | undefined; canDelete: boolean; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-3 p-3 text-sm">
      {d.kind === "boarding_pass" ? <Plane className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
      <button type="button" className="flex-1 truncate text-left font-medium underline-offset-2 hover:underline" onClick={() => openDoc(d.path)}>{d.title}</button>
      {who && <span className="text-muted-foreground">{who}</span>}
      <Badge variant={d.kind === "boarding_pass" ? "default" : "secondary"}>{d.kind === "boarding_pass" ? "Boarding pass" : "Document"}</Badge>
      {canDelete && <Button size="icon" variant="ghost" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>}
    </div>
  );
}

async function removeDoc(d: Doc) {
  await supabase.storage.from("trip-docs").remove([d.path]);
  const { error } = await supabase.from("trip_documents").delete().eq("id", d.id);
  if (error) toast.error(error.message);
}

export function StaffDocuments({ tripId }: { tripId: string }) {
  const qc = useQueryClient();
  const travelers = useTravelerList(tripId);
  const docs = useQuery({ queryKey: ["docs", tripId], queryFn: async () => ((await must(supabase.from("trip_documents").select("*").eq("trip_id", tripId).order("created_at", { ascending: false }))) ?? []) as Doc[] });
  const [f, setF] = useState({ traveler: "", title: "", kind: "boarding_pass" as "document" | "boarding_pass" });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("all");
  const name = (id: string) => (travelers.data as Traveler[] | undefined)?.find((t) => t.id === id)?.name;
  const refresh = () => qc.invalidateQueries({ queryKey: ["docs", tripId] });
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !f.traveler) { toast.error("Pick a traveler and a file"); return; }
    setBusy(true);
    const err = await upload(tripId, f.traveler, file, f.title, f.kind);
    setBusy(false);
    if (err) { toast.error(err); return; }
    toast.success(f.kind === "boarding_pass" ? `Boarding pass sent to ${name(f.traveler)}` : "Document added");
    setF({ ...f, title: "" }); setFile(null); (e.target as HTMLFormElement).reset(); refresh();
  };
  const shown = (docs.data ?? []).filter((d) => filter === "all" || d.traveler_id === filter);
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <div className="space-y-2">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-60"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All travelers</SelectItem>{travelers.data?.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
        </Select>
        <Card className="divide-y shadow-card">
          {shown.map((d) => <DocRow key={d.id} d={d} who={name(d.traveler_id)} canDelete onDelete={async () => { await removeDoc(d); refresh(); }} />)}
          {shown.length === 0 && <p className="p-4 text-muted-foreground">No documents yet.</p>}
        </Card>
      </div>
      <Card className="h-fit p-4 shadow-card">
        <form onSubmit={send} className="space-y-3">
          <h3 className="flex items-center gap-2 font-bold"><Upload className="h-4 w-4" /> Send a file to a traveler</h3>
          <div><Label>Traveler</Label><Select value={f.traveler} onValueChange={(v) => setF({ ...f, traveler: v })}><SelectTrigger><SelectValue placeholder="Choose…" /></SelectTrigger><SelectContent>{travelers.data?.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Type</Label><Select value={f.kind} onValueChange={(v) => setF({ ...f, kind: v as "document" | "boarding_pass" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="boarding_pass">Boarding pass</SelectItem><SelectItem value="document">Other document</SelectItem></SelectContent></Select></div>
          <div><Label>Title</Label><Input placeholder="e.g. Flight LH 902 · Seat 14B" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
          <div><Label>File (PDF or image, max 10 MB)</Label><Input type="file" accept="application/pdf,image/*,.pkpass" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
          <Button className="w-full" disabled={busy}>{busy ? "Uploading…" : "Send"}</Button>
        </form>
      </Card>
    </div>
  );
}

export function TravelerDocuments({ tripId, travelerId }: { tripId: string; travelerId: string }) {
  const qc = useQueryClient();
  const docs = useQuery({ queryKey: ["mydocs", travelerId], queryFn: async () => ((await must(supabase.from("trip_documents").select("*").eq("traveler_id", travelerId).order("created_at", { ascending: false }))) ?? []) as Doc[] });
  const checkins = useQuery({ queryKey: ["mycheckins", travelerId], queryFn: async () => (await must(supabase.from("trip_checkins").select("*").eq("traveler_id", travelerId).order("created_at", { ascending: false }))) ?? [] });
  const [uid, setUid] = useState<string | null>(null);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUid(data.user?.id ?? null)); }, []);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ["mydocs", travelerId] });
  const passes = (docs.data ?? []).filter((d) => d.kind === "boarding_pass");
  const others = (docs.data ?? []).filter((d) => d.kind !== "boarding_pass");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    const err = await upload(tripId, travelerId, file, title, "document");
    setBusy(false);
    if (err) { toast.error(err); return; }
    toast.success("Uploaded — your organisers can now see it");
    setTitle(""); setFile(null); (e.target as HTMLFormElement).reset(); refresh();
  };
  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 font-bold">Boarding passes</h3>
        <Card className="divide-y shadow-card">
          {passes.map((d) => <DocRow key={d.id} d={d} canDelete={false} onDelete={() => {}} />)}
          {passes.length === 0 && <p className="p-4 text-muted-foreground">Your organiser will send them here.</p>}
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div>
          <h3 className="mb-2 font-bold">My documents</h3>
          <Card className="divide-y shadow-card">
            {others.map((d) => <DocRow key={d.id} d={d} canDelete={d.uploaded_by === uid} onDelete={async () => { await removeDoc(d); refresh(); }} />)}
            {others.length === 0 && <p className="p-4 text-muted-foreground">Upload your passport, visa or insurance so organisers have them on hand.</p>}
          </Card>
        </div>
        <Card className="h-fit p-4 shadow-card">
          <form onSubmit={submit} className="space-y-3">
            <h3 className="font-bold">Upload a document</h3>
            <div><Label>Title</Label><Input placeholder="e.g. Passport" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div><Label>File (max 10 MB)</Label><Input type="file" required accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
            <Button className="w-full" disabled={busy || !file}>{busy ? "Uploading…" : "Upload"}</Button>
          </form>
        </Card>
      </div>
      {(checkins.data?.length ?? 0) > 0 && (
        <div>
          <h3 className="mb-2 font-bold">My check-ins</h3>
          <Card className="divide-y shadow-card">{checkins.data!.map((c) => (
            <div key={c.id} className="flex items-center gap-2 p-3 text-sm"><CheckCircle2 className="h-4 w-4 text-primary" /><span className="flex-1">{c.checkpoint}</span><span className="text-muted-foreground">{new Date(c.created_at).toLocaleString()}</span></div>
          ))}</Card>
        </div>
      )}
    </div>
  );
}
