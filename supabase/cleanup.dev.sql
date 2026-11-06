-- Neyroflow — remove DEV test data created by seed.dev.sql.
-- Run only in a development database.

begin;

delete from public.audit_logs
where entity_id in (
  select t.id
  from public.tasks t
  join public.projects p on p.id = t.project_id
  join public.clients c on c.id = p.client_id
  where c.email like '%@example.test'
);

delete from public.clients
where email like '%@example.test';

commit;
