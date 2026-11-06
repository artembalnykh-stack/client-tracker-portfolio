"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { INVITE_TTL_DAYS } from "@/lib/constants";
import {
  buildInviteLink,
  generateInviteToken,
  hashInviteToken,
} from "@/lib/invites";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { clientCreateSchema } from "@/lib/validation/client";

export type ClientFormState = {
  error?: string;
};

export type InviteState = {
  link?: string;
  error?: string;
};

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function createClientAction(
  _prev: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const parsed = clientCreateSchema.safeParse({
    name: readString(formData, "name"),
    company: readString(formData, "company"),
    email: readString(formData, "email"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Проверьте поля формы",
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({
      name: parsed.data.name,
      company: parsed.data.company || null,
      email: parsed.data.email || null,
      is_demo: false,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Не удалось создать клиента" };
  }

  revalidatePath("/admin/clients");
  redirect(`/admin/clients/${data.id}`);
}

export async function issueInviteAction(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const clientId = readString(formData, "clientId");
  if (!clientId) return { error: "Клиент не найден" };

  const supabase = await createServerSupabaseClient();
  const { data: current, error: readError } = await supabase
    .from("clients")
    .select("id, session_version")
    .eq("id", clientId)
    .eq("is_demo", false)
    .maybeSingle();

  if (readError || !current) {
    return { error: "Клиент не найден" };
  }

  const token = generateInviteToken();
  const expiresAt = new Date(
    Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { error } = await supabase
    .from("clients")
    .update({
      invite_token_hash: hashInviteToken(token),
      invite_expires_at: expiresAt,
      invite_revoked_at: null,
      session_version: current.session_version + 1,
    })
    .eq("id", clientId)
    .eq("is_demo", false);

  if (error) {
    return { error: "Не удалось создать инвайт" };
  }

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${clientId}`);
  return { link: buildInviteLink(token) };
}

export async function revokeInviteAction(formData: FormData) {
  const clientId = readString(formData, "clientId");
  if (!clientId) return;

  const supabase = await createServerSupabaseClient();
  const { data: current, error: readError } = await supabase
    .from("clients")
    .select("id, session_version")
    .eq("id", clientId)
    .eq("is_demo", false)
    .maybeSingle();

  if (readError || !current) return;

  const { error } = await supabase
    .from("clients")
    .update({
      invite_token_hash: null,
      invite_revoked_at: new Date().toISOString(),
      session_version: current.session_version + 1,
    })
    .eq("id", clientId)
    .eq("is_demo", false);

  if (error) {
    throw new Error("Не удалось отозвать инвайт");
  }

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${clientId}`);
  redirect(`/admin/clients/${clientId}`);
}
