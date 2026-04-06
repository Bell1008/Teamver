-- Teamver DB Schema
create table if not exists projects (id uuid primary key default gen_random_uuid(), title text not null, goal text not null, subject text not null, duration_weeks int not null, created_at timestamptz not null default now());
create table if not exists members (id uuid primary key default gen_random_uuid(), project_id uuid not null references projects(id) on delete cascade, name text not null, skills text[] not null default '{}', personality text, is_ai boolean not null default false, role text, responsibilities text[] not null default '{}');
create table if not exists milestones (id uuid primary key default gen_random_uuid(), project_id uuid not null references projects(id) on delete cascade, week int not null, title text not null, tasks text[] not null default '{}');
create table if not exists contribution_logs (id uuid primary key default gen_random_uuid(), member_id uuid not null references members(id) on delete cascade, project_id uuid not null references projects(id) on delete cascade, date date not null default current_date, completed_tasks text[] not null default '{}', memo text, achievement_rate float not null default 0);
create table if not exists weekly_reviews (id uuid primary key default gen_random_uuid(), project_id uuid not null references projects(id) on delete cascade, week int not null, diagnosis text not null, risks text[] not null default '{}', priorities jsonb not null default '[]', created_at timestamptz not null default now());
alter table projects enable row level security;
alter table members enable row level security;
alter table milestones enable row level security;
alter table contribution_logs enable row level security;
alter table weekly_reviews enable row level security;
create policy "allow all for anon" on projects for all using (true);
create policy "allow all for anon" on members for all using (true);
create policy "allow all for anon" on milestones for all using (true);
create policy "allow all for anon" on contribution_logs for all using (true);
create policy "allow all for anon" on weekly_reviews for all using (true);
