ALTER TABLE public.platform_settings ADD COLUMN paypal_email text NOT NULL DEFAULT '';
ALTER TABLE public.platform_settings ADD COLUMN paypal_client_id text NOT NULL DEFAULT '';
ALTER TABLE public.platform_settings ADD COLUMN paypal_mode text NOT NULL DEFAULT 'sandbox';
ALTER TABLE public.platform_settings ADD COLUMN stripe_publishable_key text NOT NULL DEFAULT '';
ALTER TABLE public.platform_settings ADD COLUMN stripe_account_email text NOT NULL DEFAULT '';

CREATE TABLE public.payment_secrets (
  provider text PRIMARY KEY CHECK (provider IN ('paypal','stripe')),
  secret text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.payment_secrets TO service_role;
ALTER TABLE public.payment_secrets ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.list_super_admins() RETURNS TABLE(user_id uuid, email text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN RAISE EXCEPTION 'Not allowed'; END IF;
  RETURN QUERY SELECT r.user_id, p.email FROM public.user_roles r LEFT JOIN public.profiles p ON p.id = r.user_id WHERE r.role = 'super_admin';
END $$;

CREATE OR REPLACE FUNCTION public.grant_super_admin(_email text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN RAISE EXCEPTION 'Not allowed'; END IF;
  SELECT id INTO _uid FROM public.profiles WHERE lower(email) = lower(trim(_email));
  IF _uid IS NULL THEN RAISE EXCEPTION 'No account with that email yet. Ask them to sign up first.'; END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (_uid, 'super_admin') ON CONFLICT DO NOTHING;
END $$;

CREATE OR REPLACE FUNCTION public.revoke_super_admin(_user uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF _user = auth.uid() THEN RAISE EXCEPTION 'You cannot remove your own admin role'; END IF;
  DELETE FROM public.user_roles WHERE user_id = _user AND role = 'super_admin';
END $$;

REVOKE ALL ON FUNCTION public.list_super_admins() FROM public, anon;
REVOKE ALL ON FUNCTION public.grant_super_admin(text) FROM public, anon;
REVOKE ALL ON FUNCTION public.revoke_super_admin(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.list_super_admins() TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_super_admin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_super_admin(uuid) TO authenticated;