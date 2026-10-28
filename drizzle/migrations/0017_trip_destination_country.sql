-- The trip's destination country (ISO 3166-1 alpha-2), so a trip can show the right official visa
-- page and the eSIM / visa agency sponsors for where it goes. Optional; set by trip staff.
ALTER TABLE public.trips ADD COLUMN destination_country text CHECK (destination_country ~ '^[A-Z]{2}$');
