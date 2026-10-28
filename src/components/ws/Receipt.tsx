import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, ImageUp, Loader2, Receipt as ReceiptIcon, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { prepareReceipt } from "@/lib/image-upload";

export const RECEIPTS_BUCKET = "receipts";

/** Uploads a prepared receipt under {tripId}/{folder}/ and returns its storage path. */
export async function uploadReceipt(tripId: string, folder: string, blob: Blob) {
  const path = `${tripId}/${folder}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from(RECEIPTS_BUCKET).upload(path, blob, { contentType: "image/jpeg", upsert: false });
  if (error) throw new Error(error.message);
  return path;
}

export const removeReceipt = (path: string | null | undefined) =>
  path ? supabase.storage.from(RECEIPTS_BUCKET).remove([path]).then(() => undefined, () => undefined) : Promise.resolve();

/** "Take photo" (opens the camera on phones) or "Upload"; the photo is shrunk to 50 KB on the device. */
export function ReceiptInput({ value, onChange }: { value: Blob | null; onChange: (b: Blob | null) => void }) {
  const camera = useRef<HTMLInputElement>(null);
  const files = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const preview = useMemo(() => (value ? URL.createObjectURL(value) : null), [value]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try { onChange(await prepareReceipt(file)); } catch (err) { toast.error((err as Error).message); } finally { setBusy(false); }
  };

  if (value && preview) {
    return (
      <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-2">
        <img src={preview} alt="Receipt" className="h-14 w-14 rounded-lg object-cover" />
        <p className="flex-1 text-sm"><span className="font-medium">Receipt added</span><br /><span className="text-muted-foreground">{Math.max(1, Math.round(value.size / 1024))} KB</span></p>
        <Button type="button" size="icon" variant="ghost" aria-label="Remove receipt" onClick={() => onChange(null)}><X /></Button>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      <input ref={camera} type="file" accept="image/*" capture="environment" className="hidden" onChange={pick} />
      <input ref={files} type="file" accept="image/*" className="hidden" onChange={pick} />
      <Button type="button" variant="outline" disabled={busy} onClick={() => camera.current?.click()}>{busy ? <Loader2 className="animate-spin" /> : <Camera />} Take photo</Button>
      <Button type="button" variant="outline" disabled={busy} onClick={() => files.current?.click()}><ImageUp /> Upload</Button>
    </div>
  );
}

/** Small button that shows a stored receipt in a dialog, through a short-lived signed link. */
export function ReceiptButton({ path, label = "Receipt" }: { path: string; label?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const open = async () => {
    const { data, error } = await supabase.storage.from(RECEIPTS_BUCKET).createSignedUrl(path, 300);
    if (error || !data) { toast.error("Couldn't open the receipt"); return; }
    setUrl(data.signedUrl);
  };
  return (
    <>
      <Button type="button" size="icon" variant="ghost" aria-label={`View ${label.toLowerCase()}`} onClick={open}><ReceiptIcon /></Button>
      <Dialog open={url !== null} onOpenChange={(v) => !v && setUrl(null)}>
        <DialogContent className="max-w-md p-3">
          <DialogTitle className="sr-only">{label}</DialogTitle>
          {url && <img src={url} alt={label} className="max-h-[75vh] w-full rounded-lg object-contain" />}
        </DialogContent>
      </Dialog>
    </>
  );
}
