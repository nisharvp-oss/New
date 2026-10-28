import { useState } from "react";
import { ChevronsUpDown, ExternalLink, Plane, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AIRLINES, checkinSearchUrl, searchAirlines, type Airline } from "@/lib/airlines";

const open = (url: string) => window.open(url, "_blank", "noopener,noreferrer");

/** Pick an airline (search by name, code or country) and go straight to its online check-in page. */
export function AirlineCheckin() {
  const [openList, setOpenList] = useState(false);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Airline | null>(null);
  const results = searchAirlines(query);

  const choose = (a: Airline) => {
    setPicked(a);
    setOpenList(false);
    open(a.url);
  };

  return (
    <div className="space-y-3">
      <Popover open={openList} onOpenChange={setOpenList}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={openList} className="h-14 w-full justify-between rounded-2xl px-4 text-base font-medium">
            <span className="flex min-w-0 items-center gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent text-primary"><Plane className="h-4 w-4" /></span>
              <span className="truncate">{picked ? picked.name : "Choose your airline"}</span>
            </span>
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput placeholder="Search airline, code or country (e.g. EK)" value={query} onValueChange={setQuery} />
            <CommandList className="max-h-80">
              <CommandEmpty>
                <div className="space-y-3 px-3 py-2 text-left">
                  <p className="text-sm text-muted-foreground">We don't list "{query}" yet.</p>
                  <Button size="sm" variant="outline" className="w-full" onClick={() => open(checkinSearchUrl(query))}>
                    <Search /> Search for its check-in page
                  </Button>
                </div>
              </CommandEmpty>
              {results.length > 0 && <CommandGroup heading={query ? `${results.length} match${results.length === 1 ? "" : "es"}` : `${AIRLINES.length} airlines`}>
                {results.map((a) => (
                  <CommandItem key={a.code} value={a.code} onSelect={() => choose(a)} className="gap-3 py-2.5">
                    <span className="w-8 shrink-0 rounded-md bg-muted py-0.5 text-center font-board text-xs font-semibold">{a.code}</span>
                    <span className="min-w-0 flex-1 truncate font-medium">{a.name}</span>
                    <span className="text-xs text-muted-foreground">{a.region}</span>
                  </CommandItem>
                ))}
              </CommandGroup>}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {picked && (
        <Button className="w-full rounded-2xl" size="lg" onClick={() => open(picked.url)}>
          Open {picked.name} check-in <ExternalLink />
        </Button>
      )}
      <p className="text-xs text-muted-foreground">Opens the airline's own website in a new tab. Have your booking reference and last name ready.</p>
    </div>
  );
}

/** "Online check-in" button for a ticket whose title has a flight number we recognise. */
export function CheckinLink({ airline, className }: { airline: Airline; className?: string }) {
  return (
    <Button size="sm" variant="outline" className={className} asChild>
      <a href={airline.url} target="_blank" rel="noopener noreferrer"><Plane /> {airline.name} check-in <ExternalLink className="opacity-60" /></a>
    </Button>
  );
}
