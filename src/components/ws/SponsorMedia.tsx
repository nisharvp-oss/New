import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { must } from "@/lib/must";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Sponsor images are either an old https link or a path in the private sponsor-media bucket. */
export function useSponsorImageUrl(value: string) {
  const isLink = /^https?:\/\//.test(value);
  const q = useQuery({
    queryKey: ["sponsor-img", value],
    enabled: !!value && !isLink,
    staleTime: 50 * 60 * 1000,
    queryFn: async () => (await must(supabase.storage.from("sponsor-media").createSignedUrl(value, 3600)))?.signedUrl ?? "",
  });
  return isLink ? value : q.data ?? "";
}

export function SponsorImage({ value, alt, className }: { value: string; alt: string; className?: string }) {
  const src = useSponsorImageUrl(value);
  if (!value || !src) return null;
  return <img src={src} alt={alt} className={className} loading="lazy" />;
}

export function SponsorImageUpload({ label, value, onChange }: { label: string; value: string; onChange: (path: string) => void }) {
  const [busy, setBusy] = useState(false);
  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Images must be under 5 MB"); return; }
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const path = `${u.user?.id}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const { error } = await supabase.storage.from("sponsor-media").upload(path, file, { contentType: file.type });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    onChange(path);
  };
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <SponsorImage value={value} alt={label} className="max-h-32 rounded-md border object-contain" />
      <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed p-2 text-sm text-muted-foreground hover:bg-muted">
        <Upload className="h-4 w-4" />{busy ? "Uploading…" : value ? "Replace image" : "Upload image (max 5 MB)"}
        <Input type="file" accept="image/*" className="hidden" onChange={upload} disabled={busy} />
      </label>
      {value && <button type="button" className="text-xs text-muted-foreground underline" onClick={() => onChange("")}>Remove</button>}
    </div>
  );
}
