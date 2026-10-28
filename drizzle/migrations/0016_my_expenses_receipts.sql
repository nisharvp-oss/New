-- "My expenses": each person's own spending on a trip, visible only to them (not split or shared),
-- an optional personal budget, and receipt photos for both personal and group (split) expenses.

CREATE TABLE public.personal_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  category text NOT NULL DEFAULT 'other' CHECK (category IN ('food','transport','stay','activities','shopping','other')),
  note text NOT NULL DEFAULT '' CHECK (length(note) <= 200),
  spent_on date NOT NULL DEFAULT current_date,
  receipt_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX personal_expenses_owner_idx ON public.personal_expenses (trip_id, user_id, spent_on DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.personal_expenses TO authenticated;
GRANT ALL ON public.personal_expenses TO service_role;
ALTER TABLE public.personal_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own expenses on my trips" ON public.personal_expenses FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND (public.is_trip_staff(trip_id, auth.uid()) OR public.is_trip_traveler(trip_id, auth.uid())));

CREATE TABLE public.personal_budgets (
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (trip_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.personal_budgets TO authenticated;
GRANT ALL ON public.personal_budgets TO service_role;
ALTER TABLE public.personal_budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own budget on my trips" ON public.personal_budgets FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND (public.is_trip_staff(trip_id, auth.uid()) OR public.is_trip_traveler(trip_id, auth.uid())));

-- Group (split) expenses can carry a receipt too.
ALTER TABLE public.trip_expenses ADD COLUMN receipt_path text;

-- Private receipts bucket. The app shrinks photos to 50 KB; the bucket refuses anything over 64 KB.
-- Paths: {tripId}/shared/{file} for group expenses (trip staff write, the whole trip reads),
--        {tripId}/{userId}/{file} for personal ones (only that person).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('receipts', 'receipts', false, 65536, ARRAY['image/jpeg'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 65536, allowed_mime_types = ARRAY['image/jpeg'];

CREATE POLICY "receipts read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'receipts' AND (
    (storage.foldername(name))[2] = auth.uid()::text
    OR ((storage.foldername(name))[2] = 'shared' AND (
      public.is_trip_staff(((storage.foldername(name))[1])::uuid, auth.uid())
      OR public.is_trip_traveler(((storage.foldername(name))[1])::uuid, auth.uid())))));
CREATE POLICY "receipts upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'receipts' AND (
    ((storage.foldername(name))[2] = 'shared' AND public.is_trip_staff(((storage.foldername(name))[1])::uuid, auth.uid()))
    OR ((storage.foldername(name))[2] = auth.uid()::text AND (
      public.is_trip_staff(((storage.foldername(name))[1])::uuid, auth.uid())
      OR public.is_trip_traveler(((storage.foldername(name))[1])::uuid, auth.uid())))));
CREATE POLICY "receipts delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'receipts' AND (
    (storage.foldername(name))[2] = auth.uid()::text
    OR ((storage.foldername(name))[2] = 'shared' AND public.is_trip_staff(((storage.foldername(name))[1])::uuid, auth.uid()))));
