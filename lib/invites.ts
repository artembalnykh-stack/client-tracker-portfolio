import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { siteUrl } from "@/lib/env.server";

/** 32 random bytes, base64url. The plain token is shown once and never stored. */
export function generateInviteToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Only the SHA-256 hash is stored in `clients.invite_token_hash`. */
export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function buildInviteLink(token: string): string {
  return `${siteUrl().replace(/\/$/, "")}/invite?token=${encodeURIComponent(token)}`;
}

export type InviteStatus = "none" | "revoked" | "expired" | "active";

export function getInviteStatus(
  tokenHash: string | null,
  expiresAt: string | null,
  revokedAt: string | null,
): InviteStatus {
  if (!tokenHash) return "none";
  if (revokedAt) return "revoked";
  if (!expiresAt || new Date(expiresAt).getTime() <= Date.now()) {
    return "expired";
  }
  return "active";
}
