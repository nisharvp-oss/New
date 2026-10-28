-- Official visa pages per destination for Tools → Visa, editable by super admins, plus sponsored
-- visa agencies shown under the country picker. The app falls back to its bundled list
-- (src/lib/visa.ts) when visa_pages can't be read. Agency flyers live in site-media under visa/.
CREATE TABLE public.visa_pages (
  code text PRIMARY KEY CHECK (code ~ '^[A-Z]{2}$'),
  url text NOT NULL CHECK (url ~ '^https://[^[:space:]]+$'),
  note text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.visa_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.visa_pages TO authenticated;
GRANT ALL ON public.visa_pages TO service_role;
ALTER TABLE public.visa_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads active visa pages" ON public.visa_pages FOR SELECT TO anon, authenticated
  USING (is_active OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins insert visa pages" ON public.visa_pages FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins update visa pages" ON public.visa_pages FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins delete visa pages" ON public.visa_pages FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

INSERT INTO public.visa_pages (code, url, note) VALUES
 ('AE', 'https://smartservices.icp.gov.ae', 'ICP Smart Services (UAE immigration)'),
 ('SA', 'https://visa.visitsaudi.com', 'Saudi eVisa portal'),
 ('OM', 'https://evisa.rop.gov.om', 'Royal Oman Police eVisa'),
 ('QA', 'https://www.hayya.qa', 'Hayya, Qatar''s visa platform'),
 ('BH', 'https://www.evisa.gov.bh', 'Bahrain eVisa'),
 ('KW', 'https://kuwaitvisa.moi.gov.kw', 'Kuwait Ministry of Interior eVisa'),
 ('JO', 'https://eservices.moi.gov.jo', 'Jordan Ministry of Interior e-services'),
 ('EG', 'https://visa2egypt.gov.eg', 'Egypt e-Visa portal'),
 ('TR', 'https://www.evisa.gov.tr/en/', 'Türkiye e-Visa (Ministry of Foreign Affairs)'),
 ('GB', 'https://www.gov.uk/check-uk-visa', 'GOV.UK visa checker'),
 ('IE', 'https://www.irishimmigration.ie/coming-to-visit-ireland/', 'Irish Immigration Service'),
 ('US', 'https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visitor.html', 'U.S. Department of State'),
 ('CA', 'https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada.html', 'Immigration, Refugees and Citizenship Canada'),
 ('AU', 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-finder', 'Department of Home Affairs visa finder'),
 ('NZ', 'https://www.immigration.govt.nz', 'Immigration New Zealand'),
 ('IN', 'https://indianvisaonline.gov.in/evisa/', 'Government of India e-Visa'),
 ('LK', 'https://www.eta.gov.lk', 'Sri Lanka ETA'),
 ('MV', 'https://imuga.immigration.gov.mv', 'Maldives Immigration (IMUGA)'),
 ('TH', 'https://www.thaievisa.go.th', 'Thailand e-Visa'),
 ('SG', 'https://www.ica.gov.sg', 'Immigration & Checkpoints Authority'),
 ('MY', 'https://malaysiavisa.imi.gov.my', 'Immigration Department of Malaysia'),
 ('ID', 'https://evisa.imigrasi.go.id', 'Indonesia Immigration e-Visa'),
 ('VN', 'https://evisa.gov.vn', 'Vietnam Immigration Department e-Visa'),
 ('KH', 'https://www.evisa.gov.kh', 'Cambodia e-Visa'),
 ('JP', 'https://www.mofa.go.jp/j_info/visit/visa/index.html', 'Ministry of Foreign Affairs of Japan'),
 ('KR', 'https://www.visa.go.kr', 'Korea Visa Portal'),
 ('CN', 'https://www.visaforchina.cn', 'Chinese Visa Application Service Center'),
 ('KE', 'https://www.etakenya.go.ke', 'Kenya eTA'),
 ('TZ', 'https://visa.immigration.go.tz', 'Tanzania Immigration e-Visa'),
 ('GE', 'https://www.evisa.gov.ge', 'Georgia e-Visa'),
 ('AZ', 'https://evisa.gov.az', 'Azerbaijan ASAN Visa'),
 ('FR', 'https://france-visas.gouv.fr', 'France-Visas'),
 ('DE', 'https://www.auswaertiges-amt.de/en/visa-service', 'German Federal Foreign Office'),
 ('IT', 'https://vistoperitalia.esteri.it', 'Italian Ministry of Foreign Affairs'),
 ('NL', 'https://www.netherlandsworldwide.nl/visa-the-netherlands', 'NetherlandsWorldwide'),
 ('PT', 'https://vistos.mne.gov.pt', 'Portuguese Ministry of Foreign Affairs'),
 ('CH', 'https://www.sem.admin.ch', 'Swiss State Secretariat for Migration')
ON CONFLICT (code) DO NOTHING;

-- Same shape as esim_offers (0014): an empty countries list means every destination.
CREATE TABLE public.visa_agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL CHECK (length(trim(provider)) > 0),
  headline text NOT NULL DEFAULT '',
  url text NOT NULL CHECK (url ~ '^https://[^[:space:]]+$'),
  flyer_path text,
  countries text[] NOT NULL DEFAULT '{}' CHECK (array_to_string(countries, ',') ~ '^([A-Z]{2}(,[A-Z]{2})*)?$'),
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX visa_agencies_countries_idx ON public.visa_agencies USING gin (countries);
GRANT SELECT ON public.visa_agencies TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.visa_agencies TO authenticated;
GRANT ALL ON public.visa_agencies TO service_role;
ALTER TABLE public.visa_agencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads active visa agencies" ON public.visa_agencies FOR SELECT TO anon, authenticated
  USING (is_active OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins insert visa agencies" ON public.visa_agencies FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins update visa agencies" ON public.visa_agencies FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins delete visa agencies" ON public.visa_agencies FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Counts a click on an active agency; the only write visitors can make, and only to the counter.
CREATE OR REPLACE FUNCTION public.record_visa_click(_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.visa_agencies SET clicks = clicks + 1 WHERE id = _id AND is_active;
$$;
REVOKE ALL ON FUNCTION public.record_visa_click(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_visa_click(uuid) TO anon, authenticated;
