export const STATUS_CODES = [
  "new",
  "in_progress",
  "waiting_client",
  "on_review",
  "needs_rework",
  "done",
] as const;

export type StatusCode = (typeof STATUS_CODES)[number];

export const STATUS_META: Record<
  StatusCode,
  { label: string; color: string; sortOrder: number; isTerminal: boolean }
> = {
  new: { label: "Новая", color: "#64748b", sortOrder: 1, isTerminal: false },
  in_progress: {
    label: "В работе",
    color: "#3b82f6",
    sortOrder: 2,
    isTerminal: false,
  },
  waiting_client: {
    label: "Жду клиента",
    color: "#f59e0b",
    sortOrder: 3,
    isTerminal: false,
  },
  on_review: {
    label: "На проверке",
    color: "#8b5cf6",
    sortOrder: 4,
    isTerminal: false,
  },
  needs_rework: {
    label: "На доработке",
    color: "#ef4444",
    sortOrder: 5,
    isTerminal: false,
  },
  done: { label: "Принято", color: "#22c55e", sortOrder: 6, isTerminal: true },
};

export const CLIENT_TRANSITIONS: Partial<
  Record<StatusCode, readonly StatusCode[]>
> = {
  waiting_client: ["in_progress"],
  on_review: ["done", "needs_rework"],
};

export const CLIENT_STATUS_ACTIONS: Partial<
  Record<StatusCode, { to: StatusCode; label: string }>
> = {
  waiting_client: { to: "in_progress", label: "Я ответил" },
  on_review: { to: "done", label: "Принять" },
};

export function isStatusCode(value: string): value is StatusCode {
  return (STATUS_CODES as readonly string[]).includes(value);
}

export function statusLabel(code: string): string {
  return isStatusCode(code) ? STATUS_META[code].label : code;
}

export function statusColor(code: string): string {
  return isStatusCode(code) ? STATUS_META[code].color : "#64748b";
}

export function canClientTransition(from: string, to: string): boolean {
  if (!isStatusCode(from) || !isStatusCode(to)) return false;
  return CLIENT_TRANSITIONS[from]?.includes(to) ?? false;
}
