import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type AttachmentRow = {
  id: string;
  task_id: string | null;
  comment_id: string | null;
  uploaded_by_type: string;
  uploaded_by_name: string | null;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  width: number | null;
  height: number | null;
  created_at: string;
};

export async function listTaskAttachments(
  taskId: string,
): Promise<AttachmentRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("attachments")
    .select(
      "id, task_id, comment_id, uploaded_by_type, uploaded_by_name, file_name, mime_type, size_bytes, storage_path, width, height, created_at",
    )
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function signedAttachmentUrls(
  storagePath: string,
  fileName: string,
): Promise<{ url: string | null; downloadUrl: string | null }> {
  try {
    const admin = createAdminClient();
    const bucket = admin.storage.from("attachments");
    const [preview, download] = await Promise.all([
      bucket.createSignedUrl(storagePath, 3600),
      bucket.createSignedUrl(storagePath, 3600, { download: fileName }),
    ]);
    return {
      url: preview.error ? null : (preview.data?.signedUrl ?? null),
      downloadUrl: download.error
        ? null
        : (download.data?.signedUrl ?? null),
    };
  } catch {
    return { url: null, downloadUrl: null };
  }
}
