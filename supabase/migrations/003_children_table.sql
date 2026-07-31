-- Create children table
create table children (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null default '',
  birthday date,
  position int not null default 0,
  created_at timestamptz not null default now()
);

alter table children enable row level security;
create policy "authenticated only" on children for all using (auth.role() = 'authenticated');

-- Migrate existing child data from config (only if names are set)
insert into children (name, email, birthday, position)
select child1_name, child1_email, child1_birthday, 0
from config
where child1_name is not null and child1_name <> '';

insert into children (name, email, birthday, position)
select child2_name, child2_email, child2_birthday, 1
from config
where child2_name is not null and child2_name <> '';

-- Drop child columns from config
alter table config
  drop column if exists child1_name,
  drop column if exists child2_name,
  drop column if exists child1_email,
  drop column if exists child2_email,
  drop column if exists child1_birthday,
  drop column if exists child2_birthday;
