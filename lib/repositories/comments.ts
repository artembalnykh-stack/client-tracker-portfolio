import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type TaskCommentRow = {
  id: string;
  task_id: string;
  author_type: string;
  author_id: string | null;
  author_name: string;
  body: string;
  pinned_attachment_id: string | null;
  pin_x: number | null;
  pin_y: number | null;
  created_at: string;
};

export type CommentAttachmentRow = {
  id: string;
  comment_id: string | null;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  width: number | null;
  height: number | null;
  created_at: string;
};

export async function listTaskComments(
  taskId: string,
): Promise<TaskCommentRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("comments")
    .select(
      "id, task_id, author_type, author_id, author_name, body, pinned_attachment_id, pin_x, pin_y, created_at",
    )
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listCommentAttachments(
  commentIds: string[],
): Promise<CommentAttachmentRow[]> {
  if (commentIds.length === 0) return [];

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("attachments")
    .select(
      "id, comment_id, file_name, mime_type, size_bytes, storage_path, width, height, created_at",
    )
    .in("comment_id", commentIds)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}
