import { fileTypeFromBuffer } from "file-type";
import { imageSize } from "image-size";

export const MAX_IMAGE_PIXELS = 40_000_000;
export const MAX_IMAGE_SIDE = 8000;

type AllowedFile = {
  ext: string[];
  maxBytes: number;
  image: boolean;
};

export const ALLOWED_FILES: Record<string, AllowedFile> = {
  "image/jpeg": { ext: ["jpg", "jpeg"], maxBytes: 500 * 1024, image: true },
  "image/png": { ext: ["png"], maxBytes: 500 * 1024, image: true },
  "image/webp": { ext: ["webp"], maxBytes: 500 * 1024, image: true },
  "application/pdf": { ext: ["pdf"], maxBytes: 500 * 1024, image: false },
  "application/zip": { ext: ["zip"], maxBytes: 2 * 1024 * 1024, image: false },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    ext: ["docx"],
    maxBytes: 2 * 1024 * 1024,
    image: false,
  },
};

export type ValidatedFile = {
  buffer: Buffer;
  mimeType: string;
  extension: string;
  displayName: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
};

function normalizeDeclaredMime(value: string): string {
  const mime = value.toLowerCase();
  if (mime === "image/jpg" || mime === "image/pjpeg") return "image/jpeg";
  if (mime === "application/x-zip-compressed") return "application/zip";
  return mime;
}

function sanitizeName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "file";
  const cleaned = base
    .replace(/[^\p{L}\p{N}._ -]/gu, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  return cleaned || "file";
}

export async function validateUpload(
  file: File,
): Promise<ValidatedFile | { error: string }> {
  if (!file.name || file.size === 0) {
    return { error: "Файл пустой" };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length === 0) {
    return { error: "Файл пустой" };
  }

  const detected = await fileTypeFromBuffer(buffer);
  if (!detected) {
    return { error: "Не удалось определить тип файла" };
  }

  const allowed = ALLOWED_FILES[detected.mime];
  if (!allowed) {
    return { error: "Этот тип файла не разрешён" };
  }

  if (!allowed.ext.includes(detected.ext)) {
    return { error: "Расширение не совпадает с содержимым" };
  }

  const declared = normalizeDeclaredMime(file.type);
  if (declared && declared !== detected.mime) {
    return { error: "Заявленный тип не совпадает с содержимым" };
  }

  if (buffer.length > allowed.maxBytes) {
    return {
      error:
        allowed.maxBytes === 500 * 1024
          ? "Файл больше 500 КБ"
          : "Файл больше 2 МБ",
    };
  }

  let width: number | null = null;
  let height: number | null = null;

  if (allowed.image) {
    try {
      const size = imageSize(buffer);
      width = size.width ?? null;
      height = size.height ?? null;
    } catch {
      return { error: "Не удалось прочитать размеры изображения" };
    }

    if (!width || !height) {
      return { error: "Не удалось прочитать размеры изображения" };
    }
    if (
      width > MAX_IMAGE_SIDE ||
      height > MAX_IMAGE_SIDE ||
      width * height > MAX_IMAGE_PIXELS
    ) {
      return { error: "Изображение слишком большое" };
    }
  }

  return {
    buffer,
    mimeType: detected.mime,
    extension: detected.ext,
    displayName: sanitizeName(file.name),
    sizeBytes: buffer.length,
    width,
    height,
  };
}
