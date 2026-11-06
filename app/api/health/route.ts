import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function describeServiceKey(token: string | undefined) {
  if (!token) return { keyFormat: "missing" as const };
  if (token.startsWith("sb_secret_")) return { keyFormat: "sb_secret" as const };
  if (token.startsWith("sb_publishable_")) {
    return { keyFormat: "sb_publishable" as const };
  }
  if (!token.startsWith("eyJ")) return { keyFormat: "other" as const };

  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf8"),
    ) as { role?: unknown };
    return {
      keyRole: typeof payload.role === "string" ? payload.role : "unknown",
    };
  } catch {
    return { keyRole: "invalid-jwt" as const };
  }
}

function supabaseProjectRef(): string | null {
  try {
    const host = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
    return host.split(".")[0] ?? null;
  } catch {
    return null;
  }
}

function supabaseUrlPath(): string | null {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").pathname;
  } catch {
    return null;
  }
}

export async function GET() {
  // Diagnostics are development-only: no key material is ever returned.
  const diagnostics =
    process.env.NODE_ENV === "production"
      ? {}
      : {
          ...describeServiceKey(process.env.SUPABASE_SERVICE_ROLE_KEY),
          projectRef: supabaseProjectRef(),
          urlPath: supabaseUrlPath(),
          sessionSecret: Boolean(process.env.CLIENT_SESSION_SECRET),
          cronSecret: Boolean(process.env.CRON_SECRET),
        };

  try {
    const admin = createAdminClient();

    const [statusesResult, bucketsResult] = await Promise.all([
      admin.from("statuses").select("code"),
      admin.storage.listBuckets(),
    ]);

    const dbOk = !statusesResult.error;
    const statuses = statusesResult.data?.length ?? 0;
    const storageOk =
      !bucketsResult.error &&
      Boolean(
        bucketsResult.data?.some((bucket) => bucket.name === "attachments"),
      );
    const ok = dbOk && storageOk && statuses === 6;
    const errors =
      process.env.NODE_ENV === "production"
        ? {}
        : {
            dbError: statusesResult.error
              ? {
                  code: statusesResult.error.code,
                  message: statusesResult.error.message.slice(0, 200),
                }
              : null,
            storageError: bucketsResult.error
              ? bucketsResult.error.message.slice(0, 200)
              : null,
          };

    return NextResponse.json(
      { ok, db: dbOk, storage: storageOk, statuses, ...diagnostics, ...errors },
      {
        status: ok ? 200 : 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    const caught =
      process.env.NODE_ENV === "production"
        ? {}
        : {
            errorMessage:
              error instanceof Error
                ? error.message.slice(0, 200)
                : "unknown error",
          };

    return NextResponse.json(
      {
        ok: false,
        db: false,
        storage: false,
        statuses: 0,
        ...diagnostics,
        ...caught,
      },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
