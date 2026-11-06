-- Neyroflow — initial schema (Stage 1)
-- Apply in Supabase SQL Editor as one transaction.
-- The user applies this file; the agent never reads .env.local or service keys.

begin;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'admin' check (role in ('admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  email text,
  is_demo boolean not null default false,
  invite_token_hash text unique,
  invite_expires_at timestamptz,
  invite_revoked_at timestamptz,
  session_version integer not null default 0 check (session_version >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  description text,
  is_archived boolean not null default false,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.statuses (
  code text primary key,
  name text not null,
  color text not null,
  sort_order integer not null unique,
  is_terminal boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  status_code text not null default 'new' references public.statuses(code),
  title text not null,
  description text,
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),
  deadline date,
  position numeric not null default 0 check (position >= 0),
  created_by uuid references public.profiles(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.task_relations (
  id uuid primary key default gen_random_uuid(),
  parent_task_id uuid not null references public.tasks(id) on delete cascade,
  child_task_id uuid not null references public.tasks(id) on delete cascade,
  relation_type text not null default 'parent_child'
    check (relation_type in ('parent_child')),
  created_at timestamptz not null default now(),
  unique (parent_task_id, child_task_id),
  check (parent_task_id <> child_task_id)
);

-- comments is created before attachments; the pin FK is added after attachments.
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  author_type text not null check (author_type in ('admin', 'client', 'demo')),
  author_id uuid,
  author_name text not null,
  body text not null,
  pinned_attachment_id uuid,
  pin_x numeric(5, 2) check (pin_x between 0 and 100),
  pin_y numeric(5, 2) check (pin_y between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (pinned_attachment_id is null and pin_x is null and pin_y is null)
    or (pinned_attachment_id is not null and pin_x is not null and pin_y is not null)
  )
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  uploaded_by_type text not null check (uploaded_by_type in ('admin', 'client', 'demo')),
  uploaded_by_name text,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  storage_path text not null unique,
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  created_at timestamptz not null default now(),
  check (((task_id is not null)::int + (comment_id is not null)::int) = 1)
);

alter table public.comments
  drop constraint if exists comments_pinned_attachment_fk;
alter table public.comments
  add constraint comments_pinned_attachment_fk
  foreign key (pinned_attachment_id)
  references public.attachments(id)
  on delete set null;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_type text not null check (recipient_type in ('admin', 'client')),
  recipient_id uuid not null,
  type text not null check (type in ('comment', 'status_change', 'file', 'deadline')),
  title text not null,
  body text,
  task_id uuid references public.tasks(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  is_read boolean not null default false,
  dedupe_key text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.task_status_history (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by_type text not null check (changed_by_type in ('admin', 'client', 'system')),
  changed_by_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_type text not null check (actor_type in ('admin', 'client', 'system')),
  actor_name text,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  payload jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists tasks_board_idx
  on public.tasks (project_id, status_code, position);
create index if not exists tasks_deadline_idx on public.tasks (deadline);
create index if not exists tasks_priority_idx on public.tasks (priority);
create index if not exists tasks_project_created_idx
  on public.tasks (project_id, created_at desc);
create index if not exists projects_client_idx on public.projects (client_id);
create index if not exists projects_demo_idx on public.projects (is_demo);
create index if not exists comments_task_created_idx
  on public.comments (task_id, created_at);
create index if not exists attachments_task_idx on public.attachments (task_id);
create index if not exists attachments_comment_idx on public.attachments (comment_id);
create index if not exists notifications_recipient_idx
  on public.notifications (recipient_type, recipient_id, is_read, created_at desc);
create index if not exists history_task_created_idx
  on public.task_status_history (task_id, created_at);
create index if not exists audit_created_idx on public.audit_logs (created_at desc);
create index if not exists audit_entity_idx on public.audit_logs (entity_type, entity_id);
create index if not exists relations_parent_idx on public.task_relations (parent_task_id);
create index if not exists relations_child_idx on public.task_relations (child_task_id);

-- ---------------------------------------------------------------------------
-- Functions and triggers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at_clients on public.clients;
create trigger set_updated_at_clients
  before update on public.clients
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_projects on public.projects;
create trigger set_updated_at_projects
  before update on public.projects
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_tasks on public.tasks;
create trigger set_updated_at_tasks
  before update on public.tasks
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_comments on public.comments;
create trigger set_updated_at_comments
  before update on public.comments
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, coalesce(new.email, ''), 'admin')
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.record_task_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_type text := coalesce(
    nullif(current_setting('app.actor_type', true), ''),
    'system'
  );
  v_actor_name text := nullif(current_setting('app.actor_name', true), '');
begin
  if new.status_code is distinct from old.status_code then
    insert into public.task_status_history (
      task_id, from_status, to_status, changed_by_type, changed_by_name
    )
    values (
      new.id, old.status_code, new.status_code, v_actor_type, v_actor_name
    );
  end if;
  return new;
end;
$$;

drop trigger if exists task_status_history_trigger on public.tasks;
create trigger task_status_history_trigger
  after update of status_code on public.tasks
  for each row execute function public.record_task_status_change();

create or replace function public.change_task_status(
  p_task_id uuid,
  p_to_status text,
  p_actor_type text,
  p_actor_name text default null
)
returns public.tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task public.tasks;
  v_from text;
  v_status_name text;
  v_client_id uuid;
  v_admin_id uuid;
  v_allowed boolean := false;
begin
  if p_actor_type not in ('admin', 'client') then
    raise exception 'invalid_actor_type' using errcode = '22023';
  end if;

  if not exists (select 1 from public.statuses where code = p_to_status) then
    raise exception 'unknown_status' using errcode = '22023';
  end if;

  select * into v_task
  from public.tasks
  where id = p_task_id
  for update;

  if not found then
    raise exception 'task_not_found' using errcode = 'P0002';
  end if;

  v_from := v_task.status_code;

  if v_from = p_to_status then
    return v_task;
  end if;

  if p_actor_type = 'admin' then
    v_allowed := true;
  else
    v_allowed :=
      (v_from = 'waiting_client' and p_to_status = 'in_progress')
      or (v_from = 'on_review' and p_to_status in ('done', 'needs_rework'));
  end if;

  if not v_allowed then
    raise exception 'status_transition_not_allowed' using errcode = '42501';
  end if;

  perform set_config('app.actor_type', p_actor_type, true);
  perform set_config('app.actor_name', coalesce(p_actor_name, ''), true);

  update public.tasks
  set status_code = p_to_status,
      completed_at = case when p_to_status = 'done' then now() else null end
  where id = p_task_id
  returning * into v_task;

  select name into v_status_name from public.statuses where code = p_to_status;

  select p.client_id into v_client_id
  from public.projects p
  where p.id = v_task.project_id;

  if p_actor_type = 'admin' then
    insert into public.notifications (
      recipient_type, recipient_id, type, title, body, task_id, project_id
    )
    values (
      'client',
      v_client_id,
      'status_change',
      'Статус задачи изменён',
      format('«%s»: %s', v_task.title, v_status_name),
      v_task.id,
      v_task.project_id
    );
  else
    select id into v_admin_id
    from public.profiles
    where role = 'admin'
    order by created_at
    limit 1;

    if v_admin_id is not null then
      insert into public.notifications (
        recipient_type, recipient_id, type, title, body, task_id, project_id
      )
      values (
        'admin',
        v_admin_id,
        'status_change',
        'Клиент изменил статус',
        format('«%s»: %s', v_task.title, v_status_name),
        v_task.id,
        v_task.project_id
      );
    end if;
  end if;

  insert into public.audit_logs (
    actor_type, actor_name, action, entity_type, entity_id, payload
  )
  values (
    p_actor_type,
    p_actor_name,
    'task.status',
    'task',
    v_task.id,
    jsonb_build_object('from', v_from, 'to', p_to_status)
  );

  return v_task;
end;
$$;

create or replace function public.enforce_attachment_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_key text;
begin
  if new.task_id is null and new.comment_id is null then
    return new;
  end if;

  if new.task_id is not null then
    v_key := 'task:' || new.task_id::text;
    perform pg_advisory_xact_lock(hashtext(v_key));
    select count(*) into v_count
    from public.attachments
    where task_id = new.task_id;
  else
    v_key := 'comment:' || new.comment_id::text;
    perform pg_advisory_xact_lock(hashtext(v_key));
    select count(*) into v_count
    from public.attachments
    where comment_id = new.comment_id;
  end if;

  if v_count >= 4 then
    raise exception 'attachment_limit_reached' using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists attachment_limit_trigger on public.attachments;
create trigger attachment_limit_trigger
  before insert on public.attachments
  for each row execute function public.enforce_attachment_limit();

create or replace function public.clear_comment_pin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.comments
  set pinned_attachment_id = null,
      pin_x = null,
      pin_y = null
  where pinned_attachment_id = old.id;
  return old;
end;
$$;

drop trigger if exists comment_pin_cleanup on public.attachments;
create trigger comment_pin_cleanup
  before delete on public.attachments
  for each row execute function public.clear_comment_pin();

create or replace function public.validate_comment_pin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attachment public.attachments;
begin
  if new.pinned_attachment_id is null then
    return new;
  end if;

  select * into v_attachment
  from public.attachments
  where id = new.pinned_attachment_id;

  if not found then
    raise exception 'pin_attachment_not_found' using errcode = '23503';
  end if;

  if v_attachment.task_id is null or v_attachment.task_id <> new.task_id then
    raise exception 'pin_attachment_not_in_task' using errcode = '23514';
  end if;

  if v_attachment.mime_type not like 'image/%' then
    raise exception 'pin_attachment_not_image' using errcode = '23514';
  end if;

  if new.pin_x is null or new.pin_y is null then
    raise exception 'pin_coordinates_required' using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists comment_pin_validate on public.comments;
create trigger comment_pin_validate
  before insert or update on public.comments
  for each row execute function public.validate_comment_pin();

create or replace function public.prevent_relation_cycles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    with recursive descendants as (
      select child_task_id
      from public.task_relations
      where parent_task_id = new.child_task_id
        and id <> new.id
      union all
      select tr.child_task_id
      from public.task_relations tr
      join descendants d on tr.parent_task_id = d.child_task_id
      where tr.id <> new.id
    )
    select 1
    from descendants
    where child_task_id = new.parent_task_id
  ) then
    raise exception 'task_relation_cycle' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists task_relation_cycle_trigger on public.task_relations;
create trigger task_relation_cycle_trigger
  before insert or update on public.task_relations
  for each row execute function public.prevent_relation_cycles();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.statuses enable row level security;
alter table public.tasks enable row level security;
alter table public.task_relations enable row level security;
alter table public.attachments enable row level security;
alter table public.comments enable row level security;
alter table public.notifications enable row level security;
alter table public.task_status_history enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = 'admin');

drop policy if exists statuses_select on public.statuses;
create policy statuses_select
  on public.statuses for select to authenticated
  using (true);

drop policy if exists clients_admin_all on public.clients;
create policy clients_admin_all
  on public.clients for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists projects_admin_all on public.projects;
create policy projects_admin_all
  on public.projects for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists tasks_admin_all on public.tasks;
create policy tasks_admin_all
  on public.tasks for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists task_relations_admin_all on public.task_relations;
create policy task_relations_admin_all
  on public.task_relations for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists attachments_admin_all on public.attachments;
create policy attachments_admin_all
  on public.attachments for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists comments_admin_all on public.comments;
create policy comments_admin_all
  on public.comments for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists notifications_admin_all on public.notifications;
create policy notifications_admin_all
  on public.notifications for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists history_admin_select on public.task_status_history;
create policy history_admin_select
  on public.task_status_history for select to authenticated
  using (public.is_admin());

drop policy if exists history_admin_insert on public.task_status_history;
create policy history_admin_insert
  on public.task_status_history for insert to authenticated
  with check (public.is_admin());

drop policy if exists audit_admin_select on public.audit_logs;
create policy audit_admin_select
  on public.audit_logs for select to authenticated
  using (public.is_admin());

drop policy if exists audit_admin_insert on public.audit_logs;
create policy audit_admin_insert
  on public.audit_logs for insert to authenticated
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Grants: anon has no table access; authenticated is admin-only via RLS.
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon, authenticated;
grant usage on schema public to anon, authenticated, service_role;

grant select on public.statuses to authenticated;
grant select, insert, update, delete
  on public.clients,
     public.projects,
     public.tasks,
     public.task_relations,
     public.attachments,
     public.comments,
     public.notifications
  to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert on public.task_status_history to authenticated;
grant select, insert on public.audit_logs to authenticated;
grant all on all tables in schema public to service_role;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.record_task_status_change() from public, anon, authenticated;
revoke all on function public.enforce_attachment_limit() from public, anon, authenticated;
revoke all on function public.clear_comment_pin() from public, anon, authenticated;
revoke all on function public.validate_comment_pin() from public, anon, authenticated;
revoke all on function public.prevent_relation_cycles() from public, anon, authenticated;
revoke all on function public.is_admin() from public, anon;
revoke all on function public.change_task_status(uuid, text, text, text)
  from public, anon;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.change_task_status(uuid, text, text, text)
  to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Storage bucket: private, service-role access only.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'attachments',
  'attachments',
  false,
  2097152,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/zip',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

commit;
