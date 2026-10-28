CREATE OR REPLACE FUNCTION public.admin_set_trip_unlock(_trip uuid, _unlocked boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN RAISE EXCEPTION 'Only the platform admin can unlock a trip'; END IF;
  UPDATE public.trips SET unlocked = _unlocked, unlock_requested = CASE WHEN _unlocked THEN false ELSE unlock_requested END WHERE id = _trip;
  IF NOT FOUND THEN RAISE EXCEPTION 'Trip not found'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.admin_set_trip_unlock(uuid, boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_trip_unlock(uuid, boolean) TO authenticated;