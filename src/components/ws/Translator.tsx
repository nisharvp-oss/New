import { useEffect, useState } from "react";
import { ArrowRight, Copy, ExternalLink, Languages, Loader2, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { googleTranslateUrl, languageByCode, LANGUAGES, PHRASEBOOK, PHRASES, phrasebookLanguages } from "@/lib/translate";

// Chrome's built-in, on-device Translator and LanguageDetector APIs (not in TypeScript's DOM types yet).
type Availability = "unavailable" | "downloadable" | "downloading" | "available";
type TranslatorApi = {
  availability: (o: { sourceLanguage: string; targetLanguage: string }) => Promise<Availability>;
  create: (o: { sourceLanguage: string; targetLanguage: string }) => Promise<{ translate: (t: string) => Promise<string>; destroy?: () => void }>;
};
type DetectorApi = { create: () => Promise<{ detect: (t: string) => Promise<{ detectedLanguage: string; confidence: number }[]> }> };
const builtIn = () => (typeof self !== "undefined" ? (self as unknown as { Translator?: TranslatorApi; LanguageDetector?: DetectorApi }) : {});

/** Voices this device can speak in, so "Listen" only shows where it will sound right. */
function useVoices() {
  const [langs, setLangs] = useState<string[]>([]);
  useEffect(() => {
    if (typeof speechSynthesis === "undefined") return;
    const load = () => setLangs(speechSynthesis.getVoices().map((v) => v.lang.toLowerCase()));
    load();
    speechSynthesis.addEventListener("voiceschanged", load);
    return () => speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);
  return (code: string) => langs.some((l) => l.startsWith(code));
}

function speak(text: string, code: string) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = languageByCode(code)?.speech ?? code;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

const copy = (text: string) => navigator.clipboard.writeText(text).then(() => toast.success("Copied"), () => toast.error("Couldn't copy"));

/** Free translator: on-device in browsers that have one, otherwise Google Translate with the text filled in. */
export function Translator() {
  const [text, setText] = useState("");
  const [from, setFrom] = useState("auto");
  const [to, setTo] = useState("ar");
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [onDevice, setOnDevice] = useState(false);
  const canSpeak = useVoices();

  useEffect(() => { setOnDevice(Boolean(builtIn().Translator)); }, []);
  useEffect(() => { setResult(null); }, [text, from, to]);

  const openGoogle = () => window.open(googleTranslateUrl(text.trim(), to, from), "_blank", "noopener,noreferrer");

  const translate = async () => {
    const t = text.trim();
    if (!t) return;
    const { Translator: api, LanguageDetector } = builtIn();
    if (!api) { openGoogle(); return; }
    setBusy(true);
    try {
      let source = from;
      if (source === "auto") {
        const top = LanguageDetector ? (await (await LanguageDetector.create()).detect(t))[0] : undefined;
        source = top && top.confidence > 0.5 ? top.detectedLanguage.split("-")[0]! : "en";
      }
      if (source === to) { setResult(t); return; }
      if ((await api.availability({ sourceLanguage: source, targetLanguage: to })) === "unavailable") { openGoogle(); return; }
      const translator = await api.create({ sourceLanguage: source, targetLanguage: to });
      setResult(await translator.translate(t));
      translator.destroy?.();
    } catch {
      openGoogle();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <Select value={from} onValueChange={setFrom}>
            <SelectTrigger aria-label="Translate from" className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="auto">Detect language</SelectItem>{LANGUAGES.map((l) => <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>)}</SelectContent>
          </Select>
          <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden />
          <Select value={to} onValueChange={setTo}>
            <SelectTrigger aria-label="Translate to" className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Type what you want to say" rows={3} className="rounded-2xl text-base" maxLength={2000} />
        <Button className="w-full rounded-2xl" size="lg" disabled={!text.trim() || busy} onClick={translate}>
          {busy ? <Loader2 className="animate-spin" /> : onDevice ? <Languages /> : <ExternalLink />}
          {onDevice ? "Translate" : "Translate with Google Translate"}
        </Button>
        {result !== null && (
          <div className="rounded-2xl bg-accent p-4" dir="auto">
            <p className="text-xl font-semibold leading-snug" lang={to}>{result}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {canSpeak(to) && <Button size="sm" variant="outline" onClick={() => speak(result, to)}><Volume2 /> Listen</Button>}
              <Button size="sm" variant="outline" onClick={() => copy(result)}><Copy /> Copy</Button>
              <Button size="sm" variant="ghost" onClick={openGoogle}>Check in Google Translate <ExternalLink /></Button>
            </div>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {onDevice ? "Translated on this device, so your text stays private." : "Opens Google Translate (or its app) with your text filled in."}
        </p>
      </div>
      <Phrasebook canSpeak={canSpeak} />
    </div>
  );
}

function Phrasebook({ canSpeak }: { canSpeak: (code: string) => boolean }) {
  const langs = phrasebookLanguages();
  const [code, setCode] = useState(langs[0]!.code);
  const [shown, setShown] = useState<number | null>(null);
  const phrases = PHRASEBOOK[code]!;

  return (
    <div className="border-t pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold">Phrasebook</h3>
          <p className="text-sm text-muted-foreground">Works offline. Tap a phrase to show it in large text.</p>
        </div>
        <Select value={code} onValueChange={setCode}>
          <SelectTrigger aria-label="Phrasebook language" className="h-10 w-48 rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>{langs.map((l) => <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <ul className="mt-3 divide-y rounded-2xl border">
        {PHRASES.map((p, i) => (
          <li key={p} className="flex items-center gap-2 pr-2">
            <button type="button" onClick={() => setShown(i)} className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-xl px-4 py-3 text-left hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span className="text-sm text-muted-foreground">{p}</span>
              <span className="truncate font-semibold" lang={code} dir="auto">{phrases[i]}</span>
            </button>
            {canSpeak(code) && <Button size="icon" variant="ghost" aria-label={`Listen: ${p}`} onClick={() => speak(phrases[i]!, code)}><Volume2 /></Button>}
          </li>
        ))}
      </ul>
      <Drawer open={shown !== null} onOpenChange={(v) => !v && setShown(null)}>
        <DrawerContent>
          {shown !== null && (
            <div className="mx-auto w-full max-w-xl px-4 pb-safe">
              <DrawerHeader className="px-0">
                <DrawerTitle className="sr-only">{PHRASES[shown]}</DrawerTitle>
                <DrawerDescription>{PHRASES[shown]}</DrawerDescription>
              </DrawerHeader>
              <p className="py-6 text-center text-[clamp(2rem,9vw,3.5rem)] font-extrabold leading-tight" lang={code} dir="auto">{phrases[shown]}</p>
              <div className="flex justify-center gap-2 pb-6">
                {canSpeak(code) && <Button variant="outline" onClick={() => speak(phrases[shown]!, code)}><Volume2 /> Listen</Button>}
                <Button variant="outline" onClick={() => setShown(null)}>Done</Button>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
