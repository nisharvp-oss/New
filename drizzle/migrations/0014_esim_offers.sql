-- Sponsored eSIM offers for Tools → eSIM: a provider's flyer and link, shown for the countries it
-- covers (an empty list means worldwide). Super admins manage them; anyone reads active ones.
-- Flyers live in the public site-media bucket under esim/ (admin-only writes, migration 0011).
CREATE TABLE public.esim_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL CHECK (length(trim(provider)) > 0),
  headline text NOT NULL DEFAULT '',
  url text NOT NULL CHECK (url ~ '^https://[^[:space:]]+$'),
  flyer_path text,
  countries text[] NOT NULL DEFAULT '{}' CHECK (array_to_string(countries, ',') ~ '^([A-Z]{2}(,[A-Z]{2})*)?$'),
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX esim_offers_countries_idx ON public.esim_offers USING gin (countries);
GRANT SELECT ON public.esim_offers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.esim_offers TO authenticated;
GRANT ALL ON public.esim_offers TO service_role;
ALTER TABLE public.esim_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads active eSIM offers" ON public.esim_offers FOR SELECT TO anon, authenticated
  USING (is_active OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins insert eSIM offers" ON public.esim_offers FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins update eSIM offers" ON public.esim_offers FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins delete eSIM offers" ON public.esim_offers FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Counts a click on an active offer; the only write visitors can make, and only to the counter.
CREATE OR REPLACE FUNCTION public.record_esim_click(_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.esim_offers SET clicks = clicks + 1 WHERE id = _id AND is_active;
$$;
REVOKE ALL ON FUNCTION public.record_esim_click(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_esim_click(uuid) TO anon, authenticated;
