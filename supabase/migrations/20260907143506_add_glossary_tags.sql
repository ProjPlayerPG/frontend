-- Catégorisation contrôlée des entrées du glossaire.

create table public.glossary_tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  created_at timestamptz not null default now(),
  constraint glossary_tags_slug_format
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) between 1 and 50),
  constraint glossary_tags_name_length
    check (char_length(btrim(name)) between 2 and 30)
);

create table public.glossary_entry_tags (
  glossary_entry_id uuid not null
    references public.glossary_entries(id) on update cascade on delete cascade,
  tag_id uuid not null
    references public.glossary_tags(id) on update cascade on delete restrict,
  created_at timestamptz not null default now(),
  primary key (glossary_entry_id, tag_id)
);

create index glossary_entry_tags_tag_entry_idx
  on public.glossary_entry_tags(tag_id, glossary_entry_id);

insert into public.glossary_tags (slug, name)
values
  ('combat', 'Combat'),
  ('equipement', 'Équipement'),
  ('exploration', 'Exploration'),
  ('multijoueur', 'Multijoueur'),
  ('narration', 'Narration'),
  ('personnages', 'Personnages'),
  ('progression', 'Progression'),
  ('technique', 'Technique')
on conflict (slug) do nothing;

alter table public.glossary_tags enable row level security;
alter table public.glossary_entry_tags enable row level security;

revoke all on public.glossary_tags from anon, authenticated;
revoke all on public.glossary_entry_tags from anon, authenticated;
grant select on public.glossary_tags to anon, authenticated;
grant select on public.glossary_entry_tags to anon, authenticated;
grant all on public.glossary_tags to service_role;
grant all on public.glossary_entry_tags to service_role;

create policy glossary_tags_select_public
on public.glossary_tags for select to anon, authenticated
using (true);

create policy glossary_entry_tags_select_published
on public.glossary_entry_tags for select to anon, authenticated
using (
  exists (
    select 1
    from public.glossary_entries
    where glossary_entries.id = glossary_entry_tags.glossary_entry_id
      and glossary_entries.status = 'published'
  )
);
