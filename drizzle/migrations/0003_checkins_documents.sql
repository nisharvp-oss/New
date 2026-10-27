CREATE TABLE public.trip_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  traveler_id uuid NOT NULL REFERENCES public.trip_travelers(id) ON DELETE CASCADE,
  checkpoint text NOT NULL,
  checked_by uuid NOT NULL DEFAULT auth.uid(),
  checked_by_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (traveler_id, checkpoint)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_checkins TO authenticated;
GRANT ALL ON public.trip_checkins TO service_role;
ALTER TABLE public.trip_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage checkins" ON public.trip_checkins FOR ALL TO authenticated
  USING (public.is_trip_staff(trip_id, auth.uid())) WITH CHECK (public.is_trip_staff(trip_id, auth.uid()));
CREATE POLICY "travelers read own checkins" ON public.trip_checkins FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.trip_travelers t WHERE t.id = traveler_id AND t.user_id = auth.uid()));

CREATE TABLE public.trip_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  traveler_id uuid NOT NULL REFERENCES public.trip_travelers(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'document' CHECK (kind IN ('document','boarding_pass')),
  title text NOT NULL,
  path text NOT NULL UNIQUE,
  uploaded_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_documents TO authenticated;
GRANT ALL ON public.trip_documents TO service_role;
ALTER TABLE public.trip_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage documents" ON public.trip_documents FOR ALL TO authenticated
  USING (public.is_trip_staff(trip_id, auth.uid())) WITH CHECK (public.is_trip_staff(trip_id, auth.uid()));
CREATE POLICY "travelers read own documents" ON public.trip_documents FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.trip_travelers t WHERE t.id = traveler_id AND t.user_id = auth.uid()));
CREATE POLICY "travelers add own documents" ON public.trip_documents FOR INSERT TO authenticated
  WITH CHECK (kind = 'document' AND uploaded_by = auth.uid()
    AND EXISTS (SELECT 1 FROM public.trip_travelers t WHERE t.id = traveler_id AND t.trip_id = trip_documents.trip_id AND t.user_id = auth.uid()));
CREATE POLICY "travelers delete own uploads" ON public.trip_documents FOR DELETE TO authenticated
  USING (uploaded_by = auth.uid());

CREATE POLICY "trip docs read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'trip-docs' AND (
    public.is_trip_staff(((storage.foldername(name))[1])::uuid, auth.uid())
    OR EXISTS (SELECT 1 FROM public.trip_documents d JOIN public.trip_travelers t ON t.id = d.traveler_id WHERE d.path = name AND t.user_id = auth.uid())));
CREATE POLICY "trip docs upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'trip-docs' AND (
    public.is_trip_staff(((storage.foldername(name))[1])::uuid, auth.uid())
    OR public.is_trip_traveler(((storage.foldername(name))[1])::uuid, auth.uid())));
CREATE POLICY "trip docs delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'trip-docs' AND (owner = auth.uid() OR public.is_trip_staff(((storage.foldername(name))[1])::uuid, auth.uid())));