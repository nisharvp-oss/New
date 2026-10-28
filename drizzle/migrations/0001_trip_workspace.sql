create or replace function public.trip_company(_trip uuid) returns uuid language sql stable security definer set search_path = public as $$
  select company_id from public.trips where id = _trip $$;

create or replace function public.is_trip_staff(_trip uuid, _user uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.trips t where t.id = _trip and (
    t.organiser_id = _user or t.caretaker_id = _user
    or public.company_role_of(t.company_id, _user) in ('owner','organiser')))
  or public.has_role(_user, 'super_admin') $$;

create table public.trip_travelers (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid,
  email text not null,
  name text not null default '',
  phone text not null default '',
  emergency text not null default '',
  dietary text not null default '',
  payment text not null default 'pending' check (payment in ('pending','partial','paid')),
  created_at timestamptz not null default now(),
  unique (trip_id, email)
);
grant select, insert, update, delete on public.trip_travelers to authenticated;
grant all on public.trip_travelers to service_role;
alter table public.trip_travelers enable row level security;

create or replace function public.is_trip_traveler(_trip uuid, _user uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.trip_travelers where trip_id = _trip and user_id = _user) $$;
create or replace function public.can_see_trip(_trip uuid, _user uuid) returns boolean language sql stable security definer set search_path = public as $$
  select public.is_trip_staff(_trip, _user) or public.is_trip_traveler(_trip, _user)
    or public.is_company_member(public.trip_company(_trip), _user) $$;

create policy "Staff or self read travelers" on public.trip_travelers for select to authenticated
  using (public.is_trip_staff(trip_id, auth.uid()) or user_id = auth.uid() or public.is_company_member(public.trip_company(trip_id), auth.uid()));
create policy "Staff add travelers" on public.trip_travelers for insert to authenticated with check (public.is_trip_staff(trip_id, auth.uid()));
create policy "Staff or self update traveler" on public.trip_travelers for update to authenticated using (public.is_trip_staff(trip_id, auth.uid()) or user_id = auth.uid());
create policy "Staff remove travelers" on public.trip_travelers for delete to authenticated using (public.is_trip_staff(trip_id, auth.uid()));

create or replace function public.guard_traveler_update() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_trip_staff(old.trip_id, auth.uid()) and auth.role() <> 'service_role' then
    if new.payment is distinct from old.payment or new.email is distinct from old.email
       or new.user_id is distinct from old.user_id or new.trip_id is distinct from old.trip_id then
      raise exception 'Only trip staff can change that';
    end if;
  end if;
  return new;
end $$;
create trigger trip_travelers_guard before update on public.trip_travelers for each row execute function public.guard_traveler_update();

create or replace function public.enforce_traveler_limit() returns trigger language plpgsql security definer set search_path = public as $$
declare lim int; seats int; cnt int;
begin
  select p.max_travelers_per_trip, t.seats into lim, seats from public.trips t join public.companies c on c.id = t.company_id left join public.plans p on p.id = c.plan_id where t.id = new.trip_id;
  select count(*) into cnt from public.trip_travelers where trip_id = new.trip_id;
  if lim is not null and cnt >= lim then raise exception 'Your plan allows % travelers per trip.', lim; end if;
  if seats is not null and cnt >= seats then raise exception 'This trip is full (% seats).', seats; end if;
  new.email := lower(trim(new.email));
  select id into new.user_id from auth.users where lower(email) = new.email;
  return new;
end $$;
create trigger trip_travelers_limit before insert on public.trip_travelers for each row execute function public.enforce_traveler_limit();

create or replace function public.link_my_trips() returns int language plpgsql security definer set search_path = public as $$
declare e text; n int;
begin
  select lower(email) into e from auth.users where id = auth.uid();
  update public.trip_travelers set user_id = auth.uid() where email = e and user_id is null;
  get diagnostics n = row_count;
  return n;
end $$;
grant execute on function public.link_my_trips() to authenticated;

create table public.itinerary_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  day int not null default 1,
  time text not null default '09:00',
  title text not null,
  location text not null default '',
  meals text[] not null default '{}',
  notice text not null default '',
  created_at timestamptz not null default now()
);
create table public.addons (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  title text not null,
  description text not null default '',
  price numeric(10,2) not null default 0,
  cutoff timestamptz,
  methods text[] not null default '{cash}',
  created_at timestamptz not null default now()
);
create table public.addon_bookings (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  addon_id uuid not null references public.addons(id) on delete cascade,
  traveler_id uuid not null references public.trip_travelers(id) on delete cascade,
  method text not null default 'cash',
  status text not null default 'pending' check (status in ('pending','paid')),
  created_at timestamptz not null default now(),
  unique (addon_id, traveler_id)
);
create table public.trip_messages (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null,
  author text not null default '',
  text text not null,
  created_at timestamptz not null default now()
);
create table public.sos_alerts (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null,
  traveler_name text not null default '',
  phone text not null default '',
  lat double precision, lng double precision,
  message text not null default '',
  status text not null default 'active' check (status in ('active','resolved')),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.itinerary_items, public.addons, public.addon_bookings, public.trip_messages, public.sos_alerts to authenticated;
grant all on public.itinerary_items, public.addons, public.addon_bookings, public.trip_messages, public.sos_alerts to service_role;
alter table public.itinerary_items enable row level security;
alter table public.addons enable row level security;
alter table public.addon_bookings enable row level security;
alter table public.trip_messages enable row level security;
alter table public.sos_alerts enable row level security;

create policy "See itinerary" on public.itinerary_items for select to authenticated using (public.can_see_trip(trip_id, auth.uid()));
create policy "Staff add itinerary" on public.itinerary_items for insert to authenticated with check (public.is_trip_staff(trip_id, auth.uid()));
create policy "Staff edit itinerary" on public.itinerary_items for update to authenticated using (public.is_trip_staff(trip_id, auth.uid()));
create policy "Staff delete itinerary" on public.itinerary_items for delete to authenticated using (public.is_trip_staff(trip_id, auth.uid()));

create policy "See addons" on public.addons for select to authenticated using (public.can_see_trip(trip_id, auth.uid()));
create policy "Staff add addons" on public.addons for insert to authenticated with check (public.is_trip_staff(trip_id, auth.uid()));
create policy "Staff edit addons" on public.addons for update to authenticated using (public.is_trip_staff(trip_id, auth.uid()));
create policy "Staff delete addons" on public.addons for delete to authenticated using (public.is_trip_staff(trip_id, auth.uid()));

create policy "See bookings" on public.addon_bookings for select to authenticated
  using (public.is_trip_staff(trip_id, auth.uid()) or exists (select 1 from public.trip_travelers tt where tt.id = traveler_id and tt.user_id = auth.uid()));
create policy "Book for self or staff" on public.addon_bookings for insert to authenticated
  with check ((public.is_trip_staff(trip_id, auth.uid()) or exists (select 1 from public.trip_travelers tt where tt.id = traveler_id and tt.user_id = auth.uid() and tt.trip_id = addon_bookings.trip_id)) and status = 'pending');
create policy "Staff update bookings" on public.addon_bookings for update to authenticated using (public.is_trip_staff(trip_id, auth.uid()));
create policy "Staff or self cancel booking" on public.addon_bookings for delete to authenticated
  using (public.is_trip_staff(trip_id, auth.uid()) or (status = 'pending' and exists (select 1 from public.trip_travelers tt where tt.id = traveler_id and tt.user_id = auth.uid())));

create policy "See messages" on public.trip_messages for select to authenticated using (public.can_see_trip(trip_id, auth.uid()));
create policy "Staff post announcements" on public.trip_messages for insert to authenticated with check (public.is_trip_staff(trip_id, auth.uid()) and user_id = auth.uid());
create policy "Staff delete announcements" on public.trip_messages for delete to authenticated using (public.is_trip_staff(trip_id, auth.uid()));

create policy "Staff or sender read sos" on public.sos_alerts for select to authenticated using (public.is_trip_staff(trip_id, auth.uid()) or user_id = auth.uid());
create policy "Traveler sends sos" on public.sos_alerts for insert to authenticated with check (user_id = auth.uid() and public.can_see_trip(trip_id, auth.uid()));
create policy "Staff resolve sos" on public.sos_alerts for update to authenticated using (public.is_trip_staff(trip_id, auth.uid()));

-- travelers can read their trip row
create policy "Travelers read their trips" on public.trips for select to authenticated using (public.is_trip_traveler(id, auth.uid()) or caretaker_id = auth.uid() or organiser_id = auth.uid());
-- travelers can see company payment details for their trips
create or replace function public.trip_payment_info(_trip uuid) returns table(company_name text, payment_link text, bank_details text, cash_note text, contact_email text, phone text)
language sql stable security definer set search_path = public as $$
  select c.name, c.payment_link, c.bank_details, c.cash_note, c.contact_email, c.phone
  from public.trips t join public.companies c on c.id = t.company_id
  where t.id = _trip and public.can_see_trip(_trip, auth.uid()) $$;
grant execute on function public.trip_payment_info(uuid) to authenticated;

alter publication supabase_realtime add table public.sos_alerts;
alter publication supabase_realtime add table public.trip_messages;
