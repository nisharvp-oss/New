CREATE OR REPLACE FUNCTION public.admin_set_sponsor_premium(_sponsor uuid, _premium boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN RAISE EXCEPTION 'Only the platform admin can set premium'; END IF;
  UPDATE public.trip_sponsors SET is_premium = _premium WHERE id = _sponsor;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sponsor not found'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.admin_set_sponsor_premium(uuid, boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_sponsor_premium(uuid, boolean) TO authenticated;