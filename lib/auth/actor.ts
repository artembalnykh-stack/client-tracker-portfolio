import "server-only";

import { getCurrentAdmin } from "@/lib/auth/require-admin";
import { getClientSession } from "@/lib/auth/client-session";

export type Actor = {
  type: "admin" | "client";
  id: string;
  name: string;
};

export async function getActor(): Promise<Actor | null> {
  const admin = await getCurrentAdmin();
  if (admin) {
    return { type: "admin", id: admin.id, name: admin.email ?? "Админ" };
  }

  const client = await getClientSession();
  if (client) {
    return { type: "client", id: client.id, name: client.name };
  }

  return null;
}
