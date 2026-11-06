import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

type AuditInput = {
  actorType: "admin" | "client" | "system";
  actorName?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  payload?: Record<string, unknown>;
};

/** Best-effort append-only audit. Never breaks the main action. */
export async function writeAudit(input: AuditInput): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("audit_logs").insert({
      actor_type: input.actorType,
      actor_name: input.actorName ?? null,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      payload: input.payload ?? null,
    });
  } catch {
    // Audit is best-effort by design.
  }
}
