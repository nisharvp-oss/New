import { create } from "zustand";
import { persist } from "zustand/middleware";
import { computeSplits, type Expense, type Settlement } from "./splitwise";
export type { Expense };

export type InviteStatus = "invited" | "accepted" | "declined";
export type PayStatus = "paid" | "pending" | "partial";
export type Member = {
  id: string; name: string; email: string; phone: string; emergency: string;
  dietary: string; invite: InviteStatus; payment: PayStatus;
};
export type Meal = "Breakfast Included" | "Lunch: Self-pay" | "Lunch Included" | "Dinner: Group Booking" | "Dinner: Self-pay";
export type ItItem = { id: string; day: number; time: string; title: string; location: string; meals: Meal[]; notice?: string };
export type DayInfo = { day: number; title: string };
export type TicketType = "flight" | "museum" | "train" | "activity";
export type Ticket = { id: string; title: string; type: TicketType; seat: string; date: string; assignedTo: string | null; qr: string };
export type PayMethod = "cash" | "link" | "bank";
export type Addon = {
  id: string; title: string; description: string; price: number; cutoff: string; image: string;
  methods: PayMethod[]; paymentLink: string; bankNotes: string;
};
export type Booking = { id: string; addonId: string; memberId: string; method: PayMethod; status: "pending" | "paid" };
export type ExpGroup = { id: string; name: string; members: string[] };
export type Sos = { id: string; memberId: string; lat: number; lng: number; message: string; at: string; status: "active" | "resolved"; target: "organizer" | "group" };
export type Msg = { id: string; channel: string; from: string; text: string; at: string };
export type Privacy = { showRoster: boolean; nameOnly: boolean; allowMessaging: boolean };

const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();

const members: Member[] = [
  { id: "m1", name: "Sarah Chen", email: "sarah@mail.com", phone: "+1 415 555 0134", emergency: "David Chen +1 415 555 0199", dietary: "Vegetarian", invite: "accepted", payment: "paid" },
  { id: "m2", name: "Alex Rivera", email: "alex@mail.com", phone: "+1 212 555 0172", emergency: "Maria Rivera +1 212 555 0110", dietary: "None", invite: "accepted", payment: "paid" },
  { id: "m3", name: "John Okafor", email: "john@mail.com", phone: "+44 20 7946 0321", emergency: "Ada Okafor +44 20 7946 0999", dietary: "Halal", invite: "accepted", payment: "partial" },
  { id: "m4", name: "Priya Nair", email: "priya@mail.com", phone: "+91 98 4512 3344", emergency: "Ravi Nair +91 98 4512 0000", dietary: "Gluten-free", invite: "accepted", payment: "pending" },
  { id: "m5", name: "Lukas Weber", email: "lukas@mail.com", phone: "+49 30 1234 5678", emergency: "Anna Weber +49 30 8765 4321", dietary: "None", invite: "invited", payment: "pending" },
  { id: "m6", name: "Emma Laurent", email: "emma@mail.com", phone: "+33 1 4455 6677", emergency: "Paul Laurent +33 1 0000 1111", dietary: "Nut allergy", invite: "declined", payment: "pending" },
];

const seed = () => ({
  trip: { title: "Dubai & Desert Discovery", destination: "Dubai, UAE", start: "2026-11-12", end: "2026-11-16" },
  privacy: { showRoster: true, nameOnly: true, allowMessaging: true } as Privacy,
  currentTravelerId: "m2",
  members,
  days: [
    { day: 1, title: "Arrival & Welcome Dinner" },
    { day: 2, title: "Desert Safari & Quad Biking" },
    { day: 3, title: "Old Dubai & Souks" },
  ] as DayInfo[],
  itinerary: [
    { id: "i1", day: 1, time: "14:00", title: "Airport pickup", location: "Dubai International Airport T3", meals: [], notice: "Meet at Exit 4 — look for the WanderSync sign." },
    { id: "i2", day: 1, time: "16:00", title: "Hotel check-in", location: "Rove Downtown Dubai", meals: [] },
    { id: "i3", day: 1, time: "19:30", title: "Welcome dinner cruise", location: "Dubai Marina Walk", meals: ["Dinner: Group Booking"], notice: "Smart casual dress code." },
    { id: "i4", day: 2, time: "08:00", title: "Breakfast", location: "Rove Downtown Dubai", meals: ["Breakfast Included"] },
    { id: "i5", day: 2, time: "15:00", title: "Desert safari departure", location: "Hotel lobby", meals: ["Lunch: Self-pay"], notice: "Bring sunglasses, closed shoes and a scarf." },
    { id: "i6", day: 2, time: "19:00", title: "Bedouin camp BBQ", location: "Al Marmoom Desert Camp", meals: ["Dinner: Group Booking"] },
    { id: "i7", day: 3, time: "09:30", title: "Al Fahidi walking tour", location: "Al Fahidi Historical District", meals: ["Breakfast Included"], notice: "Bring comfortable walking shoes and passport." },
    { id: "i8", day: 3, time: "12:30", title: "Abra ride & Spice Souk", location: "Deira Old Souk Abra Station", meals: ["Lunch: Self-pay"] },
  ] as ItItem[],
  tickets: [
    { id: "t1", title: "EK 202 New York → Dubai", type: "flight", seat: "Seat 34A", date: "2026-11-12", assignedTo: "m2", qr: "EK202-34A-RIVERA" },
    { id: "t2", title: "Burj Khalifa — At the Top", type: "museum", seat: "Slot 17:30", date: "2026-11-14", assignedTo: "m2", qr: "BK-1730-0042" },
    { id: "t3", title: "Museum of the Future", type: "museum", seat: "GA #118", date: "2026-11-15", assignedTo: "m1", qr: "MOTF-118" },
    { id: "t4", title: "Dubai Metro Day Pass", type: "train", seat: "Zone 1–7", date: "2026-11-13", assignedTo: null, qr: "RTA-DAY-7781" },
  ] as Ticket[],
  addons: [
    { id: "a1", title: "Sunset Quad Biking", description: "45 minutes of dune bashing on your own quad as the sun sets.", price: 65, cutoff: "2026-11-11T18:00", image: "quad", methods: ["cash", "link"], paymentLink: "https://paypal.me/wandersync/65", bankNotes: "" },
    { id: "a2", title: "Scuba Diving at JBR", description: "PADI-guided intro dive, all equipment included.", price: 120, cutoff: "2026-11-10T12:00", image: "scuba", methods: ["link", "bank"], paymentLink: "https://paypal.me/wandersync/120", bankNotes: "IBAN AE07 0331 2345 6789 0123 456 — ref: your name + SCUBA" },
    { id: "a3", title: "Traditional Cooking Class", description: "Learn machboos and luqaimat with a local Emirati chef.", price: 45, cutoff: "2026-11-13T20:00", image: "cook", methods: ["cash", "link", "bank"], paymentLink: "https://paypal.me/wandersync/45", bankNotes: "IBAN AE07 0331 2345 6789 0123 456 — ref: COOK" },
  ] as Addon[],
  bookings: [
    { id: "b1", addonId: "a1", memberId: "m1", method: "cash", status: "pending" },
    { id: "b2", addonId: "a1", memberId: "m3", method: "link", status: "paid" },
    { id: "b3", addonId: "a3", memberId: "m4", method: "cash", status: "paid" },
  ] as Booking[],
  groups: [
    { id: "g1", name: "Room 304 Crew", members: ["m1", "m2", "m3"] },
    { id: "g2", name: "Hiking Buddies", members: ["m2", "m4"] },
  ] as ExpGroup[],
  expenses: [
    { id: "e1", groupId: "g1", paidBy: "m1", amount: 97.5, description: "Taxi + dinner at Ravi's", splitType: "equal", splits: computeSplits(97.5, ["m1", "m2", "m3"], "equal"), createdAt: now() },
    { id: "e2", groupId: "g1", paidBy: "m3", amount: 30, description: "Water & snacks", splitType: "equal", splits: computeSplits(30, ["m1", "m2", "m3"], "equal"), createdAt: now() },
  ] as Expense[],
  settlements: [] as Settlement[],
  sos: [] as Sos[],
  messages: [
    { id: "x1", channel: "broadcast", from: "organizer", text: "Welcome aboard! Airport pickup is at Exit 4, Terminal 3.", at: now() },
    { id: "x2", channel: "broadcast", from: "organizer", text: "Reminder: Desert safari leaves at 15:00 sharp tomorrow.", at: now() },
    { id: "x3", channel: "g1", from: "m1", text: "I covered dinner, added it to the pool 🙌", at: now() },
  ] as Msg[],
});

type State = ReturnType<typeof seed> & {
  set: <K extends keyof ReturnType<typeof seed>>(k: K, v: ReturnType<typeof seed>[K]) => void;
  setPrivacy: (p: Partial<Privacy>) => void;
  invite: (name: string, email: string) => void;
  addItem: (i: Omit<ItItem, "id">) => void;
  removeItem: (id: string) => void;
  addTicket: (t: Omit<Ticket, "id" | "qr">) => void;
  assignTicket: (id: string, memberId: string | null) => void;
  addAddon: (a: Omit<Addon, "id">) => void;
  book: (addonId: string, memberId: string, method: PayMethod) => void;
  markPaid: (bookingId: string) => void;
  addGroup: (name: string, members: string[]) => void;
  addExpense: (e: Omit<Expense, "id" | "createdAt">) => void;
  settle: (groupId: string, from: string, to: string, amount: number) => void;
  sendSos: (s: Omit<Sos, "id" | "at" | "status">) => void;
  resolveSos: (id: string) => void;
  sendMsg: (channel: string, from: string, text: string) => void;
  reset: () => void;
};

export const useApp = create<State>()(
  persist(
    (set) => ({
      ...seed(),
      set: (k, v) => set({ [k]: v } as never),
      setPrivacy: (p) => set((s) => ({ privacy: { ...s.privacy, ...p } })),
      invite: (name, email) => set((s) => ({ members: [...s.members, { id: uid(), name, email, phone: "—", emergency: "—", dietary: "—", invite: "invited", payment: "pending" }] })),
      addItem: (i) => set((s) => ({ itinerary: [...s.itinerary, { ...i, id: uid() }].sort((a, b) => a.day - b.day || a.time.localeCompare(b.time)), days: s.days.some((d) => d.day === i.day) ? s.days : [...s.days, { day: i.day, title: `Day ${i.day}` }].sort((a, b) => a.day - b.day) })),
      removeItem: (id) => set((s) => ({ itinerary: s.itinerary.filter((i) => i.id !== id) })),
      addTicket: (t) => set((s) => ({ tickets: [...s.tickets, { ...t, id: uid(), qr: `WS-${uid().toUpperCase()}` }] })),
      assignTicket: (id, memberId) => set((s) => ({ tickets: s.tickets.map((t) => (t.id === id ? { ...t, assignedTo: memberId } : t)) })),
      addAddon: (a) => set((s) => ({ addons: [...s.addons, { ...a, id: uid() }] })),
      book: (addonId, memberId, method) => set((s) => ({ bookings: [...s.bookings, { id: uid(), addonId, memberId, method, status: "pending" }] })),
      markPaid: (id) => set((s) => ({ bookings: s.bookings.map((b) => (b.id === id ? { ...b, status: "paid" } : b)) })),
      addGroup: (name, m) => set((s) => ({ groups: [...s.groups, { id: uid(), name, members: m }] })),
      addExpense: (e) => set((s) => ({ expenses: [...s.expenses, { ...e, id: uid(), createdAt: now() }] })),
      settle: (groupId, from, to, amount) => set((s) => ({ settlements: [...s.settlements, { id: uid(), groupId, from, to, amount }] })),
      sendSos: (x) => set((s) => ({ sos: [{ ...x, id: uid(), at: now(), status: "active" }, ...s.sos] })),
      resolveSos: (id) => set((s) => ({ sos: s.sos.map((x) => (x.id === id ? { ...x, status: "resolved" } : x)) })),
      sendMsg: (channel, from, text) => set((s) => ({ messages: [...s.messages, { id: uid(), channel, from, text, at: now() }] })),
      reset: () => set(seed()),
    }),
    { name: "wandersync-v1", skipHydration: true },
  ),
);

export const memberName = (id: string, list: Member[]) => (id === "organizer" ? "Tour Organizer" : list.find((m) => m.id === id)?.name ?? "Unknown");
export const money = (n: number) => `$${n.toFixed(2)}`;
