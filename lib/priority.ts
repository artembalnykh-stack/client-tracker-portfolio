export const PRIORITIES = ["low", "normal", "high", "urgent"] as const;

export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_META: Record<
  Priority,
  { label: string; color: string; order: number }
> = {
  low: { label: "Низкий", color: "#64748b", order: 1 },
  normal: { label: "Обычный", color: "#3b82f6", order: 2 },
  high: { label: "Высокий", color: "#f59e0b", order: 3 },
  urgent: { label: "Срочный", color: "#ef4444", order: 4 },
};

export function isPriority(value: string): value is Priority {
  return (PRIORITIES as readonly string[]).includes(value);
}

export function priorityLabel(value: string): string {
  return isPriority(value) ? PRIORITY_META[value].label : value;
}
