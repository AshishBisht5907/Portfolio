create extension if not exists pgcrypto;

create or replace function public.is_gallery_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'gallery_admin', 'false') = 'true';
$$;

revoke all on function public.is_gallery_admin() from public;
grant execute on function public.is_gallery_admin() to anon, authenticated;

create table if not exists public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 100),
  description text not null default '' check (char_length(description) <= 500),
  category text not null check (char_length(btrim(category)) between 1 and 40),
  storage_path text not null unique,
  constraint gallery_photos_storage_path_format_check check (
    storage_path ~ '^owner/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
  ),
  created_at timestamptz not null default now()
);

create table if not exists public.photo_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  email text check (email is null or char_length(email) <= 254),
  title text not null check (char_length(btrim(title)) between 1 and 100),
  message text not null default '' check (char_length(message) <= 1000),
  storage_path text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  published_photo_id uuid references public.gallery_photos(id) on delete set null,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  constraint photo_submissions_review_state_check check (
    (status = 'pending' and reviewed_at is null and reviewed_by is null and published_photo_id is null)
    or (status = 'approved' and reviewed_at is not null)
    or (status = 'rejected' and reviewed_at is not null and published_photo_id is null)
  ),
  constraint photo_submissions_storage_path_format_check check (
    storage_path ~ '^pending/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
  )
);

alter table public.photo_submissions
  add column if not exists published_photo_id uuid
  references public.gallery_photos(id) on delete set null;
alter table public.photo_submissions
  add column if not exists reviewed_at timestamptz;
alter table public.photo_submissions
  add column if not exists reviewed_by uuid
  references auth.users(id) on delete set null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'gallery_photos_storage_path_format_check'
      and conrelid = 'public.gallery_photos'::regclass
  ) then
    alter table public.gallery_photos
      add constraint gallery_photos_storage_path_format_check check (
        storage_path ~ '^owner/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'photo_submissions_storage_path_format_check'
      and conrelid = 'public.photo_submissions'::regclass
  ) then
    alter table public.photo_submissions
      add constraint photo_submissions_storage_path_format_check check (
        storage_path ~ '^pending/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'photo_submissions_review_state_check'
      and conrelid = 'public.photo_submissions'::regclass
  ) then
    alter table public.photo_submissions
      add constraint photo_submissions_review_state_check check (
        (status = 'pending' and reviewed_at is null and reviewed_by is null and published_photo_id is null)
        or (status = 'approved' and reviewed_at is not null)
        or (status = 'rejected' and reviewed_at is not null and published_photo_id is null)
      );
  end if;
end
$$;

create index if not exists gallery_photos_created_at_idx
  on public.gallery_photos (created_at desc);
create index if not exists photo_submissions_pending_created_at_idx
  on public.photo_submissions (created_at)
  where status = 'pending';
create index if not exists photo_submissions_published_photo_id_idx
  on public.photo_submissions (published_photo_id);
create index if not exists photo_submissions_reviewed_by_idx
  on public.photo_submissions (reviewed_by);

grant usage on schema public to anon, authenticated;

alter table public.gallery_photos enable row level security;
alter table public.photo_submissions enable row level security;

revoke all on public.gallery_photos from public, anon, authenticated;
revoke all on public.photo_submissions from public, anon, authenticated;
grant select on public.gallery_photos to anon, authenticated;
grant insert, update, delete on public.gallery_photos to authenticated;
grant insert on public.photo_submissions to anon, authenticated;
grant select, update, delete on public.photo_submissions to authenticated;

drop policy if exists "Approved photos are publicly readable" on public.gallery_photos;
create policy "Approved photos are publicly readable"
  on public.gallery_photos for select
  to anon, authenticated
  using (true);

drop policy if exists "Gallery admins insert photos" on public.gallery_photos;
create policy "Gallery admins insert photos"
  on public.gallery_photos for insert
  to authenticated
  with check (public.is_gallery_admin());

drop policy if exists "Gallery admins update photos" on public.gallery_photos;
create policy "Gallery admins update photos"
  on public.gallery_photos for update
  to authenticated
  using (public.is_gallery_admin())
  with check (public.is_gallery_admin());

drop policy if exists "Gallery admins delete photos" on public.gallery_photos;
create policy "Gallery admins delete photos"
  on public.gallery_photos for delete
  to authenticated
  using (public.is_gallery_admin());

drop policy if exists "Visitors submit pending photos" on public.photo_submissions;
create policy "Visitors submit pending photos"
  on public.photo_submissions for insert
  to anon, authenticated
  with check (
    status = 'pending'
    and storage_path ~ '^pending/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
  );

drop policy if exists "Gallery admins read submissions" on public.photo_submissions;
create policy "Gallery admins read submissions"
  on public.photo_submissions for select
  to authenticated
  using (public.is_gallery_admin());

drop policy if exists "Gallery admins moderate submissions" on public.photo_submissions;
create policy "Gallery admins moderate submissions"
  on public.photo_submissions for update
  to authenticated
  using (public.is_gallery_admin())
  with check (public.is_gallery_admin());

drop policy if exists "Gallery admins delete submissions" on public.photo_submissions;
create policy "Gallery admins delete submissions"
  on public.photo_submissions for delete
  to authenticated
  using (public.is_gallery_admin());

create or replace function public.stamp_photo_submission_review()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if new.status = old.status then
    return new;
  end if;

  if old.status <> 'pending' or new.status not in ('approved', 'rejected') then
    raise exception 'Only pending submissions can be approved or rejected.';
  end if;

  if new.status = 'approved' and new.published_photo_id is null then
    raise exception 'An approved submission must reference its published photo.';
  end if;

  if new.status = 'rejected' and new.published_photo_id is not null then
    raise exception 'A rejected submission cannot reference a public photo.';
  end if;

  new.reviewed_at = now();
  new.reviewed_by = auth.uid();
  return new;
end;
$function$;

drop trigger if exists photo_submissions_stamp_review on public.photo_submissions;
create trigger photo_submissions_stamp_review
  before update of status on public.photo_submissions
  for each row execute function public.stamp_photo_submission_review();

create or replace function public.approve_photo_submission(
  p_submission_id uuid,
  p_title text,
  p_description text,
  p_category text,
  p_storage_path text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_published_photo_id uuid;
begin
  if not public.is_gallery_admin() then
    raise exception 'Gallery administrator access is required.' using errcode = '42501';
  end if;

  perform 1
  from public.photo_submissions
  where id = p_submission_id and status = 'pending'
  for update;
  if not found then
    raise exception 'The submission is no longer pending.' using errcode = 'P0002';
  end if;

  insert into public.gallery_photos (title, description, category, storage_path)
  values (p_title, p_description, p_category, p_storage_path)
  returning id into v_published_photo_id;

  update public.photo_submissions
  set status = 'approved',
      published_photo_id = v_published_photo_id
  where id = p_submission_id and status = 'pending';
  if not found then
    raise exception 'The submission is no longer pending.' using errcode = 'P0002';
  end if;
end;
$function$;

revoke all on function public.approve_photo_submission(uuid, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.approve_photo_submission(uuid, text, text, text, text)
  to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('portfolio-gallery', 'portfolio-gallery', false, 12582912, array['image/jpeg', 'image/png', 'image/webp']),
  ('photo-submissions', 'photo-submissions', false, 12582912, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = false,
    file_size_limit = 12582912,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Portfolio gallery is publicly readable" on storage.objects;
drop policy if exists "Gallery owner can upload to their folder" on storage.objects;
drop policy if exists "Gallery owner can update their folder" on storage.objects;
drop policy if exists "Gallery owner can delete from their folder" on storage.objects;

drop policy if exists "Public can read approved gallery objects" on storage.objects;
create policy "Public can read approved gallery objects"
  on storage.objects for select
  to anon, authenticated
  using (
    bucket_id = 'portfolio-gallery'
    and exists (
      select 1
      from public.gallery_photos as photo
      where photo.storage_path = storage.objects.name
    )
  );

drop policy if exists "Visitors upload private photo submissions" on storage.objects;
create policy "Visitors upload private photo submissions"
  on storage.objects for insert
  to anon, authenticated
  with check (
    bucket_id = 'photo-submissions'
    and (storage.foldername(name))[1] = 'pending'
    and name ~ '^pending/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
  );

drop policy if exists "Gallery admins manage gallery and submission objects" on storage.objects;
create policy "Gallery admins manage gallery and submission objects"
  on storage.objects for all
  to authenticated
  using (
    public.is_gallery_admin()
    and bucket_id in ('portfolio-gallery', 'photo-submissions')
  )
  with check (
    public.is_gallery_admin()
    and bucket_id in ('portfolio-gallery', 'photo-submissions')
  );
