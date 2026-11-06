export type AdminTask = {
  id: string;
  project_id: string;
  status_code: string;
  title: string;
  description: string | null;
  priority: string;
  deadline: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  project_name: string;
  client_name: string;
};

export type AdminTaskRow = Omit<
  AdminTask,
  "project_name" | "client_name"
>;

export type ProjectOption = {
  id: string;
  name: string;
  client_id: string;
  client_name: string;
  is_archived: boolean;
};

export type ClientOption = {
  id: string;
  name: string;
};

export type TaskOption = {
  id: string;
  title: string;
  status_code: string;
};

export type RelationRow = {
  id: string;
  parent_task_id: string;
  child_task_id: string;
};

export type HistoryRow = {
  id: string;
  from_status: string | null;
  to_status: string;
  changed_by_type: string;
  changed_by_name: string | null;
  created_at: string;
};
