"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  task_id: string | null;
  project_id: string | null;
  is_read: boolean;
  created_at: string;
};

type NotificationResponse = {
  items: NotificationItem[];
  unread: number;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/notifications", {
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = (await response.json()) as NotificationResponse;
        if (!cancelled) {
          setItems(data.items);
          setUnread(data.unread);
        }
      } catch {
        // Keep the previous state on a transient network error.
      }
    }

    void load();
    const timer = window.setInterval(load, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  async function markAll() {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "read_all" }),
      });
      if (!response.ok) return;
      const data = (await response.json()) as NotificationResponse;
      setItems(data.items);
      setUnread(data.unread);
    } catch {
      // Ignore.
    }
  }

  async function markOne(id: string) {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, is_read: true } : item,
      ),
    );
    setUnread((current) => Math.max(0, current - 1));
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "read", id }),
      });
    } catch {
      // Ignore; the next poll will reconcile.
    }
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Уведомления${unread > 0 ? `, непрочитанных: ${unread}` : ""}`}
        onClick={() => setOpen((value) => !value)}
        className="relative text-muted-foreground hover:text-foreground"
      >
        <Bell className="size-4" />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold leading-4 text-primary-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </Button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Закрыть уведомления"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-11 z-50 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border/80 bg-popover shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/70 px-3 py-2">
              <span className="text-sm font-semibold">Уведомления</span>
              {unread > 0 ? (
                <button
                  type="button"
                  onClick={markAll}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <CheckCheck className="size-3.5" /> Прочитать все
                </button>
              ) : null}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                  Пока тихо.
                </p>
              ) : (
                <ul className="divide-y divide-border/60">
                  {items.map((item) => {
                    const href = item.task_id
                      ? `/admin/tasks/${item.task_id}`
                      : "/admin";
                    return (
                      <li key={item.id}>
                        <Link
                          href={href}
                          onClick={() => {
                            if (!item.is_read) void markOne(item.id);
                            setOpen(false);
                          }}
                          className={cn(
                            "block px-3 py-2.5 transition-colors hover:bg-accent/60",
                            !item.is_read && "bg-primary/5",
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <span
                              className={cn(
                                "mt-1 size-1.5 shrink-0 rounded-full",
                                item.is_read
                                  ? "bg-muted-foreground/30"
                                  : "bg-primary",
                              )}
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium">
                                {item.title}
                              </p>
                              {item.body ? (
                                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                                  {item.body}
                                </p>
                              ) : null}
                              <p className="mt-1 text-[10px] text-muted-foreground/70">
                                {formatDateTime(item.created_at)}
                              </p>
                            </div>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
