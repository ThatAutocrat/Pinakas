-- ============================================================
-- Pinakas — Seed data (optional demo accounts)
-- Password for all accounts: password123
-- Hash generated with bcryptjs rounds=10
-- ============================================================

insert into users (id, email, name, initials, color, text_color, password_hash) values
  ('user-aditya', 'aditya@pinakas.app', 'Aditya Kumar',  'AK', '#EAF3DE', '#27500A', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
  ('user-sara',   'sara@pinakas.app',   'Sara Mehta',    'SM', '#E6F1FB', '#0C447C', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
  ('user-rahul',  'rahul@pinakas.app',  'Rahul Sharma',  'RS', '#FBEAF0', '#72243E', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
on conflict do nothing;

insert into projects (id, name, color, status, owner_id) values
  ('proj-alpha', 'Alpha Launch',   '#639922', 'On track',   'user-aditya'),
  ('proj-mobile','Mobile App v2',  '#378ADD', 'At risk',    'user-aditya'),
  ('proj-design','Design System',  '#D4537E', 'On track',   'user-sara')
on conflict do nothing;

insert into project_members (project_id, user_id, role) values
  ('proj-alpha',  'user-sara',   'member'),
  ('proj-alpha',  'user-rahul',  'member'),
  ('proj-mobile', 'user-sara',   'member'),
  ('proj-design', 'user-aditya', 'member')
on conflict do nothing;

insert into tasks (id, title, status, priority, tag, project_id) values
  ('task-1', 'Set up CI/CD pipeline',      'Done',        'High',     'Backend', 'proj-alpha'),
  ('task-2', 'Design onboarding flow',     'In progress', 'High',     'Design',  'proj-alpha'),
  ('task-3', 'Write API documentation',    'To do',       'Medium',   'Backend', 'proj-alpha'),
  ('task-4', 'Fix login edge cases',       'Backlog',     'Critical', 'Bug',     'proj-alpha'),
  ('task-5', 'User research interviews',   'Done',        'Medium',   'Research','proj-mobile'),
  ('task-6', 'Prototype push notifications','In progress','High',     'Feature', 'proj-mobile'),
  ('task-7', 'Define token system',        'In progress', 'High',     'Design',  'proj-design'),
  ('task-8', 'Document components',        'To do',       'Medium',   'Design',  'proj-design')
on conflict do nothing;

insert into checklist_items (task_id, text, done, "order") values
  ('task-2', 'Wireframes', true,  0),
  ('task-2', 'Hi-fi mockups', false, 1),
  ('task-2', 'Prototype', false, 2),
  ('task-6', 'Research push APIs', true,  0),
  ('task-6', 'Build notification service', false, 1)
on conflict do nothing;
