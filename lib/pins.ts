export type RectLike = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

/**
 * Converts a click point to percentage coordinates inside the image content
 * box. The wrapper around the image has exactly the image's rendered size, so
 * no object-contain letterbox offset is needed.
 */
export function pointToPercent(
  clientX: number,
  clientY: number,
  rect: RectLike,
): { x: number; y: number } {
  if (rect.width <= 0 || rect.height <= 0) {
    return { x: 0, y: 0 };
  }

  return {
    x: clampPercent(((clientX - rect.left) / rect.width) * 100),
    y: clampPercent(((clientY - rect.top) / rect.height) * 100),
  };
}
