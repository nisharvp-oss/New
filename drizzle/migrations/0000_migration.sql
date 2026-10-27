-- Roles
create type public.app_role as enum ('super_admin');
create type public.company_role as enum ('owner', 'organiser', 'caretaker');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users read own roles" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'super_admin'));

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

-- Platform settings (single row)
create table public.platform_settings (
  id int primary key default 1 check (id = 1),
  trial_days int not null default 14,
  currency text not null default 'USD',
  smtp_host text, smtp_port int default 465, smtp_secure text not null default 'tls',
  smtp_user text, smtp_from_name text, smtp_from_email text,
  updated_at timestamptz not null default now()
);
insert into public.platform_settings (id) values (1);
grant select, update on public.platform_settings to authenticated;
grant all on public.platform_settings to service_role;
alter table public.platform_settings enable row level security;
create policy "Admins read settings" on public.platform_settings for select to authenticated using (public.has_role(auth.uid(), 'super_admin'));
create policy "Admins update settings" on public.platform_settings for update to authenticated using (public.has_role(auth.uid(), 'super_admin'));

create or replace function public.get_trial_days() returns int language sql stable security definer set search_path = public as $$
  select trial_days from public.platform_settings where id = 1
$$;
grant execute on function public.get_trial_days() to anon, authenticated;

-- Plans
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price numeric(10,2) not null default 0,
  billing_interval text not null default 'month' check (billing_interval in ('month','year')),
  max_trips int,
  max_organisers int,
  max_travelers_per_trip int,
  features text[] not null default '{}',
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.plans to anon;
grant select, insert, update, delete on public.plans to authenticated;
grant all on public.plans to service_role;
alter table public.plans enable row level security;
create policy "Anyone reads active plans" on public.plans for select to anon, authenticated using (is_active or public.has_role(auth.uid(), 'super_admin'));
create policy "Admins insert plans" on public.plans for insert to authenticated with check (public.has_role(auth.uid(), 'super_admin'));
create policy "Admins update plans" on public.plans for update to authenticated using (public.has_role(auth.uid(), 'super_admin'));
create policy "Admins delete plans" on public.plans for delete to authenticated using (public.has_role(auth.uid(), 'super_admin'));

insert into public.plans (name, description, price, billing_interval, max_trips, max_organisers, max_travelers_per_trip, features, sort_order) values
 ('Starter', 'For small agencies getting started', 29, 'month', 3, 2, 30, array['Itineraries & tickets','Add-ons','Expense splitting','SOS alerts'], 1),
 ('Growth', 'For busy travel companies', 79, 'month', 15, 10, 100, array['Everything in Starter','Public trip pages','Discount codes & referrals','Own email settings'], 2),
 ('Enterprise', 'Unlimited trips and team', 199, 'month', null, null, null, array['Everything in Growth','Unlimited trips','Unlimited organisers','Reports'], 3);

-- Companies
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null,
  contact_email text, phone text,
  payment_link text, bank_details text, cash_note text,
  status text not null default 'trial' check (status in ('trial','active','suspended')),
  plan_id uuid references public.plans(id) on delete set null,
  trial_ends_at timestamptz,
  paid_until timestamptz,
  smtp_host text, smtp_port int default 465, smtp_secure text not null default 'tls',
  smtp_user text, smtp_from_name text, smtp_from_email text,
  created_at timestamptz not null default now()
);
grant select, update on public.companies to authenticated;
grant all on public.companies to service_role;
alter table public.companies enable row level security;

create table public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null,
  role public.company_role not null,
  created_at timestamptz not null default now(),
  unique (company_id, user_id)
);
grant select, insert, update, delete on public.company_members to authenticated;
grant all on public.company_members to service_role;
alter table public.company_members enable row level security;

create or replace function public.company_role_of(_company uuid, _user uuid) returns public.company_role
language sql stable security definer set search_path = public as $$
  select role from public.company_members where company_id = _company and user_id = _user
$$;
create or replace function public.is_company_member(_company uuid, _user uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.company_members where company_id = _company and user_id = _user)
$$;
create or replace function public.shares_company(_a uuid, _b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.company_members x join public.company_members y on x.company_id = y.company_id where x.user_id = _a and y.user_id = _b)
$$;
create or replace function public.company_is_writable(_company uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.companies c where c.id = _company and (
    (c.status = 'active' and (c.paid_until is null or c.paid_until > now()))
    or (c.status = 'trial' and c.trial_ends_at > now())))
$$;

create policy "Members and admins read company" on public.companies for select to authenticated
  using (public.is_company_member(id, auth.uid()) or public.has_role(auth.uid(), 'super_admin'));
create policy "Owner or admin updates company" on public.companies for update to authenticated
  using (public.company_role_of(id, auth.uid()) = 'owner' or public.has_role(auth.uid(), 'super_admin'));

-- Only admins may change billing columns
create or replace function public.guard_company_billing() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(), 'super_admin') and auth.role() <> 'service_role' then
    if new.status is distinct from old.status or new.plan_id is distinct from old.plan_id
       or new.trial_ends_at is distinct from old.trial_ends_at or new.paid_until is distinct from old.paid_until
       or new.owner_id is distinct from old.owner_id then
      raise exception 'Only the platform admin can change subscription details';
    end if;
  end if;
  return new;
end $$;
create trigger companies_guard_billing before update on public.companies for each row execute function public.guard_company_billing();

create policy "Read members of own company" on public.company_members for select to authenticated
  using (public.is_company_member(company_id, auth.uid()) or public.has_role(auth.uid(), 'super_admin'));
create policy "Owner adds members" on public.company_members for insert to authenticated
  with check (public.company_role_of(company_id, auth.uid()) = 'owner' or public.has_role(auth.uid(), 'super_admin'));
create policy "Owner updates members" on public.company_members for update to authenticated
  using (public.company_role_of(company_id, auth.uid()) = 'owner' or public.has_role(auth.uid(), 'super_admin'));
create policy "Owner removes members" on public.company_members for delete to authenticated
  using ((public.company_role_of(company_id, auth.uid()) = 'owner' and role <> 'owner') or public.has_role(auth.uid(), 'super_admin'));

create policy "Read own or teammates profile" on public.profiles for select to authenticated
  using (id = auth.uid() or public.shares_company(id, auth.uid()) or public.has_role(auth.uid(), 'super_admin'));
create policy "Update own profile" on public.profiles for update to authenticated using (id = auth.uid());
create policy "Insert own profile" on public.profiles for insert to authenticated with check (id = auth.uid());

-- Organiser limit
create or replace function public.enforce_member_limit() returns trigger language plpgsql security definer set search_path = public as $$
declare lim int; cnt int;
begin
  if new.role <> 'organiser' then return new; end if;
  select p.max_organisers into lim from public.companies c left join public.plans p on p.id = c.plan_id where c.id = new.company_id;
  if lim is null then return new; end if;
  select count(*) into cnt from public.company_members where company_id = new.company_id and role = 'organiser';
  if cnt >= lim then raise exception 'Your plan allows % organisers. Upgrade to add more.', lim; end if;
  return new;
end $$;
create trigger company_members_limit before insert on public.company_members for each row execute function public.enforce_member_limit();

-- Invites
create table public.company_invites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  email text not null,
  role public.company_role not null check (role <> 'owner'),
  created_at timestamptz not null default now(),
  unique (company_id, email)
);
grant select, insert, delete on public.company_invites to authenticated;
grant all on public.company_invites to service_role;
alter table public.company_invites enable row level security;
create policy "Owner manages invites read" on public.company_invites for select to authenticated
  using (public.company_role_of(company_id, auth.uid()) = 'owner' or public.has_role(auth.uid(), 'super_admin'));
create policy "Owner creates invites" on public.company_invites for insert to authenticated
  with check (public.company_role_of(company_id, auth.uid()) = 'owner');
create policy "Owner deletes invites" on public.company_invites for delete to authenticated
  using (public.company_role_of(company_id, auth.uid()) = 'owner');

create or replace function public.accept_my_invites() returns int language plpgsql security definer set search_path = public as $$
declare e text; n int := 0; r record;
begin
  select lower(email) into e from auth.users where id = auth.uid();
  if e is null then return 0; end if;
  for r in select * from public.company_invites where lower(email) = e loop
    insert into public.company_members (company_id, user_id, role) values (r.company_id, auth.uid(), r.role) on conflict do nothing;
    delete from public.company_invites where id = r.id;
    n := n + 1;
  end loop;
  return n;
end $$;
grant execute on function public.accept_my_invites() to authenticated;

-- Create company (starts trial)
create or replace function public.create_company(_name text, _plan uuid) returns uuid language plpgsql security definer set search_path = public as $$
declare cid uuid; days int;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if exists (select 1 from public.company_members where user_id = auth.uid() and role = 'owner') then
    raise exception 'You already own a company';
  end if;
  select trial_days into days from public.platform_settings where id = 1;
  insert into public.companies (name, owner_id, plan_id, status, trial_ends_at, contact_email)
  values (_name, auth.uid(), _plan, 'trial', now() + make_interval(days => coalesce(days, 14)), (select email from auth.users where id = auth.uid()))
  returning id into cid;
  insert into public.company_members (company_id, user_id, role) values (cid, auth.uid(), 'owner');
  return cid;
end $$;
grant execute on function public.create_company(text, uuid) to authenticated;

-- Trips
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  destination text not null default '',
  description text not null default '',
  start_date date, end_date date,
  price numeric(10,2),
  seats int,
  organiser_id uuid, caretaker_id uuid,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.trips to authenticated;
grant all on public.trips to service_role;
alter table public.trips enable row level security;
create policy "Members read trips" on public.trips for select to authenticated
  using (public.is_company_member(company_id, auth.uid()) or public.has_role(auth.uid(), 'super_admin'));
create policy "Owner/organiser create trips" on public.trips for insert to authenticated
  with check (public.company_role_of(company_id, auth.uid()) in ('owner','organiser') and public.company_is_writable(company_id));
create policy "Owner/organiser update trips" on public.trips for update to authenticated
  using (public.company_role_of(company_id, auth.uid()) in ('owner','organiser') and public.company_is_writable(company_id));
create policy "Owner deletes trips" on public.trips for delete to authenticated
  using (public.company_role_of(company_id, auth.uid()) = 'owner');

create or replace function public.enforce_trip_limit() returns trigger language plpgsql security definer set search_path = public as $$
declare lim int; cnt int;
begin
  select p.max_trips into lim from public.companies c left join public.plans p on p.id = c.plan_id where c.id = new.company_id;
  if lim is null then return new; end if;
  select count(*) into cnt from public.trips where company_id = new.company_id;
  if cnt >= lim then raise exception 'Your plan allows % trips. Upgrade to add more.', lim; end if;
  return new;
end $$;
create trigger trips_limit before insert on public.trips for each row execute function public.enforce_trip_limit();

-- SMTP passwords: server-only
create table public.smtp_secrets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid unique references public.companies(id) on delete cascade,
  is_platform boolean not null default false,
  password text not null,
  updated_at timestamptz not null default now()
);
create unique index smtp_secrets_platform on public.smtp_secrets (is_platform) where is_platform;
grant all on public.smtp_secrets to service_role;
alter table public.smtp_secrets enable row level security;

-- New user: profile, first user becomes super admin, accept invites
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name) values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'));
  if not exists (select 1 from public.user_roles where role = 'super_admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'super_admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
