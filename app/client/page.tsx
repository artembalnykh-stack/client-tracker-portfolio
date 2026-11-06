import Link from "next/link";
import { ArrowRight, FolderKanban } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { getClientSession } from "@/lib/auth/client-session";
import { listClientProjects } from "@/lib/repositories/client-portal";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ClientProjectsPage() {
  const client = await getClientSession();
  if (!client) return null;

  const projects = await listClientProjects(client.id);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          Мои проекты
        </p>
        <h1 className="mt-2 font-heading text-3xl font-extrabold tracking-tight">
          {client.name}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Здесь появятся задачи, комментарии и согласование. Доска — на Stage 4.
        </p>
      </div>

      {projects.length === 0 ? (
        <Card className="border-dashed border-border/70 bg-card/40">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Пока нет проектов. Студия добавит их в ближайшее время.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="border-border/70 bg-card/70 transition-colors hover:border-primary/35"
            >
              <CardHeader>
                <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <FolderKanban className="size-4 text-primary" />
                  Проект
                </div>
                <h2 className="font-heading text-xl font-bold">
                  {project.name}
                </h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="line-clamp-3 text-sm text-muted-foreground">
                  {project.description || "Описание появится позже."}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    с {formatDate(project.created_at)}
                  </span>
                  <Link
                    href={`/client/projects/${project.id}`}
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                      className: "gap-1",
                    })}
                  >
                    Открыть <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
