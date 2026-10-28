/**
 * Official visa pages by destination: the government portal or ministry page where travelers check
 * requirements and apply (checked October 2026). Super admins edit the list in Admin → Visa; this
 * bundled copy is the fallback and the seed. Schengen countries without their own entry use the EU
 * visa policy page, and anything else falls back to a web search, so no paid service is involved.
 */
import { isHttpsUrl } from "@/lib/sponsor-offers";

export type VisaPage = { code: string; url: string; note: string };

export const VISA_PAGES: VisaPage[] = [
  { code: "AE", url: "https://smartservices.icp.gov.ae", note: "ICP Smart Services (UAE immigration)" },
  { code: "SA", url: "https://visa.visitsaudi.com", note: "Saudi eVisa portal" },
  { code: "OM", url: "https://evisa.rop.gov.om", note: "Royal Oman Police eVisa" },
  { code: "QA", url: "https://www.hayya.qa", note: "Hayya, Qatar's visa platform" },
  { code: "BH", url: "https://www.evisa.gov.bh", note: "Bahrain eVisa" },
  { code: "KW", url: "https://kuwaitvisa.moi.gov.kw", note: "Kuwait Ministry of Interior eVisa" },
  { code: "JO", url: "https://eservices.moi.gov.jo", note: "Jordan Ministry of Interior e-services" },
  { code: "EG", url: "https://visa2egypt.gov.eg", note: "Egypt e-Visa portal" },
  { code: "TR", url: "https://www.evisa.gov.tr/en/", note: "Türkiye e-Visa (Ministry of Foreign Affairs)" },
  { code: "GB", url: "https://www.gov.uk/check-uk-visa", note: "GOV.UK visa checker" },
  { code: "IE", url: "https://www.irishimmigration.ie/coming-to-visit-ireland/", note: "Irish Immigration Service" },
  { code: "US", url: "https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visitor.html", note: "U.S. Department of State" },
  { code: "CA", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada.html", note: "Immigration, Refugees and Citizenship Canada" },
  { code: "AU", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-finder", note: "Department of Home Affairs visa finder" },
  { code: "NZ", url: "https://www.immigration.govt.nz", note: "Immigration New Zealand" },
  { code: "IN", url: "https://indianvisaonline.gov.in/evisa/", note: "Government of India e-Visa" },
  { code: "LK", url: "https://www.eta.gov.lk", note: "Sri Lanka ETA" },
  { code: "MV", url: "https://imuga.immigration.gov.mv", note: "Maldives Immigration (IMUGA)" },
  { code: "TH", url: "https://www.thaievisa.go.th", note: "Thailand e-Visa" },
  { code: "SG", url: "https://www.ica.gov.sg", note: "Immigration & Checkpoints Authority" },
  { code: "MY", url: "https://malaysiavisa.imi.gov.my", note: "Immigration Department of Malaysia" },
  { code: "ID", url: "https://evisa.imigrasi.go.id", note: "Indonesia Immigration e-Visa" },
  { code: "VN", url: "https://evisa.gov.vn", note: "Vietnam Immigration Department e-Visa" },
  { code: "KH", url: "https://www.evisa.gov.kh", note: "Cambodia e-Visa" },
  { code: "JP", url: "https://www.mofa.go.jp/j_info/visit/visa/index.html", note: "Ministry of Foreign Affairs of Japan" },
  { code: "KR", url: "https://www.visa.go.kr", note: "Korea Visa Portal" },
  { code: "CN", url: "https://www.visaforchina.cn", note: "Chinese Visa Application Service Center" },
  { code: "KE", url: "https://www.etakenya.go.ke", note: "Kenya eTA" },
  { code: "TZ", url: "https://visa.immigration.go.tz", note: "Tanzania Immigration e-Visa" },
  { code: "GE", url: "https://www.evisa.gov.ge", note: "Georgia e-Visa" },
  { code: "AZ", url: "https://evisa.gov.az", note: "Azerbaijan ASAN Visa" },
  { code: "FR", url: "https://france-visas.gouv.fr", note: "France-Visas" },
  { code: "DE", url: "https://www.auswaertiges-amt.de/en/visa-service", note: "German Federal Foreign Office" },
  { code: "IT", url: "https://vistoperitalia.esteri.it", note: "Italian Ministry of Foreign Affairs" },
  { code: "NL", url: "https://www.netherlandsworldwide.nl/visa-the-netherlands", note: "NetherlandsWorldwide" },
  { code: "PT", url: "https://vistos.mne.gov.pt", note: "Portuguese Ministry of Foreign Affairs" },
  { code: "CH", url: "https://www.sem.admin.ch", note: "Swiss State Secretariat for Migration" },
];

export const SCHENGEN = "AT BE BG CH CZ DE DK EE ES FI FR GR HR HU IS IT LI LT LU LV MT NL NO PL PT RO SE SI SK".split(" ");
export const SCHENGEN_URL = "https://home-affairs.ec.europa.eu/policies/schengen/visa-policy_en";

export type VisaLink = { url: string; note: string; source: "official" | "schengen" | "search" };

const search = (q: string) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;

/** Where to check and apply for a visa to `dest`: its listed official page, the EU page, or a search. */
export function visaLinkFor(dest: string, destName: string, pages: VisaPage[] = VISA_PAGES): VisaLink {
  const code = dest.toUpperCase();
  const hit = pages.find((p) => p.code === code);
  if (hit) return { url: hit.url, note: hit.note, source: "official" };
  if (SCHENGEN.includes(code)) return { url: SCHENGEN_URL, note: "Schengen visa rules (European Commission)", source: "schengen" };
  return { url: search(`${destName} official visa application`), note: "Search for the official visa page", source: "search" };
}

/** A search for the rules that apply to this passport; requirements depend on nationality. */
export const visaRulesSearchUrl = (destName: string, passportName: string) => search(`${destName} visa requirements for ${passportName} citizens`);

/** A search for the destination's embassy or consulate in the traveler's own country. */
export const embassySearchUrl = (destName: string, passportName: string) => search(`${destName} embassy in ${passportName}`);

/** Cleans an admin's edit and says what's wrong with it, matching the database checks. */
export function validateVisaPage(input: VisaPage): { value: VisaPage; error: string | null } {
  const value = { code: input.code.trim().toUpperCase(), url: input.url.trim(), note: input.note.trim() };
  if (!/^[A-Z]{2}$/.test(value.code)) return { value, error: "Pick a country" };
  if (!isHttpsUrl(value.url)) return { value, error: "Enter the full official link, starting with https://" };
  return { value, error: null };
}
