import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getClientSession } from "@/lib/auth/client-session";
import { getCurrentAdmin } from "@/lib/auth/require-admin";

export type NotificationActor = {
  type: "admin" | "client";
  id: string;
  name: string;
};

export async function getNotificationActor(): Promise<NotificationActor | null> {
  const admin = await getCurrentAdmin();
  if (admin) {
    return {
      type: "admin",
      id: admin.id,
      name: admin.email ?? "Админ",
    };
  }

  const client = await getClientSession();
  if (client) {
    return { type: "client", id: client.id, name: client.name };
  }

  return null;
}

export type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  task_id: string | null;
  project_id: string | null;
  is_read: boolean;
  created_at: string;
};

export async function listNotifications(
  actor: NotificationActor,
): Promise<{ items: NotificationRow[]; unread: number }> {
  const admin = createAdminClient();
  const [itemsResult, unreadResult] = await Promise.all([
    admin
      .from("notifications")
      .select("id, type, title, body, task_id, project_id, is_read, created_at")
      .eq("recipient_type", actor.type)
      .eq("recipient_id", actor.id)
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_type", actor.type)
      .eq("recipient_id", actor.id)
      .eq("is_read", false),
  ]);

  if (itemsResult.error) throw new Error(itemsResult.error.message);
  if (unreadResult.error) throw new Error(unreadResult.error.message);

  return { items: itemsResult.data ?? [], unread: unreadResult.count ?? 0 };
}

export async function markNotificationRead(
  actor: NotificationActor,
  id: string,
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("recipient_type", actor.type)
    .eq("recipient_id", actor.id);
  return !error;
}

export async function markAllNotificationsRead(
  actor: NotificationActor,
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("notifications")
    .update({ is_read: true })
    .eq("recipient_type", actor.type)
    .eq("recipient_id", actor.id)
    .eq("is_read", false);
  return !error;
}
