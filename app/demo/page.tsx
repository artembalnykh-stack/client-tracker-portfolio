import Link from "next/link";
import { ArrowRight, FolderKanban } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { listDemoProjects } from "@/lib/repositories/demo";

export const dynamic = "force-dynamic";

export default async function DemoPage() {
  const projects = await listDemoProjects();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          Демо
        </p>
        <h1 className="mt-3 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
          Доска глазами клиента
        </h1>
        <p className="mt-4 text-muted-foreground">
          Два вымышленных проекта, задачи в шести статусах и комментарии с
          пинами. Без регистрации и без реальных данных.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {projects.map((project) => (
          <Card
            key={project.id}
            className="border-border/70 bg-card/70 transition-colors hover:border-primary/40"
          >
            <CardHeader>
              <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <FolderKanban className="size-4 text-primary" />
                {project.client_name}
              </div>
              <h2 className="font-heading text-2xl font-bold">
                {project.name}
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                {project.description || "Описание проекта."}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{project.task_count} задач</span>
                <span>с {formatDate(project.created_at)}</span>
              </div>
              <Link
                href={`/demo/projects/${project.id}`}
                className={buttonVariants({
                  variant: "outline",
                  className: "w-full gap-2",
                })}
              >
                Открыть проект <ArrowRight className="size-4" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Хотите так же для своей студии?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Вход для владельца
        </Link>
        .
      </p>
    </div>
  );
}
