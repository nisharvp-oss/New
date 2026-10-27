CREATE OR REPLACE FUNCTION public.free_trip_terms()
 RETURNS TABLE(free_travelers integer, unlock_price numeric, currency text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  select free_trip_travelers, trip_unlock_price, currency from public.platform_settings where id = 1
$function$;
GRANT EXECUTE ON FUNCTION public.free_trip_terms() TO anon, authenticated;