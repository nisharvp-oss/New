import { useState } from "react";
import { Check, ChevronsUpDown, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { countryName, flag, searchCountries } from "@/lib/countries";
import { cn } from "@/lib/utils";

/**
 * Searchable country list with flags. With `multiple`, the list stays open and each pick toggles a
 * country; otherwise a pick closes it.
 */
export function CountryPicker({ selected, onToggle, multiple = false, placeholder = "Choose a country", className }: {
  selected: string[];
  onToggle: (code: string) => void;
  multiple?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const results = searchCountries(query);
  const single = !multiple && selected[0];

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setQuery(""); }}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className={cn("h-14 w-full justify-between rounded-2xl px-4 text-base font-medium", className)}>
          <span className="flex min-w-0 items-center gap-3">
            {single ? <span className="text-2xl leading-none" aria-hidden>{flag(single)}</span> : <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent text-primary"><Globe2 className="h-4 w-4" /></span>}
            <span className="truncate">{single ? countryName(single) : multiple && selected.length ? `${selected.length} countr${selected.length === 1 ? "y" : "ies"}` : placeholder}</span>
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-64 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search country or code (e.g. AE)" value={query} onValueChange={setQuery} />
          <CommandList className="max-h-80">
            <CommandEmpty>No country matches "{query}".</CommandEmpty>
            {results.length > 0 && (
              <CommandGroup>
                {results.map((c) => {
                  const on = selected.includes(c.code);
                  return (
                    <CommandItem key={c.code} value={c.code} onSelect={() => { onToggle(c.code); if (!multiple) { setOpen(false); setQuery(""); } }} className="gap-3 py-2.5">
                      <span className="text-xl leading-none" aria-hidden>{flag(c.code)}</span>
                      <span className="min-w-0 flex-1 truncate font-medium">{c.name}</span>
                      {on ? <Check className="h-4 w-4 text-primary" /> : <span className="text-xs text-muted-foreground">{c.code}</span>}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
