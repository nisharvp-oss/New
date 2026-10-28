import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Scope = { companyId: string | null }; // null = platform

async function assertCanManage(ctx: { supabase: any; userId: string }, scope: Scope) {
  if (scope.companyId === null) {
    const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "super_admin" });
    if (!data) throw new Error("Only the platform admin can change these settings");
  } else {
    const { data } = await ctx.supabase.rpc("company_role_of", { _company: scope.companyId, _user: ctx.userId });
    if (data !== "owner") throw new Error("Only the company owner can change these settings");
  }
}

export const saveSmtpPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Scope & { password: string }) => {
    if (!d.password || d.password.length > 500) throw new Error("Enter a password");
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertCanManage(context, data);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const q = supabaseAdmin.from("smtp_secrets");
    const existing = data.companyId
      ? await q.select("id").eq("company_id", data.companyId).maybeSingle()
      : await q.select("id").eq("is_platform", true).maybeSingle();
    if (existing.data) {
      const { error } = await supabaseAdmin.from("smtp_secrets").update({ password: data.password, updated_at: new Date().toISOString() }).eq("id", existing.data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("smtp_secrets").insert({ company_id: data.companyId, is_platform: data.companyId === null, password: data.password });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const hasSmtpPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Scope) => d)
  .handler(async ({ data, context }) => {
    await assertCanManage(context, data);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const q = supabaseAdmin.from("smtp_secrets").select("id");
    const r = data.companyId ? await q.eq("company_id", data.companyId).maybeSingle() : await q.eq("is_platform", true).maybeSingle();
    return { saved: !!r.data };
  });

export const sendTestEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Scope & { to: string }) => {
    if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(d.to)) throw new Error("Enter a valid email address");
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertCanManage(context, data);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const settings = data.companyId
      ? (await supabaseAdmin.from("companies").select("smtp_host,smtp_port,smtp_secure,smtp_user,smtp_from_name,smtp_from_email").eq("id", data.companyId).single()).data
      : (await supabaseAdmin.from("platform_settings").select("smtp_host,smtp_port,smtp_secure,smtp_user,smtp_from_name,smtp_from_email").eq("id", 1).single()).data;
    const secretQ = supabaseAdmin.from("smtp_secrets").select("password");
    const secret = data.companyId ? (await secretQ.eq("company_id", data.companyId).maybeSingle()).data : (await secretQ.eq("is_platform", true).maybeSingle()).data;
    if (!settings?.smtp_host || !settings.smtp_user || !settings.smtp_from_email || !secret) {
      return { ok: false, error: "Save the server, username, from address and password first." };
    }
    try {
      const { sendMail } = await import("./smtp.server");
      await sendMail(
        { host: settings.smtp_host, port: settings.smtp_port ?? 465, secure: settings.smtp_secure === "starttls" ? "starttls" : "tls",
          user: settings.smtp_user, password: secret.password, fromName: settings.smtp_from_name || "WanderSync", fromEmail: settings.smtp_from_email },
        { to: data.to, subject: "WanderSync test email", text: "Your mail settings work. Emails from WanderSync will be sent through this server." },
      );
      return { ok: true, error: null as string | null };
    } catch (e) {
      console.error("smtp test failed", e);
      return { ok: false, error: e instanceof Error ? e.message : "Could not reach the mail server" };
    }
  });

/** Emails a posted trip announcement to every traveler, through the trip company's own mail settings. */
export const emailAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { messageId: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(d.messageId)) throw new Error("Invalid announcement");
    return d;
  })
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: msg } = await sb.from("trip_messages").select("trip_id,author,text").eq("id", data.messageId).maybeSingle();
    if (!msg) return { sent: 0, failed: 0, error: "Announcement not found" as string | null };
    const { data: staff } = await sb.rpc("is_trip_staff", { _trip: msg.trip_id, _user: context.userId });
    if (!staff) return { sent: 0, failed: 0, error: "Only trip staff can email travelers" };
    const { data: trip } = await sb.from("trips").select("title,company_id").eq("id", msg.trip_id).single();
    const { data: travelers } = await sb.from("trip_travelers").select("email").eq("trip_id", msg.trip_id);
    const emails = [...new Set((travelers ?? []).map((t) => t.email.trim().toLowerCase()).filter((e) => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(e)))];
    if (!trip || emails.length === 0) return { sent: 0, failed: 0, error: "No traveler emails on this trip" };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const settings = (await supabaseAdmin.from("companies").select("name,smtp_host,smtp_port,smtp_secure,smtp_user,smtp_from_name,smtp_from_email").eq("id", trip.company_id).single()).data;
    const secret = (await supabaseAdmin.from("smtp_secrets").select("password").eq("company_id", trip.company_id).maybeSingle()).data;
    if (!settings?.smtp_host || !settings.smtp_user || !settings.smtp_from_email || !secret) {
      return { sent: 0, failed: 0, error: "Company mail settings aren't set up yet (Company → Mail settings)." };
    }
    const { sendMail } = await import("./smtp.server");
    const cfg = { host: settings.smtp_host, port: settings.smtp_port ?? 465, secure: (settings.smtp_secure === "starttls" ? "starttls" : "tls") as "starttls" | "tls",
      user: settings.smtp_user, password: secret.password, fromName: settings.smtp_from_name || settings.name, fromEmail: settings.smtp_from_email };
    let sent = 0, failed = 0;
    for (const to of emails) {
      try {
        await sendMail(cfg, { to, subject: `Update: ${trip.title}`, text: `${msg.text}\n\n— ${msg.author}, ${settings.name}\n\nOpen your trip in WanderSync for details.` });
        sent++;
      } catch (e) { console.error("announcement mail failed", e); failed++; }
    }
    return { sent, failed, error: null };
  });
