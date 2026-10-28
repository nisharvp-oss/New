-- Pricing: Free Zone, Pay as you go, Organiser, Business, Enterprise.
-- Free Zone and Pay as you go are personal trips (free up to N travelers, then a one-time unlock);
-- Organiser, Business and Enterprise are company plans. Super admins can change all of it later.

ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS ad_free boolean NOT NULL DEFAULT false;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS contact_sales boolean NOT NULL DEFAULT false;

ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS trip_unlock_max_travelers integer NOT NULL DEFAULT 100;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS sales_email text NOT NULL DEFAULT '';

-- Retire the original plans (companies already on them keep them) and add the new line-up.
UPDATE public.plans SET is_active = false WHERE is_active;
INSERT INTO public.plans (name, description, price, billing_interval, max_trips, max_organisers, max_travelers_per_trip, features, sort_order, ad_free, contact_sales) VALUES
 ('Organiser', 'For organisers running trips through the year', 35, 'month', 15, NULL, 100,
   array['Every feature in the app','Your own organisers and caretakers','Trip emails sent from your own address'], 1, false, false),
 ('Business', 'For travel companies with a full season', 50, 'month', 25, NULL, 100,
   array['Everything in Organiser','Ad-free: no sponsors on your trips'], 2, true, false),
 ('Enterprise', 'For large operators and agencies', 0, 'month', NULL, NULL, NULL,
   array['Custom trip and traveler limits','Volume pricing for large groups'], 3, true, true);

-- Plan trip limits are per year: count trips created in the last 12 months.
CREATE OR REPLACE FUNCTION public.enforce_trip_limit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
declare lim int; cnt int;
begin
  select p.max_trips into lim from public.companies c left join public.plans p on p.id = c.plan_id where c.id = new.company_id;
  if lim is null then return new; end if;
  select count(*) into cnt from public.trips where company_id = new.company_id and created_at > now() - interval '1 year';
  if cnt >= lim then raise exception 'Your plan allows % trips a year. Upgrade to add more.', lim; end if;
  return new;
end $$;

-- Pay as you go: an unlocked personal trip takes up to trip_unlock_max_travelers.
CREATE OR REPLACE FUNCTION public.enforce_traveler_limit()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare lim int; seats int; cnt int; k text; unl boolean; free_lim int; paid_lim int;
begin
  select p.max_travelers_per_trip, t.seats, c.kind, t.unlocked into lim, seats, k, unl
    from public.trips t join public.companies c on c.id = t.company_id left join public.plans p on p.id = c.plan_id where t.id = new.trip_id;
  select count(*) into cnt from public.trip_travelers where trip_id = new.trip_id;
  if k = 'personal' then
    lim := null;
    select free_trip_travelers, trip_unlock_max_travelers into free_lim, paid_lim from public.platform_settings where id = 1;
    if not unl and cnt >= coalesce(free_lim, 10) then
      raise exception 'Free trips allow % travelers. Unlock this trip to add more.', coalesce(free_lim, 10);
    end if;
    if unl and cnt >= coalesce(paid_lim, 100) then
      raise exception 'Unlocked trips allow up to % travelers. Contact us for larger groups.', coalesce(paid_lim, 100);
    end if;
  end if;
  if lim is not null and cnt >= lim then raise exception 'Your plan allows % travelers per trip.', lim; end if;
  if seats is not null and cnt >= seats then raise exception 'This trip is full (% seats).', seats; end if;
  new.email := lower(trim(new.email));
  select id into new.user_id from auth.users where lower(email) = new.email;
  return new;
end $function$;

-- Sponsors appear on free personal trips and on company trips whose plan isn't ad-free.
CREATE OR REPLACE FUNCTION public.trip_shows_sponsors(_trip uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from public.trips t
      join public.companies c on c.id = t.company_id
      left join public.plans p on p.id = c.plan_id
    where t.id = _trip
      and ((c.kind = 'personal' and not t.unlocked) or (c.kind <> 'personal' and not coalesce(p.ad_free, false))))
$function$;
GRANT EXECUTE ON FUNCTION public.trip_shows_sponsors(uuid) TO authenticated;

-- Public pricing terms for the landing page (signed-out visitors can't read platform_settings).
CREATE OR REPLACE FUNCTION public.public_pricing_terms()
 RETURNS TABLE(free_travelers integer, unlock_price numeric, unlock_max_travelers integer, currency text, sales_email text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  select free_trip_travelers, trip_unlock_price, trip_unlock_max_travelers, currency, sales_email from public.platform_settings where id = 1
$function$;
GRANT EXECUTE ON FUNCTION public.public_pricing_terms() TO anon, authenticated;
