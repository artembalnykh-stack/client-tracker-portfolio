"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ImageIcon,
  MapPin,
  Paperclip,
  Send,
  Trash2,
  X,
} from "lucide-react";
import {
  createCommentAction,
  deleteCommentAction,
} from "@/app/comments/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatBytes, formatDateTime } from "@/lib/format";
import { pointToPercent } from "@/lib/pins";
import { cn } from "@/lib/utils";

export type TaskCommentAttachment = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  url: string | null;
  downloadUrl: string | null;
  createdAt: string;
};

export type TaskComment = {
  id: string;
  authorType: string;
  authorId: string | null;
  authorName: string;
  body: string;
  pinnedAttachmentId: string | null;
  pinX: number | null;
  pinY: number | null;
  createdAt: string;
  attachments: TaskCommentAttachment[];
};

export type PinImageAttachment = {
  id: string;
  fileName: string;
  url: string;
  width: number | null;
  height: number | null;
};

type Actor = {
  type: "admin" | "client";
  id: string;
  name: string;
};

const MARKER_COLORS = ["#22d3ee", "#8b5cf6", "#f472b6", "#f59e0b"];

export function TaskComments({
  taskId,
  images,
  comments,
  actor,
  readOnly = false,
}: {
  taskId: string;
  images: PinImageAttachment[];
  comments: TaskComment[];
  actor: Actor | null;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const commentRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const imageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const generalInputRef = useRef<HTMLInputElement>(null);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(
    null,
  );
  const [modal, setModal] = useState<{
    attachmentId: string;
    x: number;
    y: number;
  } | null>(null);
  const [pinBody, setPinBody] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [postingPin, setPostingPin] = useState(false);
  const [generalBody, setGeneralBody] = useState("");
  const [generalFiles, setGeneralFiles] = useState<File[]>([]);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function pinsFor(attachmentId: string): TaskComment[] {
    return comments.filter(
      (comment) =>
        comment.pinnedAttachmentId === attachmentId &&
        comment.pinX !== null &&
        comment.pinY !== null,
    );
  }

  function selectComment(id: string) {
    setSelectedCommentId(id);
    const comment = comments.find((item) => item.id === id);
    if (comment?.pinnedAttachmentId) {
      imageRefs.current[comment.pinnedAttachmentId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
    commentRefs.current[id]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  function canDelete(comment: TaskComment): boolean {
    if (readOnly || !actor) return false;
    if (actor.type === "admin") return true;
    return comment.authorType === "client" && comment.authorId === actor.id;
  }

  async function submitPin() {
    if (!modal) return;
    const body = pinBody.trim();
    if (!body) {
      setPinError("Введите комментарий");
      return;
    }

    setPostingPin(true);
    setPinError(null);
    const result = await createCommentAction({
      taskId,
      body,
      pinnedAttachmentId: modal.attachmentId,
      pinX: modal.x,
      pinY: modal.y,
    });
    setPostingPin(false);

    if (!result.ok) {
      setPinError(result.error ?? "Не удалось сохранить комментарий");
      return;
    }

    setModal(null);
    setPinBody("");
    toast.success("Комментарий добавлен");
    router.refresh();
  }

  async function submitGeneral() {
    const body = generalBody.trim();
    if (!body) {
      setGeneralError("Введите комментарий");
      return;
    }
    if (generalFiles.length > 4) {
      setGeneralError("К комментарию можно прикрепить не больше 4 файлов");
      return;
    }

    setPosting(true);
    setGeneralError(null);

    const result = await createCommentAction({ taskId, body });
    if (!result.ok || !result.id) {
      setPosting(false);
      setGeneralError(result.error ?? "Не удалось сохранить комментарий");
      return;
    }

    let uploadFailed = false;
    for (const file of generalFiles) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("commentId", result.id);
      const response = await fetch("/api/attachments", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) uploadFailed = true;
    }

    setPosting(false);
    setGeneralBody("");
    setGeneralFiles([]);
    if (generalInputRef.current) generalInputRef.current.value = "";
    if (uploadFailed) {
      toast.error("Комментарий сохранён, но часть файлов не загрузилась");
    } else {
      toast.success("Комментарий добавлен");
    }
    router.refresh();
  }

  async function removeComment(id: string) {
    const result = await deleteCommentAction(id);
    if (result.ok) {
      setConfirmDeleteId(null);
      toast.success("Комментарий удалён");
      router.refresh();
    } else {
      toast.error(result.error ?? "Не удалось удалить комментарий");
    }
  }

  return (
    <div className="space-y-6">
      {images.length > 0 ? (
        <div className="space-y-4">
          {images.map((image) => {
            const pins = pinsFor(image.id);
            return (
              <div key={image.id} className="space-y-2">
                <div
                  ref={(node) => {
                    imageRefs.current[image.id] = node;
                  }}
                  className="relative w-full overflow-hidden rounded-xl border border-border/70 bg-muted/20"
                >
                  <Image
                    src={image.url}
                    alt={image.fileName}
                    width={image.width ?? 1200}
                    height={image.height ?? 800}
                    unoptimized
                    className="block h-auto w-full"
                  />
                  {!readOnly ? (
                    <button
                      type="button"
                      aria-label="Оставить комментарий на изображении"
                      className="absolute inset-0 z-10 cursor-crosshair"
                      onClick={(event) => {
                        const rect =
                          event.currentTarget.getBoundingClientRect();
                        const point = pointToPercent(
                          event.clientX,
                          event.clientY,
                          rect,
                        );
                        setPinBody("");
                        setPinError(null);
                        setModal({
                          attachmentId: image.id,
                          x: point.x,
                          y: point.y,
                        });
                      }}
                    />
                  ) : null}

                  {pins.map((comment, index) => (
                    <button
                      key={comment.id}
                      type="button"
                      aria-label={`Пин ${index + 1}: ${comment.body.slice(0, 40)}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        selectComment(comment.id);
                      }}
                      style={{
                        left: `${Number(comment.pinX)}%`,
                        top: `${Number(comment.pinY)}%`,
                        backgroundColor:
                          MARKER_COLORS[index % MARKER_COLORS.length],
                      }}
                      className={cn(
                        "absolute z-20 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-slate-950 text-xs font-bold text-slate-950 shadow-lg transition-transform hover:scale-110",
                        selectedCommentId === comment.id && "scale-110 ring-4 ring-primary/40",
                      )}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {readOnly
                    ? "Клик по пину — показать комментарий."
                    : "Клик по изображению — оставить комментарий в точке."}
                </p>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="space-y-3">
        <h3 className="font-heading text-lg font-bold">
          Комментарии{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({comments.length})
          </span>
        </h3>

        {comments.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
            Комментариев пока нет.
          </p>
        ) : (
          <ul className="space-y-3">
            {comments.map((comment) => {
              const isPin = Boolean(comment.pinnedAttachmentId);
              return (
                <li
                  key={comment.id}
                  id={`comment-${comment.id}`}
                  ref={(node) => {
                    commentRefs.current[comment.id] = node;
                  }}
                  className={cn(
                    "rounded-xl border border-border/70 bg-card/60 p-4 transition-colors",
                    selectedCommentId === comment.id &&
                      "border-primary/50 bg-primary/5",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">
                      {comment.authorName}
                    </span>
                    <Badge
                      variant="outline"
                      className="border-border/60 text-[10px]"
                    >
                      {comment.authorType === "admin"
                        ? "студия"
                        : comment.authorType === "client"
                          ? "клиент"
                          : "демо"}
                    </Badge>
                    {isPin ? (
                      <Badge
                        variant="outline"
                        className="gap-1 border-primary/30 text-[10px] text-primary"
                      >
                        <MapPin className="size-3" /> пин
                      </Badge>
                    ) : null}
                    <span className="ml-auto text-[11px] text-muted-foreground">
                      {formatDateTime(comment.createdAt)}
                    </span>
                  </div>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                    {comment.body}
                  </p>

                  {isPin ? (
                    <button
                      type="button"
                      onClick={() => selectComment(comment.id)}
                      className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <MapPin className="size-3" /> Показать на изображении
                    </button>
                  ) : null}

                  {comment.attachments.length > 0 ? (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {comment.attachments.map((file) => (
                        <li key={file.id}>
                          {file.mimeType.startsWith("image/") && file.url ? (
                            <a
                              href={file.downloadUrl ?? file.url}
                              download
                              aria-label={`Скачать ${file.fileName}`}
                              className="block"
                            >
                              <Image
                                src={file.url}
                                alt={file.fileName}
                                width={96}
                                height={96}
                                unoptimized
                                className="size-20 rounded-lg border border-border/60 object-cover"
                              />
                            </a>
                          ) : (
                            <a
                              href={file.downloadUrl ?? file.url ?? "#"}
                              download
                              className="inline-flex items-center gap-1 rounded-lg border border-border/60 px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                            >
                              <Paperclip className="size-3" />
                              {file.fileName} ({formatBytes(file.sizeBytes)})
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {canDelete(comment) ? (
                    <div className="mt-2">
                      {confirmDeleteId === comment.id ? (
                        <span className="inline-flex items-center gap-2 text-xs">
                          Удалить?
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => void removeComment(comment.id)}
                          >
                            Да
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            Нет
                          </Button>
                        </span>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => setConfirmDeleteId(comment.id)}
                        >
                          <Trash2 className="size-3.5" /> Удалить
                        </Button>
                      )}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {!readOnly ? (
        <div className="rounded-xl border border-border/70 bg-card/50 p-4">
          <h3 className="font-heading text-base font-bold">
            Новый комментарий
          </h3>
          <textarea
            value={generalBody}
            onChange={(event) => setGeneralBody(event.target.value)}
            rows={3}
            maxLength={5000}
            placeholder="Написать комментарий…"
            className="mt-3 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <Paperclip className="size-3.5" />
              Файлы
              <input
                ref={generalInputRef}
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.webp,.pdf,.zip,.docx"
                aria-label="Прикрепить файлы к комментарию"
                className="sr-only"
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? []);
                  setGeneralFiles(files.slice(0, 4));
                }}
              />
            </label>
            {generalFiles.length > 0 ? (
              <span className="text-xs text-muted-foreground">
                {generalFiles.length} файл(а)
              </span>
            ) : null}
            <Button
              type="button"
              size="sm"
              disabled={posting}
              onClick={() => void submitGeneral()}
              className="ml-auto gap-1"
            >
              <Send className="size-3.5" />
              {posting ? "Отправляем…" : "Отправить"}
            </Button>
          </div>
          {generalError ? (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {generalError}
            </p>
          ) : null}
        </div>
      ) : null}

      {modal ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Комментарий к изображению"
          className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-4"
          onKeyDown={(event) => {
            if (event.key === "Escape") setModal(null);
          }}
        >
          <button
            type="button"
            aria-label="Закрыть"
            className="absolute inset-0"
            onClick={() => setModal(null)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-border/80 bg-card p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="inline-flex items-center gap-2 font-heading text-lg font-bold">
                <ImageIcon className="size-4 text-primary" /> Комментарий к
                изображению
              </h3>
              <button
                type="button"
                aria-label="Закрыть"
                onClick={() => setModal(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Точка: {modal.x.toFixed(1)}% / {modal.y.toFixed(1)}%
            </p>
            <textarea
              autoFocus
              value={pinBody}
              onChange={(event) => setPinBody(event.target.value)}
              rows={4}
              maxLength={5000}
              placeholder="Что поправить в этом месте?"
              className="mt-3 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            />
            {pinError ? (
              <p role="alert" className="mt-2 text-sm text-destructive">
                {pinError}
              </p>
            ) : null}
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setModal(null)}
              >
                Отмена
              </Button>
              <Button
                type="button"
                disabled={postingPin}
                onClick={() => void submitPin()}
              >
                {postingPin ? "Сохраняем…" : "Оставить пин"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
