"use server";

import { redirect } from "next/navigation";
import { setClientSessionCookie } from "@/lib/auth/client-session";
import { getInviteStatus, hashInviteToken } from "@/lib/invites";
import { rateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { inviteTokenSchema } from "@/lib/validation/client";

export async function acceptInviteAction(formData: FormData) {
  const raw = formData.get("token");
  const parsed = inviteTokenSchema.safeParse(
    typeof raw === "string" ? raw : "",
  );

  if (!parsed.success) {
    redirect("/invite?error=invalid");
  }

  const token = parsed.data;
  const tokenHash = hashInviteToken(token);

  if (!rateLimit(`invite:${tokenHash}`, 10, 60_000)) {
    redirect("/invite?error=rate");
  }

  const admin = createAdminClient();
  const { data: client } = await admin
    .from("clients")
    .select(
      "id, session_version, invite_expires_at, invite_revoked_at, is_demo",
    )
    .eq("invite_token_hash", tokenHash)
    .maybeSingle();

  const valid =
    client &&
    !client.is_demo &&
    getInviteStatus(
      tokenHash,
      client.invite_expires_at,
      client.invite_revoked_at,
    ) === "active";

  if (!valid || !client) {
    redirect("/invite?error=invalid");
  }

  try {
    await setClientSessionCookie(client.id, client.session_version);
  } catch {
    redirect("/invite?error=config");
  }

  redirect("/client");
}
