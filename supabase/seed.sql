-- Neyroflow — seed: fixed statuses + demo data.
-- Demo rows are marked with is_demo = true and never appear in the admin UI.
-- All names, companies and emails are fictional. No real PII.

begin;

-- ---------------------------------------------------------------------------
-- Fixed status reference
-- ---------------------------------------------------------------------------

insert into public.statuses (code, name, color, sort_order, is_terminal)
values
  ('new', 'Новая', '#64748b', 1, false),
  ('in_progress', 'В работе', '#3b82f6', 2, false),
  ('waiting_client', 'Жду клиента', '#f59e0b', 3, false),
  ('on_review', 'На проверке', '#8b5cf6', 4, false),
  ('needs_rework', 'На доработке', '#ef4444', 5, false),
  ('done', 'Принято', '#22c55e', 6, true)
on conflict (code) do update
set name = excluded.name,
    color = excluded.color,
    sort_order = excluded.sort_order,
    is_terminal = excluded.is_terminal;

-- ---------------------------------------------------------------------------
-- Demo client and projects
-- ---------------------------------------------------------------------------

insert into public.clients (id, name, company, email, is_demo)
values (
  'd0000000-0000-4000-8000-000000000001',
  'Демо-клиент',
  'Neyrocontent',
  null,
  true
)
on conflict (id) do update
set name = excluded.name,
    company = excluded.company,
    email = excluded.email,
    is_demo = true;

insert into public.projects (id, client_id, name, description, is_archived, is_demo)
values
  (
    'd0000000-0000-4000-8000-000000000011',
    'd0000000-0000-4000-8000-000000000001',
    'Лендинг для студии',
    'Промо-страница студии Neyrocontent: hero, услуги, кейсы, форма заявки.',
    false,
    true
  ),
  (
    'd0000000-0000-4000-8000-000000000012',
    'd0000000-0000-4000-8000-000000000001',
    'Чат-бот для VK',
    'Сценарий заявок и ответов на частые вопросы в сообществе VK.',
    false,
    true
  )
on conflict (id) do update
set client_id = excluded.client_id,
    name = excluded.name,
    description = excluded.description,
    is_archived = excluded.is_archived,
    is_demo = true;

-- ---------------------------------------------------------------------------
-- Demo tasks: all six statuses, priorities and deadlines
-- ---------------------------------------------------------------------------

insert into public.tasks (
  id, project_id, status_code, title, description, priority, deadline,
  position, completed_at
)
values
  (
    'd0000000-0000-4000-8000-000000000101',
    'd0000000-0000-4000-8000-000000000011',
    'done',
    'Собрать референсы и мудборд',
    'Тёмная техно-эстетика, стекло, неон, изометрия. Референс утверждён.',
    'normal',
    current_date - 9,
    1,
    now() - interval '8 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000102',
    'd0000000-0000-4000-8000-000000000011',
    'done',
    'Утвердить структуру лендинга',
    'Hero, услуги, кейсы, процесс, форма заявки, футер.',
    'high',
    current_date - 7,
    2,
    now() - interval '6 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000103',
    'd0000000-0000-4000-8000-000000000011',
    'in_progress',
    'Сверстать hero-секцию',
    'CSS-изометрия доски, стеклянные карточки, неоновые линии.',
    'urgent',
    current_date + 2,
    1,
    null
  ),
  (
    'd0000000-0000-4000-8000-000000000104',
    'd0000000-0000-4000-8000-000000000011',
    'waiting_client',
    'Подготовить тексты для блока услуг',
    'Нужны формулировки от клиента: три услуги и короткие описания.',
    'high',
    current_date + 1,
    1,
    null
  ),
  (
    'd0000000-0000-4000-8000-000000000105',
    'd0000000-0000-4000-8000-000000000011',
    'on_review',
    'Настроить форму заявки',
    'Валидация, отправка в Telegram-бот, состояние успеха.',
    'normal',
    current_date + 4,
    1,
    null
  ),
  (
    'd0000000-0000-4000-8000-000000000106',
    'd0000000-0000-4000-8000-000000000011',
    'needs_rework',
    'Проверить мобильную версию',
    'На 360 px ломается сетка кейсов; нужно поправить отступы.',
    'high',
    current_date - 1,
    1,
    null
  ),
  (
    'd0000000-0000-4000-8000-000000000107',
    'd0000000-0000-4000-8000-000000000011',
    'new',
    'Подключить аналитику',
    'Метрика и цели на отправку формы; без cookie-баннера в MVP.',
    'low',
    null,
    1,
    null
  ),
  (
    'd0000000-0000-4000-8000-000000000111',
    'd0000000-0000-4000-8000-000000000012',
    'done',
    'Собрать сценарий чат-бота',
    'Приветствие, выбор услуги, сбор заявки, передача менеджеру.',
    'high',
    current_date - 5,
    1,
    now() - interval '4 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000112',
    'd0000000-0000-4000-8000-000000000012',
    'in_progress',
    'Настроить меню и кнопки VK',
    'Кнопки «Услуги», «Заявка», «Связаться», возврат в меню.',
    'normal',
    current_date + 3,
    1,
    null
  ),
  (
    'd0000000-0000-4000-8000-000000000113',
    'd0000000-0000-4000-8000-000000000012',
    'on_review',
    'Протестировать сценарий заявки',
    'Проверить ветки: услуга выбрана, услуга не выбрана, отмена.',
    'urgent',
    current_date + 1,
    1,
    null
  ),
  (
    'd0000000-0000-4000-8000-000000000114',
    'd0000000-0000-4000-8000-000000000012',
    'waiting_client',
    'Добавить ответы на частые вопросы',
    'Нужны 5–7 вопросов и ответов от клиента.',
    'normal',
    current_date + 6,
    1,
    null
  ),
  (
    'd0000000-0000-4000-8000-000000000115',
    'd0000000-0000-4000-8000-000000000012',
    'new',
    'Подготовить инструкцию для администратора',
    'Как менять приветствие, добавлять услуги и смотреть заявки.',
    'low',
    null,
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

-- ---------------------------------------------------------------------------
-- Demo attachments (served from public/demo-assets, not Storage)
-- ---------------------------------------------------------------------------

insert into public.attachments (
  id, task_id, uploaded_by_type, uploaded_by_name, file_name, mime_type,
  size_bytes, storage_path, width, height
)
values
  (
    'd0000000-0000-4000-8000-000000000201',
    'd0000000-0000-4000-8000-000000000101',
    'demo',
    'Демо-клиент',
    'landing-hero.jpg',
    'image/jpeg',
    51622,
    'demo/landing-hero.jpg',
    1200,
    800
  ),
  (
    'd0000000-0000-4000-8000-000000000202',
    'd0000000-0000-4000-8000-000000000103',
    'demo',
    'Демо-клиент',
    'landing-mobile.jpg',
    'image/jpeg',
    30381,
    'demo/landing-mobile.jpg',
    390,
    844
  ),
  (
    'd0000000-0000-4000-8000-000000000203',
    'd0000000-0000-4000-8000-000000000111',
    'demo',
    'Демо-клиент',
    'chatbot-flow.jpg',
    'image/jpeg',
    135955,
    'demo/chatbot-flow.jpg',
    1200,
    800
  )
on conflict (id) do update
set task_id = excluded.task_id,
    uploaded_by_type = excluded.uploaded_by_type,
    uploaded_by_name = excluded.uploaded_by_name,
    file_name = excluded.file_name,
    mime_type = excluded.mime_type,
    size_bytes = excluded.size_bytes,
    storage_path = excluded.storage_path,
    width = excluded.width,
    height = excluded.height;

-- ---------------------------------------------------------------------------
-- Demo comments and pins
-- ---------------------------------------------------------------------------

insert into public.comments (
  id, task_id, author_type, author_name, body,
  pinned_attachment_id, pin_x, pin_y
)
values
  (
    'd0000000-0000-4000-8000-000000000301',
    'd0000000-0000-4000-8000-000000000101',
    'demo',
    'Демо-клиент',
    'Заголовок слишком крупный: на ноутбуке он занимает весь первый экран. Уменьшите на 20–25%.',
    'd0000000-0000-4000-8000-000000000201',
    42.50,
    31.20
  ),
  (
    'd0000000-0000-4000-8000-000000000302',
    'd0000000-0000-4000-8000-000000000101',
    'demo',
    'Демо-клиент',
    'В целом moodboard нравится, особенно стеклянные панели. Оставляем.',
    null,
    null,
    null
  ),
  (
    'd0000000-0000-4000-8000-000000000303',
    'd0000000-0000-4000-8000-000000000103',
    'demo',
    'Демо-клиент',
    'На мобильном кнопка «Обсудить проект» уезжает под фолд. Поднимите её выше.',
    'd0000000-0000-4000-8000-000000000202',
    50.00,
    22.00
  ),
  (
    'd0000000-0000-4000-8000-000000000304',
    'd0000000-0000-4000-8000-000000000111',
    'demo',
    'Демо-клиент',
    'Добавьте ветку с выбором услуги: лендинг, чат-бот, дизайн-система.',
    'd0000000-0000-4000-8000-000000000203',
    31.00,
    62.00
  ),
  (
    'd0000000-0000-4000-8000-000000000305',
    'd0000000-0000-4000-8000-000000000105',
    'admin',
    'Админ',
    'Форма готова, отправил на проверку. Проверьте тексты ошибок.',
    null,
    null,
    null
  )
on conflict (id) do update
set body = excluded.body,
    pinned_attachment_id = excluded.pinned_attachment_id,
    pin_x = excluded.pin_x,
    pin_y = excluded.pin_y;

-- ---------------------------------------------------------------------------
-- Demo status history
-- ---------------------------------------------------------------------------

insert into public.task_status_history (
  id, task_id, from_status, to_status, changed_by_type, changed_by_name
)
values
  (
    'd0000000-0000-4000-8000-000000000401',
    'd0000000-0000-4000-8000-000000000101',
    'new',
    'in_progress',
    'system',
    'Демо'
  ),
  (
    'd0000000-0000-4000-8000-000000000402',
    'd0000000-0000-4000-8000-000000000101',
    'in_progress',
    'on_review',
    'system',
    'Демо'
  ),
  (
    'd0000000-0000-4000-8000-000000000403',
    'd0000000-0000-4000-8000-000000000101',
    'on_review',
    'done',
    'system',
    'Демо'
  ),
  (
    'd0000000-0000-4000-8000-000000000404',
    'd0000000-0000-4000-8000-000000000111',
    'new',
    'in_progress',
    'system',
    'Демо'
  ),
  (
    'd0000000-0000-4000-8000-000000000405',
    'd0000000-0000-4000-8000-000000000111',
    'in_progress',
    'done',
    'system',
    'Демо'
  )
on conflict (id) do nothing;

commit;
