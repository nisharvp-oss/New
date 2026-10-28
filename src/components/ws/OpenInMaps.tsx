import { useEffect, useState } from "react";
import { Copy, MapPin, Navigation, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { detectPlatform, mapLinks, shareText, type Place } from "@/lib/maps";
import { cn } from "@/lib/utils";

/**
 * Opens a location in the person's own maps or navigation app (their choice), or shares it through
 * any messaging app. Uses each app's public link format, so no paid maps service is involved.
 */
export function OpenInMaps({ place, label = "Open location", className, variant = "outline" }: {
  place: Place; label?: string; className?: string; variant?: "outline" | "secondary" | "default";
}) {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<"android" | "ios" | "other">("other");
  useEffect(() => setPlatform(detectPlatform(navigator.userAgent)), []);
  const apps = mapLinks(place, platform);
  // Apple Maps first on iPhones, where it's always installed.
  if (platform === "ios") apps.sort((a, b) => (a.id === "apple" ? -1 : b.id === "apple" ? 1 : 0));

  const share = async () => {
    const text = shareText(place);
    try {
      if (navigator.share) await navigator.share({ title: place.label ?? "Location", text });
      else { await navigator.clipboard.writeText(text); toast.success("Location link copied"); }
    } catch { /* closed the share sheet */ }
  };
  const copy = async () => {
    await navigator.clipboard.writeText(`${place.lat.toFixed(6)}, ${place.lng.toFixed(6)}`);
    toast.success("Coordinates copied");
  };

  return (
    <>
      <Button size="sm" variant={variant} className={className} onClick={() => setOpen(true)}><MapPin /> {label}</Button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="pb-safe">
          <div className="mx-auto w-full max-w-md space-y-4 px-4 pb-6 pt-2">
            <div>
              <DrawerTitle className="text-lg font-bold">{place.label ? `${place.label}'s location` : "Open location"}</DrawerTitle>
              <DrawerDescription className="font-board text-xs">{place.lat.toFixed(5)}, {place.lng.toFixed(5)}</DrawerDescription>
            </div>
            <div className="space-y-2">
              {apps.map((a) => (
                <a key={a.id} href={a.url} target={a.id === "device" ? undefined : "_blank"} rel="noopener noreferrer" onClick={() => setOpen(false)}
                  className={cn("flex h-12 items-center gap-3 rounded-xl border px-4 font-semibold transition-colors hover:bg-muted", a.id === "device" && "border-primary bg-accent text-primary")}>
                  <Navigation className="h-4 w-4" /> {a.name}
                </a>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={share}><Share2 /> Share</Button>
              <Button variant="secondary" onClick={copy}><Copy /> Copy coordinates</Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
