/**
 * Airline online check-in pages (official airline sites, checked October 2026). The tool opens the
 * airline's own page in a new tab, so there is no third-party service or cost. Airlines not listed
 * fall back to a web search for "<airline> online check-in".
 */
export type Airline = { code: string; name: string; region: string; url: string };

export const AIRLINES: Airline[] = [
  { code: "EK", name: "Emirates", region: "UAE", url: "https://www.emirates.com/english/manage-booking/online-check-in/" },
  { code: "EY", name: "Etihad Airways", region: "UAE", url: "https://www.etihad.com/en/manage/check-in" },
  { code: "FZ", name: "flydubai", region: "UAE", url: "https://www.flydubai.com/en/flying-with-us/check-in/online-check-in/" },
  { code: "G9", name: "Air Arabia", region: "UAE", url: "https://www.airarabia.com/en/check-in/online-check-in" },
  { code: "QR", name: "Qatar Airways", region: "Qatar", url: "https://fs.qatarairways.com/cki/checkin/" },
  { code: "SV", name: "Saudia", region: "Saudi Arabia", url: "https://www.saudia.com/travel-with-saudia/manage/web-check-in" },
  { code: "WY", name: "Oman Air", region: "Oman", url: "https://www.omanair.com/en/before-you-fly" },
  { code: "GF", name: "Gulf Air", region: "Bahrain", url: "https://www.gulfair.com/flying-with-us/before-you-travel/check-in" },
  { code: "KU", name: "Kuwait Airways", region: "Kuwait", url: "https://kuwaitairways.com/en/olci-info" },
  { code: "MS", name: "EgyptAir", region: "Egypt", url: "https://www.egyptair.com/en/fly/check-in/pages/web-check-in.aspx" },
  { code: "TK", name: "Turkish Airlines", region: "Türkiye", url: "https://www.turkishairlines.com/en-us/flights/manage-booking/index.html" },
  { code: "BA", name: "British Airways", region: "United Kingdom", url: "https://www.britishairways.com/travel/olcilandingpageauthreq/public/en_gb" },
  { code: "VS", name: "Virgin Atlantic", region: "United Kingdom", url: "https://www.virginatlantic.com/PCCOciWeb/findBy" },
  { code: "U2", name: "easyJet", region: "United Kingdom", url: "https://www.easyjet.com/en/help/booking-and-check-in/check-in" },
  { code: "LH", name: "Lufthansa", region: "Germany", url: "https://www.lufthansa.com/ge/en/online-check-in" },
  { code: "AF", name: "Air France", region: "France", url: "https://wwws.airfrance.us/check-in" },
  { code: "KL", name: "KLM Royal Dutch Airlines", region: "Netherlands", url: "https://www.klm.com/check-in" },
  { code: "W6", name: "Wizz Air", region: "Hungary", url: "https://www.wizzair.com/en-gb/help-centre/check-in-and-boarding/check-in/check-in-process" },
  { code: "AI", name: "Air India", region: "India", url: "https://www.airindia.com/in/en/manage/web-checkin.html" },
  { code: "6E", name: "IndiGo", region: "India", url: "https://www.goindigo.in/web-check-in.html" },
  { code: "UL", name: "SriLankan Airlines", region: "Sri Lanka", url: "https://www.srilankan.com/online-checkin" },
  { code: "SQ", name: "Singapore Airlines", region: "Singapore", url: "https://www.singaporeair.com/en_UK/us/travel-info/check-in/online-mobile-checkin/" },
  { code: "TG", name: "Thai Airways", region: "Thailand", url: "https://www.thaiairways.com/en-th/content/check-in/" },
  { code: "JL", name: "Japan Airlines", region: "Japan", url: "https://www.jal.co.jp/jp/en/inter/boarding/online-checkin/" },
  { code: "QF", name: "Qantas", region: "Australia", url: "https://www.qantas.com/en-us/manage-booking/check-in" },
  { code: "AA", name: "American Airlines", region: "United States", url: "https://www.aa.com/reservation/flightCheckInViewReservationsAccess.do" },
  { code: "DL", name: "Delta Air Lines", region: "United States", url: "https://www.delta.com/PCCOciWeb/findBy.action" },
  { code: "AC", name: "Air Canada", region: "Canada", url: "https://www.aircanada.com/home/us/en/aco/checkin" },
];

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

/** Airlines matching a name, two-letter code or country; code matches first, then name prefixes. */
export function searchAirlines(query: string, list: Airline[] = AIRLINES): Airline[] {
  const q = norm(query);
  if (!q) return [...list].sort((a, b) => a.name.localeCompare(b.name));
  const score = (a: Airline) => {
    const name = norm(a.name);
    if (norm(a.code) === q) return 0;
    if (name.startsWith(q)) return 1;
    if (name.split(" ").some((w) => w.startsWith(q))) return 2;
    if (name.includes(q) || norm(a.region).includes(q)) return 3;
    return 9;
  };
  return list.map((a) => [a, score(a)] as const).filter(([, s]) => s < 9).sort((x, y) => x[1] - y[1] || x[0].name.localeCompare(y[0].name)).map(([a]) => a);
}

/** The airline behind a flight number such as "EK 202", "ek202" or "6E 1407", if we list it. */
export function airlineFromFlight(text: string, list: Airline[] = AIRLINES): Airline | null {
  const m = text.toUpperCase().match(/\b([A-Z0-9]{2})\s?(\d{1,4})\b/g) ?? [];
  for (const token of m) {
    const code = token.replace(/\s/g, "").slice(0, 2);
    const hit = list.find((a) => a.code === code);
    if (hit) return hit;
  }
  return null;
}

/** Fallback for airlines we don't list: a web search for their check-in page. */
export function checkinSearchUrl(airline: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(`${airline.trim()} online check-in`)}`;
}
