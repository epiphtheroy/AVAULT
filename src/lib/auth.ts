import { supabaseServer } from "./supabase/server";

/** API-route guard: the single admin, or a valid cron secret. */
export async function requireAdmin(req?: Request): Promise<{ ok: boolean; actor: string }> {
  if (req) {
    const auth = req.headers.get("authorization");
    if (process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`) {
      return { ok: true, actor: "system" };
    }
  }
  try {
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase();
    if (user && (!adminEmail || user.email?.toLowerCase() === adminEmail)) {
      return { ok: true, actor: "wonwoo" };
    }
  } catch {
    // fall through
  }
  return { ok: false, actor: "anonymous" };
}
