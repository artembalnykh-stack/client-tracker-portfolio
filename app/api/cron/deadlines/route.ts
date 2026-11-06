import { NextResponse, type NextRequest } from "next/server";
import { writeAudit } from "@/lib/audit";
import { cronSecret } from "@/lib/env.server";
import { todayInMoscow } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function tomorrow(date: string): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  const expected = `Bearer ${cronSecret()}`;
  if (request.headers.get("authorization") !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const targetDate = tomorrow(todayInMoscow());

  try {
    const { data: tasks, error: tasksError } = await admin
      .from("tasks")
      .select("id, title, project_id")
      .eq("deadline", targetDate)
      .neq("status_code", "done");

    if (tasksError) throw new Error(tasksError.message);
    if (!tasks || tasks.length === 0) {
      await writeAudit({
        actorType: "system",
        actorName: "Vercel Cron",
        action: "cron.deadlines",
        entityType: "cron",
        payload: { date: targetDate, tasks: 0 },
      });
      return NextResponse.json({
        ok: true,
        date: targetDate,
        tasks: 0,
        notifications: 0,
      });
    }

    const projectIds = [...new Set(tasks.map((task) => task.project_id))];
    const { data: projects, error: projectsError } = await admin
      .from("projects")
      .select("id, name, client_id, is_demo")
      .in("id", projectIds)
      .eq("is_demo", false);

    if (projectsError) throw new Error(projectsError.message);

    const projectsById = new Map(
      (projects ?? []).map((project) => [project.id, project]),
    );

    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    const rows: Array<{
      recipient_type: "admin" | "client";
      recipient_id: string;
      type: "deadline";
      title: string;
      body: string;
      task_id: string;
      project_id: string;
      dedupe_key: string;
    }> = [];

    for (const task of tasks) {
      const project = projectsById.get(task.project_id);
      if (!project) continue;

      const body = `«${task.title}» — дедлайн завтра (${targetDate}).`;
      if (profile) {
        rows.push({
          recipient_type: "admin",
          recipient_id: profile.id,
          type: "deadline",
          title: "Дедлайн завтра",
          body,
          task_id: task.id,
          project_id: project.id,
          dedupe_key: `deadline:${task.id}:${targetDate}:admin`,
        });
      }

      rows.push({
        recipient_type: "client",
        recipient_id: project.client_id,
        type: "deadline",
        title: "Дедлайн завтра",
        body,
        task_id: task.id,
        project_id: project.id,
        dedupe_key: `deadline:${task.id}:${targetDate}:client`,
      });
    }

    let inserted = 0;
    if (rows.length > 0) {
      const { data: created, error } = await admin
        .from("notifications")
        .upsert(rows, {
          onConflict: "dedupe_key",
          ignoreDuplicates: true,
        })
        .select("id");
      if (error) throw new Error(error.message);
      inserted = created?.length ?? 0;
    }

    await writeAudit({
      actorType: "system",
      actorName: "Vercel Cron",
      action: "cron.deadlines",
      entityType: "cron",
      payload: {
        date: targetDate,
        tasks: tasks.length,
        notifications: inserted,
      },
    });

    return NextResponse.json({
      ok: true,
      date: targetDate,
      tasks: tasks.length,
      notifications: inserted,
    });
  } catch {
    return NextResponse.json(
      { error: "Cron failed" },
      { status: 500 },
    );
  }
}
