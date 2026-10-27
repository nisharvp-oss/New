ALTER TABLE public.trip_sponsors ADD COLUMN contact_email text NOT NULL DEFAULT '';
ALTER TABLE public.trip_sponsors ADD COLUMN views integer NOT NULL DEFAULT 0;
ALTER TABLE public.trip_sponsors ADD COLUMN clicks integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.is_sponsor_owner(_email text) RETURNS boolean
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT coalesce(_email,'') <> '' AND lower(_email) = lower(coalesce(auth.jwt()->>'email',''))
$$;

CREATE POLICY "Sponsors read own listings" ON public.trip_sponsors FOR SELECT TO authenticated
  USING (public.is_sponsor_owner(contact_email));
CREATE POLICY "Sponsors edit own listings" ON public.trip_sponsors FOR UPDATE TO authenticated
  USING (public.is_sponsor_owner(contact_email)) WITH CHECK (public.is_sponsor_owner(contact_email));

CREATE OR REPLACE FUNCTION public.guard_sponsor_self_edit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.is_trip_staff(OLD.trip_id, auth.uid()) OR public.has_role(auth.uid(), 'super_admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.trip_id <> OLD.trip_id OR NEW.kind <> OLD.kind OR NEW.contact_email <> OLD.contact_email
     OR NEW.views <> OLD.views OR NEW.clicks <> OLD.clicks OR NEW.created_by IS DISTINCT FROM OLD.created_by THEN
    RAISE EXCEPTION 'Sponsors can only edit their own details';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trip_sponsors_self_edit BEFORE UPDATE ON public.trip_sponsors
  FOR EACH ROW EXECUTE FUNCTION public.guard_sponsor_self_edit();

CREATE OR REPLACE FUNCTION public.record_sponsor_event(_id uuid, _kind text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _kind = 'view' THEN
    UPDATE public.trip_sponsors SET views = views + 1 WHERE id = _id AND public.can_see_trip(trip_id, auth.uid());
  ELSIF _kind = 'click' THEN
    UPDATE public.trip_sponsors SET clicks = clicks + 1 WHERE id = _id AND public.can_see_trip(trip_id, auth.uid());
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.record_sponsor_event(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.record_sponsor_event(uuid, text) TO authenticated;

CREATE POLICY "Signed-in read sponsor media" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'sponsor-media');
CREATE POLICY "Upload own sponsor media" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'sponsor-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Delete own sponsor media" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'sponsor-media' AND (storage.foldername(name))[1] = auth.uid()::text);