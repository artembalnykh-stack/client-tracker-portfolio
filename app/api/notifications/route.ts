import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { siteUrl } from "@/lib/env.server";
import {
  getNotificationActor,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(siteUrl()).origin;
  } catch {
    return false;
  }
}

export async function GET() {
  const actor = await getNotificationActor();
  if (!actor) {
    return NextResponse.json(
      { error: "Нужен вход" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const result = await listNotifications(actor);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Не удалось загрузить уведомления" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Неверный origin" }, { status: 403 });
  }

  const actor = await getNotificationActor();
  if (!actor) {
    return NextResponse.json({ error: "Нужен вход" }, { status: 401 });
  }

  let body: { action?: unknown; id?: unknown };
  try {
    body = (await request.json()) as { action?: unknown; id?: unknown };
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  if (body.action === "read_all") {
    await markAllNotificationsRead(actor);
  } else if (body.action === "read") {
    const parsed = z.string().uuid().safeParse(body.id);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректное уведомление" },
        { status: 400 },
      );
    }
    await markNotificationRead(actor, parsed.data);
  } else {
    return NextResponse.json(
      { error: "Неизвестное действие" },
      { status: 400 },
    );
  }

  try {
    const result = await listNotifications(actor);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Не удалось обновить уведомления" },
      { status: 500 },
    );
  }
}
