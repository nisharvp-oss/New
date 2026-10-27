-- Super admins choose the photos shown on the landing page and app screens.
-- One row per named slot; the app falls back to its bundled photo when a slot has no row.
CREATE TABLE public.site_images (
  slot text PRIMARY KEY CHECK (slot ~ '^[a-z][a-z0-9_]{1,40}$'),
  path text NOT NULL,
  alt text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
GRANT SELECT ON public.site_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_images TO authenticated;
GRANT ALL ON public.site_images TO service_role;
ALTER TABLE public.site_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads site images" ON public.site_images FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert site images" ON public.site_images FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins update site images" ON public.site_images FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins delete site images" ON public.site_images FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Public bucket: these photos are marketing content shown to signed-out visitors.
INSERT INTO storage.buckets (id, name, public) VALUES ('site-media', 'site-media', true)
  ON CONFLICT (id) DO UPDATE SET public = true;
CREATE POLICY "Anyone reads site media" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'site-media');
CREATE POLICY "Admins upload site media" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'site-media' AND public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins update site media" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'site-media' AND public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins delete site media" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'site-media' AND public.has_role(auth.uid(), 'super_admin'));
