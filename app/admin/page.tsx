import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FolderKanban, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { listClients } from "@/lib/repositories/clients";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Дашборд — Neyroflow",
};

export default async function AdminDashboardPage() {
  const supabase = await createServerSupabaseClient();

  const [clientsResult, projectsResult, clients] = await Promise.all([
    supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("is_demo", false),
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("is_demo", false),
    listClients(),
  ]);

  const clientsCount = clientsResult.count ?? 0;
  const projectsCount = projectsResult.count ?? 0;
  const recentClients = clients.slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Дашборд
          </p>
          <h1 className="mt-2 font-heading text-3xl font-extrabold tracking-tight">
            Рабочий стол
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Канбан и задачи появятся на Stage 3. Пока — клиенты и проекты.
          </p>
        </div>
        <Link href="/admin/clients" className={buttonVariants()}>
          <Users className="size-4" /> Клиенты
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border/70 bg-card/70">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="size-4" /> Клиенты
            </div>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-4xl font-extrabold">{clientsCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              реальные клиенты, без демо
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/70">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FolderKanban className="size-4" /> Проекты
            </div>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-4xl font-extrabold">
              {projectsCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              активные и архивные
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/25 bg-primary/5">
          <CardHeader className="pb-2">
            <div className="text-sm text-muted-foreground">Демо</div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Публичная доска с вымышленными данными.
            </p>
            <Link
              href="/demo"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "mt-3",
              })}
            >
              Открыть демо <ArrowRight className="size-3.5" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 bg-card/70">
        <CardHeader>
          <h2 className="font-heading text-lg font-bold">Последние клиенты</h2>
        </CardHeader>
        <CardContent>
          {recentClients.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Пока нет клиентов.{" "}
              <Link href="/admin/clients" className="text-primary hover:underline">
                Создать первого
              </Link>
              .
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {recentClients.map((client) => (
                <li key={client.id}>
                  <Link
                    href={`/admin/clients/${client.id}`}
                    className="flex items-center justify-between gap-4 py-3 text-sm transition-colors hover:text-primary"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {client.name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {client.company || client.email || "Без контактов"}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(client.created_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
