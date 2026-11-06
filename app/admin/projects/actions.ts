"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeAudit } from "@/lib/audit";
import { getCurrentAdmin } from "@/lib/auth/require-admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { projectCreateSchema } from "@/lib/validation/project";

export type ProjectFormState = {
  error?: string;
};

export async function createProjectAction(
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const parsed = projectCreateSchema.safeParse({
    clientId: String(formData.get("clientId") ?? ""),
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Проверьте поля формы",
    };
  }

  const user = await getCurrentAdmin();
  if (!user) return { error: "Нужен вход админа" };

  const supabase = await createServerSupabaseClient();
  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      client_id: parsed.data.clientId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      is_demo: false,
    })
    .select("id")
    .single();

  if (error || !project) {
    return { error: "Не удалось создать проект" };
  }

  await writeAudit({
    actorType: "admin",
    actorName: user.email ?? "Админ",
    action: "project.create",
    entityType: "project",
    entityId: project.id,
    payload: {
      clientId: parsed.data.clientId,
      name: parsed.data.name,
    },
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/clients/${parsed.data.clientId}`);
  redirect(`/admin/clients/${parsed.data.clientId}`);
}
