-- Neyroflow — DESTRUCTIVE reset for local/staging only.
-- Drops every public object created by 0001_init.sql and removes the bucket.
-- Never run against production.

begin;

drop trigger if exists on_auth_user_created on auth.users;

drop table if exists public.audit_logs cascade;
drop table if exists public.task_status_history cascade;
drop table if exists public.notifications cascade;
drop table if exists public.attachments cascade;
drop table if exists public.comments cascade;
drop table if exists public.task_relations cascade;
drop table if exists public.tasks cascade;
drop table if exists public.statuses cascade;
drop table if exists public.projects cascade;
drop table if exists public.clients cascade;
drop table if exists public.profiles cascade;

drop function if exists public.change_task_status(uuid, text, text, text);
drop function if exists public.prevent_relation_cycles();
drop function if exists public.validate_comment_pin();
drop function if exists public.clear_comment_pin();
drop function if exists public.enforce_attachment_limit();
drop function if exists public.record_task_status_change();
drop function if exists public.is_admin();
drop function if exists public.handle_new_user();
drop function if exists public.set_updated_at();

delete from storage.buckets where id = 'attachments';

commit;
