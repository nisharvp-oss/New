import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  tripId: z.string().uuid(),
  destination: z.string().min(2).max(120),
  startDate: z.string().min(8).max(10),
  endDate: z.string().min(8).max(10),
  interests: z.string().max(500),
});

export type AiItineraryItem = { day: number; time: string; title: string; location: string; notice: string; meals: string[] };

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["items"],
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["day", "time", "title", "location", "notice", "meals"],
        properties: {
          day: { type: "integer" },
          time: { type: "string", description: "HH:MM 24h" },
          title: { type: "string" },
          location: { type: "string" },
          notice: { type: "string", description: "Short tip; for meal stops name 1-2 suggested local dishes or restaurants" },
          meals: { type: "array", items: { type: "string", enum: ["Breakfast", "Lunch", "Dinner", "Snacks"] } },
        },
      },
    },
  },
};

export const generateItinerary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }): Promise<{ items: AiItineraryItem[]; error?: string }> => {
    // Only staff may write itinerary; check via RLS-visible staff helper.
    const { data: trip } = await context.supabase.from("trips").select("id").eq("id", data.tripId).maybeSingle();
    if (!trip) return { items: [], error: "Trip not found or no access." };
    const days = Math.round((Date.parse(data.endDate) - Date.parse(data.startDate)) / 86400000) + 1;
    if (!(days >= 1 && days <= 21)) return { items: [], error: "Dates must span 1 to 21 days." };

    const key = process.env['LOVABLE_API_KEY'];
    if (!key) return { items: [], error: "AI is not configured." };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch", "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        instructions: "You are an expert group-tour planner. Produce realistic, well-paced day-by-day group itineraries with 4-7 entries per day, including breakfast, lunch and dinner stops with specific local meal suggestions.",
        input: `Destination: ${data.destination}\nDates: ${data.startDate} to ${data.endDate} (${days} days, day 1 = ${data.startDate})\nTraveler interests: ${data.interests || "general sightseeing"}`,
        text: { format: { type: "json_schema", name: "itinerary", strict: true, schema } },
      }),
    });
    if (!res.ok || !res.body) {
      console.error("AI gateway", res.status, await res.text().catch(() => ""));
      if (res.status === 429) return { items: [], error: "Too many requests right now, try again in a minute." };
      if (res.status === 402) return { items: [], error: "AI credits are used up. Add credits in Settings → Plans & credits." };
      return { items: [], error: `AI request failed (${res.status}).` };
    }

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "", text = "", refusal = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const ev = JSON.parse(payload);
          if (ev.type === "response.output_text.delta") text += ev.delta;
          else if (ev.type === "response.refusal.delta") refusal += ev.delta;
          else if (ev.type === "error" || ev.type === "response.failed") return { items: [], error: "AI generation failed." };
        } catch { /* partial */ }
      }
    }
    if (refusal) return { items: [], error: "The AI declined this request." };
    try {
      const parsed = JSON.parse(text) as { items: AiItineraryItem[] };
      return { items: parsed.items.filter((x) => x.day >= 1 && x.day <= days) };
    } catch {
      return { items: [], error: "AI returned an unreadable plan." };
    }
  });
