/** ISO 3166-1 alpha-2 country codes; names come from the browser's own Intl data (no API). */
export const COUNTRY_CODES = "AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW".split(" ");

let names: Intl.DisplayNames | null = null;
export function countryName(code: string) {
  try {
    names ??= new Intl.DisplayNames(["en"], { type: "region" });
    return names.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

/** Regional-indicator flag emoji for a country code, e.g. "AE" → 🇦🇪. */
export const flag = (code: string) => String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));

export type Country = { code: string; name: string };
export const COUNTRIES: Country[] = COUNTRY_CODES.map((code) => ({ code, name: countryName(code) })).sort((a, b) => a.name.localeCompare(b.name));

export function searchCountries(query: string, list: Country[] = COUNTRIES): Country[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  const rank = (c: Country) => (c.code.toLowerCase() === q ? 0 : c.name.toLowerCase().startsWith(q) ? 1 : 2);
  return list
    .filter((c) => c.code.toLowerCase() === q || c.name.toLowerCase().includes(q))
    .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
}

/** Common short names and popular trip cities that don't contain their country's name. */
const ALIASES: Record<string, string> = {
  uae: "AE", emirates: "AE", dubai: "AE", "abu dhabi": "AE", sharjah: "AE", "ras al khaimah": "AE",
  ksa: "SA", riyadh: "SA", jeddah: "SA", makkah: "SA", mecca: "SA", medina: "SA", madinah: "SA", alula: "SA",
  doha: "QA", muscat: "OM", salalah: "OM", manama: "BH", amman: "JO", petra: "JO", cairo: "EG", luxor: "EG", "sharm el sheikh": "EG",
  istanbul: "TR", cappadocia: "TR", antalya: "TR", baku: "AZ", tbilisi: "GE",
  uk: "GB", england: "GB", scotland: "GB", wales: "GB", britain: "GB", london: "GB", edinburgh: "GB",
  usa: "US", america: "US", "new york": "US", "los angeles": "US", "las vegas": "US", orlando: "US",
  paris: "FR", rome: "IT", venice: "IT", milan: "IT", barcelona: "ES", madrid: "ES", amsterdam: "NL", lisbon: "PT",
  zurich: "CH", geneva: "CH", interlaken: "CH", vienna: "AT", prague: "CZ", athens: "GR", santorini: "GR",
  bali: "ID", jakarta: "ID", bangkok: "TH", phuket: "TH", "kuala lumpur": "MY", langkawi: "MY", hanoi: "VN",
  tokyo: "JP", kyoto: "JP", osaka: "JP", seoul: "KR", beijing: "CN", shanghai: "CN",
  delhi: "IN", mumbai: "IN", goa: "IN", kerala: "IN", jaipur: "IN", colombo: "LK", male: "MV", kathmandu: "NP",
  nairobi: "KE", "masai mara": "KE", zanzibar: "TZ", "cape town": "ZA", marrakech: "MA", marrakesh: "MA",
  sydney: "AU", melbourne: "AU", auckland: "NZ", toronto: "CA", vancouver: "CA",
};

const plain = (s: string) => ` ${s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]+/g, " ").trim()} `;

/**
 * Best guess at the country of a free-text destination like "Dubai, UAE" or "Paris & Rome":
 * the first country name, alias or known city it mentions, or null.
 */
export function guessCountry(destination: string): string | null {
  const text = plain(destination);
  if (!text.trim()) return null;
  let best: { code: string; at: number; len: number } | null = null;
  const consider = (word: string, code: string) => {
    const at = text.indexOf(` ${plain(word).trim()} `);
    if (at >= 0 && (!best || at < best.at || (at === best.at && word.length > best.len))) best = { code, at, len: word.length };
  };
  for (const c of COUNTRIES) consider(c.name, c.code);
  for (const [word, code] of Object.entries(ALIASES)) consider(word, code);
  return (best as { code: string } | null)?.code ?? null;
}
