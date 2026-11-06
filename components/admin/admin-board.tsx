"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CalendarDays,
  GripVertical,
  LayoutGrid,
  List,
  Plus,
  Search,
} from "lucide-react";
import { moveTaskAction } from "@/app/admin/tasks/actions";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate, isOverdue } from "@/lib/format";
import {
  PRIORITIES,
  PRIORITY_META,
  priorityColor,
  priorityLabel,
} from "@/lib/priority";
import {
  STATUS_CODES,
  STATUS_META,
  statusColor,
  statusLabel,
} from "@/lib/status";
import type { AdminTask, ClientOption, ProjectOption } from "@/lib/types";
import { cn } from "@/lib/utils";

type ViewMode = "board" | "list";
type SortMode = "deadline" | "priority" | "created";

export function AdminBoard({
  tasks,
  projects,
  clients,
}: {
  tasks: AdminTask[];
  projects: ProjectOption[];
  clients: ClientOption[];
}) {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("board");
  const [sort, setSort] = useState<SortMode>("deadline");
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isPending, startTransition] = useTransition();

  const [optimisticTasks, applyMove] = useOptimistic(
    tasks,
    (
      state,
      move: { id: string; status_code: string; position: number },
    ) =>
      state.map((task) =>
        task.id === move.id
          ? {
              ...task,
              status_code: move.status_code,
              position: move.position,
            }
          : task,
      ),
  );

  const projectById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects],
  );

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return optimisticTasks.filter((task) => {
      if (projectFilter !== "all" && task.project_id !== projectFilter) {
        return false;
      }
      if (priorityFilter !== "all" && task.priority !== priorityFilter) {
        return false;
      }
      if (statusFilter !== "all" && task.status_code !== statusFilter) {
        return false;
      }
      if (clientFilter !== "all") {
        const project = projectById.get(task.project_id);
        if (!project || project.client_id !== clientFilter) return false;
      }
      if (needle) {
        const haystack =
          `${task.title} ${task.description ?? ""} ${task.project_name} ${task.client_name}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [
    optimisticTasks,
    search,
    projectFilter,
    clientFilter,
    priorityFilter,
    statusFilter,
    projectById,
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function columnTasks(status: string): AdminTask[] {
    return filtered
      .filter((task) => task.status_code === status)
      .sort(
        (a, b) =>
          a.position - b.position || a.created_at.localeCompare(b.created_at),
      );
  }

  const listTasks = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      if (sort === "priority") {
        return (
          (PRIORITY_META[b.priority as keyof typeof PRIORITY_META]?.order ?? 0) -
          (PRIORITY_META[a.priority as keyof typeof PRIORITY_META]?.order ?? 0)
        );
      }
      if (sort === "created") {
        return b.created_at.localeCompare(a.created_at);
      }
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return a.deadline.localeCompare(b.deadline);
    });
    return list;
  }, [filtered, sort]);

  function onDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    if (!overId) return;

    const activeTask = optimisticTasks.find((task) => task.id === activeId);
    if (!activeTask) return;

    const overTask = optimisticTasks.find((task) => task.id === overId);
    const toStatus = overId.startsWith("column:")
      ? overId.slice("column:".length)
      : overTask?.status_code;

    if (!toStatus) return;

    const targetList = columnTasks(toStatus).filter(
      (task) => task.id !== activeId,
    );

    let index = targetList.length;
    if (!overId.startsWith("column:")) {
      const overIndex = targetList.findIndex((task) => task.id === overId);
      if (overIndex >= 0) index = overIndex;
    }

    const previous = targetList[index - 1];
    const next = targetList[index];

    let position: number;
    if (!previous && !next) position = 1;
    else if (!previous) position = Math.max(0, (next?.position ?? 1) - 1);
    else if (!next) position = (previous?.position ?? 0) + 1;
    else position = ((previous?.position ?? 0) + (next?.position ?? 0)) / 2;

    if (activeTask.status_code === toStatus && activeTask.position === position) {
      return;
    }

    startTransition(async () => {
      applyMove({ id: activeId, status_code: toStatus, position });
      const result = await moveTaskAction({
        taskId: activeId,
        toStatus,
        position,
      });
      if (!result.ok) {
        toast.error(result.error ?? "Не удалось перенести задачу");
        router.refresh();
      }
    });
  }

  const hasFilters =
    search.trim() !== "" ||
    projectFilter !== "all" ||
    clientFilter !== "all" ||
    priorityFilter !== "all" ||
    statusFilter !== "all";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по задачам"
              className="w-56 pl-8"
              aria-label="Поиск по задачам"
            />
          </div>

          <select
            value={projectFilter}
            onChange={(event) => setProjectFilter(event.target.value)}
            aria-label="Фильтр по проекту"
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="all">Все проекты</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>

          <select
            value={clientFilter}
            onChange={(event) => setClientFilter(event.target.value)}
            aria-label="Фильтр по клиенту"
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="all">Все клиенты</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            aria-label="Фильтр по приоритету"
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="all">Все приоритеты</option>
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {PRIORITY_META[priority].label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Фильтр по статусу"
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="all">Все статусы</option>
            {STATUS_CODES.map((status) => (
              <option key={status} value={status}>
                {STATUS_META[status].label}
              </option>
            ))}
          </select>

          {hasFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setProjectFilter("all");
                setClientFilter("all");
                setPriorityFilter("all");
                setStatusFilter("all");
              }}
            >
              Сбросить
            </Button>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {isPending ? (
            <span className="text-xs text-muted-foreground">Сохраняем…</span>
          ) : null}

          <div className="flex rounded-lg border border-border/70 p-0.5">
            <button
              type="button"
              onClick={() => setView("board")}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs",
                view === "board"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutGrid className="size-3.5" /> Доска
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs",
                view === "list"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <List className="size-3.5" /> Список
            </button>
          </div>

          {view === "list" ? (
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortMode)}
              aria-label="Сортировка списка"
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="deadline">По дедлайну</option>
              <option value="priority">По приоритету</option>
              <option value="created">По созданию</option>
            </select>
          ) : null}

          <Link
            href="/admin/tasks/new"
            className={buttonVariants({ size: "sm", className: "gap-1" })}
          >
            <Plus className="size-4" /> Задача
          </Link>
        </div>
      </div>

      {optimisticTasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-10 text-center text-sm text-muted-foreground">
          Задач пока нет.{" "}
          <Link href="/admin/tasks/new" className="text-primary hover:underline">
            Создать первую
          </Link>
          .
        </div>
      ) : view === "board" ? (
        <DndContext
          id="admin-board"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <div className="flex gap-3 overflow-x-auto pb-4">
            {STATUS_CODES.map((status) => (
              <BoardColumn
                key={status}
                status={status}
                tasks={columnTasks(status)}
              />
            ))}
          </div>
        </DndContext>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card/40">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-border/70 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Задача</th>
                <th className="px-4 py-3 font-medium">Проект</th>
                <th className="px-4 py-3 font-medium">Статус</th>
                <th className="px-4 py-3 font-medium">Приоритет</th>
                <th className="px-4 py-3 font-medium">Дедлайн</th>
                <th className="px-4 py-3 font-medium">Создана</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {listTasks.map((task) => (
                <tr key={task.id} className="hover:bg-accent/40">
                  <td className="max-w-[320px] px-4 py-3">
                    <Link
                      href={`/admin/tasks/${task.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {task.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="block text-foreground">
                      {task.project_name}
                    </span>
                    <span className="text-xs">{task.client_name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={task.status_code} />
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className="gap-1.5 border-border/70"
                    >
                      <span
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: priorityColor(task.priority) }}
                      />
                      {priorityLabel(task.priority)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Deadline task={task} />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {formatDate(task.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className="gap-1.5 border-border/70"
      style={{ color: statusColor(status) }}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: statusColor(status) }}
      />
      {statusLabel(status)}
    </Badge>
  );
}

function Deadline({ task }: { task: AdminTask }) {
  if (!task.deadline) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  const overdue = isOverdue(task.deadline) && task.status_code !== "done";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs",
        overdue ? "text-destructive" : "text-muted-foreground",
      )}
    >
      <CalendarDays className="size-3.5" />
      {formatDate(task.deadline)}
    </span>
  );
}

function BoardColumn({
  status,
  tasks,
}: {
  status: (typeof STATUS_CODES)[number];
  tasks: AdminTask[];
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column:${status}`,
  });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex w-[280px] shrink-0 flex-col rounded-2xl border border-border/70 bg-card/40 p-2",
        isOver && "border-primary/50 bg-primary/5",
      )}
    >
      <header className="flex items-center justify-between px-1 py-2 text-sm">
        <span className="inline-flex items-center gap-2 font-medium">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: STATUS_META[status].color }}
          />
          {STATUS_META[status].label}
        </span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {tasks.length}
        </span>
      </header>

      <SortableContext
        items={tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex min-h-24 flex-col gap-2">
          {tasks.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border/70 px-3 py-6 text-center text-xs text-muted-foreground">
              Перетащите задачу сюда
            </p>
          ) : (
            tasks.map((task) => <SortableTaskCard key={task.id} task={task} />)
          )}
        </div>
      </SortableContext>
    </section>
  );
}

function SortableTaskCard({ task }: { task: AdminTask }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  return (
    <article
      ref={setNodeRef}
      style={{
        transform: transform ? CSS.Transform.toString(transform) : undefined,
        transition,
        borderLeftColor: priorityColor(task.priority),
      }}
      className={cn(
        "group rounded-xl border border-border/70 border-l-2 bg-card/80 p-3 shadow-sm",
        isDragging && "opacity-60",
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          aria-label="Перетащить задачу"
          className="mt-0.5 cursor-grab touch-none rounded p-0.5 text-muted-foreground/60 hover:text-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>

        <div className="min-w-0 flex-1">
          <Link
            href={`/admin/tasks/${task.id}`}
            className="line-clamp-2 text-sm font-medium leading-snug hover:text-primary"
          >
            {task.title}
          </Link>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {task.project_name} · {task.client_name}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="gap-1 border-border/70 text-[10px]"
            >
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: priorityColor(task.priority) }}
              />
              {priorityLabel(task.priority)}
            </Badge>
            {task.deadline ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-[11px]",
                  isOverdue(task.deadline) && task.status_code !== "done"
                    ? "text-destructive"
                    : "text-muted-foreground",
                )}
              >
                <CalendarDays className="size-3" />
                {formatDate(task.deadline)}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
