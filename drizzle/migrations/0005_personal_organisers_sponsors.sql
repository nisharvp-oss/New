ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'company';
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS unlocked boolean NOT NULL DEFAULT false;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS unlock_requested boolean NOT NULL DEFAULT false;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS free_trip_travelers integer NOT NULL DEFAULT 10;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS trip_unlock_price numeric NOT NULL DEFAULT 20;

CREATE OR REPLACE FUNCTION public.create_company(_name text, _plan uuid)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare cid uuid; days int;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if exists (select 1 from public.company_members m join public.companies c on c.id = m.company_id
             where m.user_id = auth.uid() and m.role = 'owner' and c.kind = 'company') then
    raise exception 'You already own a company';
  end if;
  select trial_days into days from public.platform_settings where id = 1;
  insert into public.companies (name, owner_id, plan_id, status, trial_ends_at, contact_email)
  values (_name, auth.uid(), _plan, 'trial', now() + make_interval(days => coalesce(days, 14)), (select email from auth.users where id = auth.uid()))
  returning id into cid;
  insert into public.company_members (company_id, user_id, role) values (cid, auth.uid(), 'owner');
  return cid;
end $function$;

CREATE OR REPLACE FUNCTION public.get_personal_space()
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare cid uuid; em text;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  select id into cid from public.companies where owner_id = auth.uid() and kind = 'personal' limit 1;
  if cid is not null then return cid; end if;
  select email into em from auth.users where id = auth.uid();
  insert into public.companies (name, owner_id, status, kind, contact_email)
  values ('My trips', auth.uid(), 'active', 'personal', em) returning id into cid;
  insert into public.company_members (company_id, user_id, role) values (cid, auth.uid(), 'owner');
  return cid;
end $function$;

CREATE OR REPLACE FUNCTION public.trip_is_free(_trip uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  select exists (select 1 from public.trips t join public.companies c on c.id = t.company_id
                 where t.id = _trip and c.kind = 'personal' and not t.unlocked)
$function$;

CREATE OR REPLACE FUNCTION public.enforce_traveler_limit()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare lim int; seats int; cnt int; k text; unl boolean; free_lim int;
begin
  select p.max_travelers_per_trip, t.seats, c.kind, t.unlocked into lim, seats, k, unl
    from public.trips t join public.companies c on c.id = t.company_id left join public.plans p on p.id = c.plan_id where t.id = new.trip_id;
  select count(*) into cnt from public.trip_travelers where trip_id = new.trip_id;
  if k = 'personal' then
    lim := null;
    if not unl then
      select free_trip_travelers into free_lim from public.platform_settings where id = 1;
      if cnt >= coalesce(free_lim, 10) then
        raise exception 'Free trips allow % travelers. Unlock this trip to add more.', coalesce(free_lim, 10);
      end if;
    end if;
  end if;
  if lim is not null and cnt >= lim then raise exception 'Your plan allows % travelers per trip.', lim; end if;
  if seats is not null and cnt >= seats then raise exception 'This trip is full (% seats).', seats; end if;
  new.email := lower(trim(new.email));
  select id into new.user_id from auth.users where lower(email) = new.email;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.guard_trip_unlock()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
begin
  if not public.has_role(auth.uid(), 'super_admin') and auth.role() <> 'service_role' then
    if tg_op = 'INSERT' then new.unlocked := false;
    elsif new.unlocked is distinct from old.unlocked then
      raise exception 'Only the platform admin can unlock a trip';
    end if;
  end if;
  return new;
end $function$;
DROP TRIGGER IF EXISTS trips_guard_unlock ON public.trips;
CREATE TRIGGER trips_guard_unlock BEFORE INSERT OR UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.guard_trip_unlock();

CREATE OR REPLACE FUNCTION public.guard_company_kind()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
begin
  if new.kind is distinct from old.kind and not public.has_role(auth.uid(), 'super_admin') then
    raise exception 'Account type cannot be changed';
  end if;
  return new;
end $function$;
DROP TRIGGER IF EXISTS companies_guard_kind ON public.companies;
CREATE TRIGGER companies_guard_kind BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.guard_company_kind();

CREATE TABLE public.trip_sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'sponsor',
  name text NOT NULL,
  category text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  logo_url text NOT NULL DEFAULT '',
  flyer_url text NOT NULL DEFAULT '',
  video_url text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  lat double precision,
  lng double precision,
  is_premium boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_sponsors TO authenticated;
GRANT ALL ON public.trip_sponsors TO service_role;
ALTER TABLE public.trip_sponsors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trip members read sponsors" ON public.trip_sponsors FOR SELECT TO authenticated USING (public.can_see_trip(trip_id, auth.uid()));
CREATE POLICY "Staff add sponsors" ON public.trip_sponsors FOR INSERT TO authenticated WITH CHECK (public.is_trip_staff(trip_id, auth.uid()));
CREATE POLICY "Staff edit sponsors" ON public.trip_sponsors FOR UPDATE TO authenticated USING (public.is_trip_staff(trip_id, auth.uid()));
CREATE POLICY "Staff delete sponsors" ON public.trip_sponsors FOR DELETE TO authenticated USING (public.is_trip_staff(trip_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.guard_sponsor_premium()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
begin
  if not public.has_role(auth.uid(), 'super_admin') and auth.role() <> 'service_role' then
    if tg_op = 'INSERT' then new.is_premium := false; new.created_by := auth.uid();
    elsif new.is_premium is distinct from old.is_premium then
      raise exception 'Only the platform admin can make a sponsor premium';
    end if;
  end if;
  return new;
end $function$;
CREATE TRIGGER trip_sponsors_guard BEFORE INSERT OR UPDATE ON public.trip_sponsors FOR EACH ROW EXECUTE FUNCTION public.guard_sponsor_premium();