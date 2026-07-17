create extension if not exists "uuid-ossp";

create type question_theme as enum ('milestone', 'funny', 'feelings', 'routines', 'gratitude');
create type question_source as enum ('manual', 'claude');

create table questions (
  id uuid primary key default uuid_generate_v4(),
  text text not null,
  theme question_theme not null,
  times_used int not null default 0,
  last_used_at timestamptz,
  source question_source not null default 'manual',
  active bool not null default true,
  created_at timestamptz not null default now()
);

create table weekly_entries (
  id uuid primary key default uuid_generate_v4(),
  week_of date not null unique,
  answers jsonb not null default '{}',
  question_ids uuid[] not null default '{}',
  photo_urls text[] not null default '{}',
  sent_at timestamptz,
  email_preview text,
  created_at timestamptz not null default now()
);

create table claude_suggestions (
  id uuid primary key default uuid_generate_v4(),
  text text not null,
  entry_id uuid references weekly_entries(id) on delete cascade,
  generated_at timestamptz not null default now(),
  promoted bool not null default false
);

create table config (
  id int primary key default 1 check (id = 1),
  child1_name text not null default '',
  child2_name text not null default '',
  child1_email text not null default '',
  child2_email text not null default '',
  child1_birthday date,
  child2_birthday date,
  parent_email text not null default '',
  google_refresh_token text,
  updated_at timestamptz not null default now()
);

-- Insert empty config row
insert into config (id) values (1);

-- RLS
alter table questions enable row level security;
alter table weekly_entries enable row level security;
alter table claude_suggestions enable row level security;
alter table config enable row level security;

create policy "authenticated only" on questions for all using (auth.role() = 'authenticated');
create policy "authenticated only" on weekly_entries for all using (auth.role() = 'authenticated');
create policy "authenticated only" on claude_suggestions for all using (auth.role() = 'authenticated');
create policy "authenticated only" on config for all using (auth.role() = 'authenticated');

-- Helper function used by lib/questions.ts
create or replace function increment_question_usage(question_id uuid)
returns void language sql security definer as $$
  update questions
  set times_used = times_used + 1,
      last_used_at = now()
  where id = question_id;
$$;
