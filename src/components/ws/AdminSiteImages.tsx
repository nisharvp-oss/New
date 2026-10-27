import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImageUp, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SITE_IMAGE_SLOTS, SITE_MEDIA_BUCKET, resolveSiteImages, type SiteImageRow, type SiteImageSlot } from "@/lib/site-images";
import { siteImagesQuery } from "@/lib/site-images.functions";

// site_images is newer than the generated database types; this is the slice of the client we use.
type SiteImagesTable = {
  upsert: (row: Omit<SiteImageRow, "updated_at"> & { updated_at: string; updated_by: string }) => PromiseLike<{ error: { message: string } | null }>;
  update: (row: Partial<SiteImageRow>) => { eq: (c: "slot", v: string) => PromiseLike<{ error: { message: string } | null }> };
  delete: () => { eq: (c: "slot", v: string) => PromiseLike<{ error: { message: string } | null }> };
};
const siteImagesTable = () => (supabase as unknown as { from: (t: "site_images") => SiteImagesTable }).from("site_images");

const MAX_EDGE = 2400;
const MAX_UPLOAD_MB = 20;

/** Scales a photo down to MAX_EDGE on its long side and re-encodes it as JPEG, so pages stay fast. */
async function prepareImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't read this image"))), "image/jpeg", 0.82));
}

export function AdminSiteImages({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const rows = useQuery(siteImagesQuery);
  const images = resolveSiteImages(rows.data ?? [], import.meta.env["VITE_SUPABASE_URL"] as string | undefined);
  const refresh = () => qc.invalidateQueries({ queryKey: siteImagesQuery.queryKey });

  return (
    <div className="space-y-4">
      <p className="max-w-2xl text-sm text-muted-foreground">
        Choose the photos people see on the home page and in the app. Changes show up for everyone within a few minutes. Use landscape photos at least 2000 px wide, except where noted.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {(Object.keys(SITE_IMAGE_SLOTS) as SiteImageSlot[]).map((slot) => (
          <SlotCard key={`${slot}:${rows.data?.find((r) => r.slot === slot)?.path ?? "default"}`} slot={slot} current={images[slot]} row={rows.data?.find((r) => r.slot === slot)} userId={userId} onChanged={refresh} />
        ))}
      </div>
    </div>
  );
}

function SlotCard({ slot, current, row, userId, onChanged }: {
  slot: SiteImageSlot; current: { src: string; alt: string; custom: boolean }; row: SiteImageRow | undefined; userId: string; onChanged: () => void;
}) {
  const def = SITE_IMAGE_SLOTS[slot];
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [alt, setAlt] = useState(row?.alt ?? "");

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Choose an image file (JPG, PNG or WebP)"); return; }
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) { toast.error(`Choose a photo under ${MAX_UPLOAD_MB} MB`); return; }
    setBusy(true);
    try {
      const blob = await prepareImage(file);
      const path = `${slot}/${Date.now()}.jpg`;
      const bucket = supabase.storage.from(SITE_MEDIA_BUCKET);
      const up = await bucket.upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000", upsert: false });
      if (up.error) throw new Error(up.error.message);
      const { error } = await siteImagesTable().upsert({ slot, path, alt, updated_at: new Date().toISOString(), updated_by: userId });
      if (error) { await bucket.remove([path]); throw new Error(error.message); }
      if (row?.path) await bucket.remove([row.path]);
      toast.success("Photo updated", { description: def.label });
      onChanged();
    } catch (e) {
      toast.error("Photo wasn't updated", { description: (e as Error).message });
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const reset = async () => {
    setBusy(true);
    const { error } = await siteImagesTable().delete().eq("slot", slot);
    if (error) toast.error(error.message);
    else {
      if (row?.path) await supabase.storage.from(SITE_MEDIA_BUCKET).remove([row.path]);
      toast.success("Back to the default photo", { description: def.label });
      onChanged();
    }
    setBusy(false);
  };

  const saveAlt = async () => {
    if (!row || alt === row.alt) return;
    const { error } = await siteImagesTable().update({ alt }).eq("slot", slot);
    if (error) toast.error(error.message); else { toast.success("Description saved"); onChanged(); }
  };

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
      <div className="relative aspect-[16/9] bg-muted">
        <img src={current.src} alt={current.alt} className="h-full w-full object-cover" />
        <Badge className="absolute left-3 top-3" variant={current.custom ? "default" : "secondary"}>{current.custom ? "Your photo" : "Default photo"}</Badge>
      </div>
      <div className="space-y-3 p-4">
        <div>
          <p className="font-semibold">{def.label}</p>
          <p className="text-sm text-muted-foreground">{def.where}{slot === "app_home" ? ". Portrait photos work best here." : "."}</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`alt-${slot}`}>Description for screen readers</Label>
          <Input id={`alt-${slot}`} value={alt} placeholder={def.alt} onChange={(e) => setAlt(e.target.value)} onBlur={saveAlt} />
        </div>
        <div className="flex flex-wrap gap-2">
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          <Button size="sm" disabled={busy} onClick={() => input.current?.click()}><ImageUp />{busy ? "Uploading…" : current.custom ? "Replace photo" : "Upload photo"}</Button>
          {current.custom && <Button size="sm" variant="outline" disabled={busy} onClick={reset}><RotateCcw />Use default</Button>}
        </div>
      </div>
    </div>
  );
}
