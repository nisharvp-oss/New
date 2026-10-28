import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Provider = "paypal" | "stripe";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "super_admin" });
  if (!data) throw new Error("Only a platform admin can change payment accounts");
}

export const savePaymentSecret = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { provider: Provider; secret: string }) => {
    if (d.provider !== "paypal" && d.provider !== "stripe") throw new Error("Unknown provider");
    if (!d.secret || d.secret.length > 500) throw new Error("Enter the secret key");
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("payment_secrets").upsert({ provider: data.provider, secret: data.secret.trim(), updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const paymentSecretStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("payment_secrets").select("provider");
    const set = new Set((data ?? []).map((r) => r.provider));
    return { paypal: set.has("paypal"), stripe: set.has("stripe") };
  });
