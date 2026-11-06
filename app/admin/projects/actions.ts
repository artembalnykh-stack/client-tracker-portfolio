"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
  const { error } = await supabase.from("projects").insert({
    client_id: parsed.data.clientId,
    name: parsed.data.name,
    description: parsed.data.description || null,
    is_demo: false,
  });

  if (error) {
    return { error: "Не удалось создать проект" };
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/clients/${parsed.data.clientId}`);
  redirect(`/admin/clients/${parsed.data.clientId}`);
}
