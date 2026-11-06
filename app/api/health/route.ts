import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = createAdminClient();

    const [statusesResult, bucketsResult] = await Promise.all([
      admin.from("statuses").select("*", { count: "exact", head: true }),
      admin.storage.listBuckets(),
    ]);

    const dbOk = !statusesResult.error;
    const statuses = statusesResult.count ?? 0;
    const storageOk =
      !bucketsResult.error &&
      Boolean(
        bucketsResult.data?.some((bucket) => bucket.name === "attachments"),
      );
    const ok = dbOk && storageOk && statuses === 6;

    return NextResponse.json(
      { ok, db: dbOk, storage: storageOk, statuses },
      {
        status: ok ? 200 : 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch {
    return NextResponse.json(
      { ok: false, db: false, storage: false, statuses: 0 },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
