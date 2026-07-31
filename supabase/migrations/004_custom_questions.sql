-- Store one-time custom questions per entry (id → text mapping)
alter table weekly_entries
  add column if not exists custom_questions jsonb not null default '{}';
