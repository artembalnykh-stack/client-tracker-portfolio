"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Download,
  FileArchive,
  FileText,
  ImageIcon,
  Paperclip,
  Trash2,
  Upload,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatBytes, formatDateTime } from "@/lib/format";

export type TaskAttachmentItem = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  url: string | null;
  downloadUrl: string | null;
  uploadedByName: string | null;
  uploadedByType: string;
  createdAt: string;
};

const MAX_ATTACHMENTS = 4;

export function TaskAttachments({
  taskId,
  items,
  readOnly = false,
  deleteMode = "all",
}: {
  taskId: string;
  items: TaskAttachmentItem[];
  readOnly?: boolean;
  deleteMode?: "all" | "client" | "none";
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const full = items.length >= MAX_ATTACHMENTS;

  function canDeleteItem(item: TaskAttachmentItem): boolean {
    if (readOnly || deleteMode === "none") return false;
    if (deleteMode === "all") return true;
    return item.uploadedByType === "client";
  }

  async function upload(file: File) {
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("taskId", taskId);

      const response = await fetch("/api/attachments", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Не удалось загрузить файл");
        return;
      }

      toast.success("Файл загружен");
      router.refresh();
    } catch {
      setError("Не удалось загрузить файл");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove(id: string) {
    setError(null);
    try {
      const response = await fetch("/api/attachments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Не удалось удалить файл");
        return;
      }
      setConfirmId(null);
      toast.success("Файл удалён");
      router.refresh();
    } catch {
      setError("Не удалось удалить файл");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {items.length} из {MAX_ATTACHMENTS}. JPEG, PNG, WebP, PDF до 500 КБ;
          ZIP и DOCX до 2 МБ.
        </p>

        <div className="flex items-center gap-2">
          {!readOnly ? (
            <>
              <input
                ref={inputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf,.zip,.docx"
                aria-label="Загрузить файл"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void upload(file);
                }}
              />
              <Button
                type="button"
                size="sm"
                disabled={full || uploading}
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="size-3.5" />
                {uploading
                  ? "Загружаем…"
                  : full
                    ? "Лимит 4 файла"
                    : "Загрузить"}
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
          Файлов пока нет.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const isImage = item.mimeType.startsWith("image/");
            const download = item.downloadUrl ?? item.url;
            return (
              <li
                key={item.id}
                className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/50 p-3 sm:flex-row sm:items-center"
              >
                <div className="shrink-0">
                  {isImage && item.url ? (
                    <Image
                      src={item.url}
                      alt={item.fileName}
                      width={item.width ?? 96}
                      height={item.height ?? 96}
                      unoptimized
                      className="h-20 w-20 rounded-lg border border-border/60 object-cover"
                    />
                  ) : (
                    <div className="grid size-20 place-items-center rounded-lg border border-border/60 bg-muted/40 text-muted-foreground">
                      {item.mimeType === "application/pdf" ? (
                        <FileText className="size-7" />
                      ) : item.mimeType === "application/zip" ? (
                        <FileArchive className="size-7" />
                      ) : isImage ? (
                        <ImageIcon className="size-7" />
                      ) : (
                        <Paperclip className="size-7" />
                      )}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.fileName}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatBytes(item.sizeBytes)}
                    {item.uploadedByName ? ` · ${item.uploadedByName}` : ""} ·{" "}
                    {formatDateTime(item.createdAt)}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {download ? (
                    <a
                      href={download}
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                        className: "gap-1",
                      })}
                      download
                    >
                      <Download className="size-3.5" /> Скачать
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Ссылка недоступна
                    </span>
                  )}

                  {!readOnly && canDeleteItem(item) ? (
                    confirmId === item.id ? (
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => void remove(item.id)}
                        >
                          Да
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmId(null)}
                        >
                          Нет
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Удалить ${item.fileName}`}
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setConfirmId(item.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
