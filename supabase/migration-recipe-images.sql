-- Migration: add recipe images (run in Supabase SQL Editor if you already deployed schema.sql)

alter table recipes add column if not exists image_url text;

-- Public bucket for recipe cover photos
insert into storage.buckets (id, name, public)
values ('recipe-images', 'recipe-images', true)
on conflict (id) do nothing;

-- Storage policies (open for personal use — tighten with auth later)
create policy "Public read recipe images"
on storage.objects for select
using (bucket_id = 'recipe-images');

create policy "Public upload recipe images"
on storage.objects for insert
with check (bucket_id = 'recipe-images');

create policy "Public update recipe images"
on storage.objects for update
using (bucket_id = 'recipe-images');

create policy "Public delete recipe images"
on storage.objects for delete
using (bucket_id = 'recipe-images');
