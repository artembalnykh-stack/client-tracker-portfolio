import type { Metadata } from "next";
import { AdminBoard } from "@/components/admin/admin-board";
import { listClients } from "@/lib/repositories/clients";
import { listAdminProjects } from "@/lib/repositories/projects";
import { listTasksForProjects } from "@/lib/repositories/tasks";
import type { AdminTask } from "@/lib/types";

export const metadata: Metadata = {
  title: "Задачи — Neyroflow",
};

export const dynamic = "force-dynamic";

export default async function AdminBoardPage() {
  const [clients, projects] = await Promise.all([
    listClients(),
    listAdminProjects(),
  ]);

  const tasks = await listTasksForProjects(projects.map((project) => project.id));

  const projectById = new Map(
    projects.map((project) => [project.id, project]),
  );
  const clientById = new Map(clients.map((client) => [client.id, client]));

  const mappedTasks: AdminTask[] = tasks.map((task) => {
    const project = projectById.get(task.project_id);
    return {
      ...task,
      project_name: project?.name ?? "Без проекта",
      client_name: project
        ? (clientById.get(project.client_id)?.name ?? "Без клиента")
        : "Без клиента",
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          Доска
        </p>
        <h1 className="mt-2 font-heading text-3xl font-extrabold tracking-tight">
          Задачи
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Перетаскивайте карточки между статусами. Фильтры и поиск работают в
          обоих режимах — доска и список.
        </p>
      </div>

      <AdminBoard
        tasks={mappedTasks}
        projects={projects}
        clients={clients.map((client) => ({
          id: client.id,
          name: client.name,
        }))}
      />
    </div>
  );
}
