-- Neyroflow — DEV-ONLY test clients for client-portal and isolation checks.
-- Invite tokens are public test values, not production secrets.
-- Do not apply to a production database; remove with cleanup.dev.sql.

begin;

insert into public.clients (
  id, name, company, email, is_demo, invite_token_hash, invite_expires_at
)
values
  (
    'a0000000-0000-4000-8000-000000000001',
    'DEV Клиент A',
    'Тестовая компания A',
    'client-a@example.test',
    false,
    'c0c97a60bf29a3e7675e5021238086b7ddcb45b76ae29e446616e3037ff51400',
    now() + interval '30 days'
  ),
  (
    'b0000000-0000-4000-8000-000000000001',
    'DEV Клиент B',
    'Тестовая компания B',
    'client-b@example.test',
    false,
    '38f55b85ec310126d7636f381377fd5935f4781aea9749510a2ff167223c7e71',
    now() + interval '30 days'
  )
on conflict (id) do update
set name = excluded.name,
    company = excluded.company,
    email = excluded.email,
    is_demo = false,
    invite_token_hash = excluded.invite_token_hash,
    invite_expires_at = excluded.invite_expires_at,
    invite_revoked_at = null;

insert into public.projects (id, client_id, name, description, is_demo)
values
  (
    'a0000000-0000-4000-8000-000000000011',
    'a0000000-0000-4000-8000-000000000001',
    'DEV Проект A — лендинг',
    'Тестовый проект клиента A.',
    false
  ),
  (
    'b0000000-0000-4000-8000-000000000011',
    'b0000000-0000-4000-8000-000000000001',
    'DEV Проект B — чат-бот',
    'Тестовый проект клиента B.',
    false
  )
on conflict (id) do update
set client_id = excluded.client_id,
    name = excluded.name,
    description = excluded.description,
    is_demo = false;

insert into public.tasks (
  id, project_id, status_code, title, description, priority, deadline,
  position, completed_at
)
values
  (
    'a0000000-0000-4000-8000-000000000021',
    'a0000000-0000-4000-8000-000000000011',
    'waiting_client',
    'Ответить на вопросы по брифу',
    'Нужны ответы на 5 вопросов, чтобы продолжить дизайн.',
    'high',
    current_date + 2,
    1,
    null
  ),
  (
    'a0000000-0000-4000-8000-000000000022',
    'a0000000-0000-4000-8000-000000000011',
    'on_review',
    'Принять главную страницу',
    'Проверьте первый экран и блок услуг.',
    'urgent',
    current_date + 1,
    1,
    null
  ),
  (
    'a0000000-0000-4000-8000-000000000023',
    'a0000000-0000-4000-8000-000000000011',
    'in_progress',
    'Собрать первый экран',
    'Hero, заголовок, CTA.',
    'normal',
    current_date + 5,
    1,
    null
  ),
  (
    'a0000000-0000-4000-8000-000000000024',
    'a0000000-0000-4000-8000-000000000011',
    'new',
    'Подключить домен',
    'После согласования лендинга.',
    'low',
    null,
    1,
    null
  ),
  (
    'b0000000-0000-4000-8000-000000000021',
    'b0000000-0000-4000-8000-000000000011',
    'on_review',
    'Проверить сценарий приветствия',
    'Первое сообщение бота и кнопки.',
    'high',
    current_date + 1,
    1,
    null
  ),
  (
    'b0000000-0000-4000-8000-000000000022',
    'b0000000-0000-4000-8000-000000000011',
    'waiting_client',
    'Прислать доступы к сообществу',
    'Нужен доступ администратора сообщества VK.',
    'normal',
    current_date + 3,
    1,
    null
  ),
  (
    'b0000000-0000-4000-8000-000000000023',
    'b0000000-0000-4000-8000-000000000011',
    'done',
    'Согласовать tone of voice',
    'Дружелюбно, коротко, без канцелярита.',
    'normal',
    current_date - 2,
    1,
    now() - interval '1 day'
  ),
  (
    'b0000000-0000-4000-8000-000000000024',
    'b0000000-0000-4000-8000-000000000011',
    'needs_rework',
    'Поправить кнопку «Назад»',
    'На некоторых экранах кнопка не возвращает в меню.',
    'high',
    current_date + 4,
    1,
    null
  )
on conflict (id) do update
set project_id = excluded.project_id,
    status_code = excluded.status_code,
    title = excluded.title,
    description = excluded.description,
    priority = excluded.priority,
    deadline = excluded.deadline,
    position = excluded.position,
    completed_at = excluded.completed_at;

commit;
