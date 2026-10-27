CREATE TABLE public.trip_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  paid_by text NOT NULL,
  split_type text NOT NULL DEFAULT 'equal',
  splits jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.trip_settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  from_id text NOT NULL,
  to_id text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_expenses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_settlements TO authenticated;
GRANT ALL ON public.trip_expenses TO service_role;
GRANT ALL ON public.trip_settlements TO service_role;
ALTER TABLE public.trip_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_settlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expenses read" ON public.trip_expenses FOR SELECT TO authenticated
  USING (public.is_trip_staff(trip_id, auth.uid()) OR public.is_trip_traveler(trip_id, auth.uid()));
CREATE POLICY "expenses staff write" ON public.trip_expenses FOR ALL TO authenticated
  USING (public.is_trip_staff(trip_id, auth.uid())) WITH CHECK (public.is_trip_staff(trip_id, auth.uid()));
CREATE POLICY "settlements read" ON public.trip_settlements FOR SELECT TO authenticated
  USING (public.is_trip_staff(trip_id, auth.uid()) OR public.is_trip_traveler(trip_id, auth.uid()));
CREATE POLICY "settlements staff write" ON public.trip_settlements FOR ALL TO authenticated
  USING (public.is_trip_staff(trip_id, auth.uid())) WITH CHECK (public.is_trip_staff(trip_id, auth.uid()));