CREATE TABLE public.trip_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  traveler_id uuid NOT NULL REFERENCES public.trip_travelers(id) ON DELETE CASCADE,
  title text NOT NULL,
  details text NOT NULL DEFAULT '',
  valid_on date,
  code text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(12), 'hex'),
  status text NOT NULL DEFAULT 'valid' CHECK (status IN ('valid','used','void')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_tickets TO authenticated;
GRANT ALL ON public.trip_tickets TO service_role;
ALTER TABLE public.trip_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage tickets" ON public.trip_tickets FOR ALL TO authenticated
  USING (public.is_trip_staff(trip_id, auth.uid())) WITH CHECK (public.is_trip_staff(trip_id, auth.uid()));
CREATE POLICY "travelers read own tickets" ON public.trip_tickets FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.trip_travelers t WHERE t.id = traveler_id AND t.user_id = auth.uid()));