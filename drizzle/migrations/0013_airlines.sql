-- Airline online check-in links for Tools → Flight check-in, editable by super admins.
-- The app falls back to its bundled list (src/lib/airlines.ts) when this table can't be read.
CREATE TABLE public.airlines (
  code text PRIMARY KEY CHECK (code ~ '^[A-Z0-9]{2}$'),
  name text NOT NULL CHECK (length(trim(name)) > 0),
  region text NOT NULL DEFAULT '',
  url text NOT NULL CHECK (url ~ '^https://[^[:space:]]+$'),
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.airlines TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.airlines TO authenticated;
GRANT ALL ON public.airlines TO service_role;
ALTER TABLE public.airlines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads active airlines" ON public.airlines FOR SELECT TO anon, authenticated
  USING (is_active OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins insert airlines" ON public.airlines FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins update airlines" ON public.airlines FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins delete airlines" ON public.airlines FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

INSERT INTO public.airlines (code, name, region, url, sort_order) VALUES
 ('EK', 'Emirates', 'UAE', 'https://www.emirates.com/english/manage-booking/online-check-in/', 1),
 ('EY', 'Etihad Airways', 'UAE', 'https://www.etihad.com/en/manage/check-in', 2),
 ('FZ', 'flydubai', 'UAE', 'https://www.flydubai.com/en/flying-with-us/check-in/online-check-in/', 3),
 ('G9', 'Air Arabia', 'UAE', 'https://www.airarabia.com/en/check-in/online-check-in', 4),
 ('QR', 'Qatar Airways', 'Qatar', 'https://fs.qatarairways.com/cki/checkin/', 5),
 ('SV', 'Saudia', 'Saudi Arabia', 'https://www.saudia.com/travel-with-saudia/manage/web-check-in', 6),
 ('WY', 'Oman Air', 'Oman', 'https://www.omanair.com/en/before-you-fly', 7),
 ('GF', 'Gulf Air', 'Bahrain', 'https://www.gulfair.com/flying-with-us/before-you-travel/check-in', 8),
 ('KU', 'Kuwait Airways', 'Kuwait', 'https://kuwaitairways.com/en/olci-info', 9),
 ('MS', 'EgyptAir', 'Egypt', 'https://www.egyptair.com/en/fly/check-in/pages/web-check-in.aspx', 10),
 ('TK', 'Turkish Airlines', 'Türkiye', 'https://www.turkishairlines.com/en-us/flights/manage-booking/index.html', 11),
 ('BA', 'British Airways', 'United Kingdom', 'https://www.britishairways.com/travel/olcilandingpageauthreq/public/en_gb', 12),
 ('VS', 'Virgin Atlantic', 'United Kingdom', 'https://www.virginatlantic.com/PCCOciWeb/findBy', 13),
 ('U2', 'easyJet', 'United Kingdom', 'https://www.easyjet.com/en/help/booking-and-check-in/check-in', 14),
 ('LH', 'Lufthansa', 'Germany', 'https://www.lufthansa.com/ge/en/online-check-in', 15),
 ('AF', 'Air France', 'France', 'https://wwws.airfrance.us/check-in', 16),
 ('KL', 'KLM Royal Dutch Airlines', 'Netherlands', 'https://www.klm.com/check-in', 17),
 ('W6', 'Wizz Air', 'Hungary', 'https://www.wizzair.com/en-gb/help-centre/check-in-and-boarding/check-in/check-in-process', 18),
 ('AI', 'Air India', 'India', 'https://www.airindia.com/in/en/manage/web-checkin.html', 19),
 ('6E', 'IndiGo', 'India', 'https://www.goindigo.in/web-check-in.html', 20),
 ('UL', 'SriLankan Airlines', 'Sri Lanka', 'https://www.srilankan.com/online-checkin', 21),
 ('SQ', 'Singapore Airlines', 'Singapore', 'https://www.singaporeair.com/en_UK/us/travel-info/check-in/online-mobile-checkin/', 22),
 ('TG', 'Thai Airways', 'Thailand', 'https://www.thaiairways.com/en-th/content/check-in/', 23),
 ('JL', 'Japan Airlines', 'Japan', 'https://www.jal.co.jp/jp/en/inter/boarding/online-checkin/', 24),
 ('QF', 'Qantas', 'Australia', 'https://www.qantas.com/en-us/manage-booking/check-in', 25),
 ('AA', 'American Airlines', 'United States', 'https://www.aa.com/reservation/flightCheckInViewReservationsAccess.do', 26),
 ('DL', 'Delta Air Lines', 'United States', 'https://www.delta.com/PCCOciWeb/findBy.action', 27),
 ('AC', 'Air Canada', 'Canada', 'https://www.aircanada.com/home/us/en/aco/checkin', 28)
ON CONFLICT (code) DO NOTHING;
