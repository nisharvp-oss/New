import { useEffect, useId, useState } from "react";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Camera QR scanner; the library is loaded only in the browser after the user opens it. */
export function QrScanner({ onScan, label = "Scan with camera" }: { onScan: (text: string) => void; label?: string }) {
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState("");
  const id = "qr-" + useId().replace(/:/g, "");
  useEffect(() => {
    if (!open) return;
    let scanner: { stop: () => Promise<void>; clear: () => void } | null = null;
    let stopped = false;
    setErr("");
    import("html5-qrcode").then(async ({ Html5Qrcode }) => {
      if (stopped) return;
      const s = new Html5Qrcode(id);
      scanner = s;
      try {
        await s.start({ facingMode: "environment" }, { fps: 10, qrbox: 220 }, (text) => {
          onScan(text);
          setOpen(false);
        }, () => {});
      } catch {
        setErr("Couldn't open the camera. Allow camera access and try again.");
      }
    });
    return () => {
      stopped = true;
      scanner?.stop().then(() => scanner?.clear()).catch(() => {});
    };
  }, [open, id, onScan]);
  if (!open) return <Button type="button" variant="outline" className="w-full" onClick={() => setOpen(true)}><Camera className="mr-2 h-4 w-4" />{label}</Button>;
  return (
    <div className="space-y-2">
      <div id={id} className="overflow-hidden rounded-lg bg-muted" />
      {err && <p className="text-sm text-destructive">{err}</p>}
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}><X className="mr-1 h-4 w-4" />Close camera</Button>
    </div>
  );
}
