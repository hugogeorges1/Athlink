-- ATHLINK Supabase schema (PostgreSQL)
-- Run in Supabase SQL Editor. Adjust schemas/policies as needed.

-- Note: auth.users is managed by Supabase Auth. We attach profiles to it.

-- Extensions
create extension if not exists pgcrypto;

create table if not exists public.athlete_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  birth_date date,
  country text,
  sport text,
  position text,
  level text,
  height integer,
  weight integer,
  gpa numeric(3,2),
  english_level text,
  bio text,
  goals text,
  why_usa text,
  club text,
  achievements text,
  phone_whatsapp text,
  profile_picture_url text,
  is_verified boolean default false,
  profile_views_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.coach_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  university text,
  sport text,
  division text,
  state text,
  phone text,
  website text,
  bio text,
  achievements text,
  recruiting_criteria text,
  positions_needed text,
  logo_url text,
  status text check (status in ('pending','approved','rejected')) default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.highlights (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references auth.users(id) on delete cascade,
  video_url text,
  file_path text,
  title text not null,
  description text,
  tags text,
  is_featured boolean default false,
  created_at timestamptz default now()
);

-- Likes for highlights (non-destructive addition)
create table if not exists public.highlight_likes (
  id uuid primary key default gen_random_uuid(),
  highlight_id uuid not null references public.highlights(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique (highlight_id, user_id)
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references auth.users(id) on delete cascade,
  file_path text not null,
  document_type text check (document_type in ('transcript','test','other')) default 'other',
  uploaded_at timestamptz default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  sent_at timestamptz default now(),
  read_at timestamptz
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references auth.users(id) on delete cascade,
  athlete_id uuid not null references auth.users(id) on delete cascade,
  added_at timestamptz default now(),
  unique(coach_id, athlete_id)
);

create table if not exists public.profile_views (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references auth.users(id) on delete cascade,
  viewer_id uuid references auth.users(id) on delete set null,
  viewed_at timestamptz default now(),
  ip_address inet
);

create table if not exists public.athlete_of_week (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references auth.users(id) on delete cascade,
  description text,
  start_date date not null,
  end_date date not null,
  is_active boolean default true
);

-- Athlete profiles: separate fields for level and tests (non-breaking)
alter table public.athlete_profiles
  add column if not exists level_base text,
  add column if not exists division text,
  add column if not exists category text,
  add column if not exists english_test_type text check (english_test_type in ('TOEFL','IELTS','Duolingo')),
  add column if not exists english_test_score numeric,
  add column if not exists current_school_year text,
  add column if not exists expected_graduation_year integer,
  add column if not exists slug text;

-- Unique slug for public profiles
do $$ begin
  if not exists (
    select 1 from pg_indexes where schemaname = 'public' and indexname = 'athlete_profiles_slug_key'
  ) then
    execute 'create unique index athlete_profiles_slug_key on public.athlete_profiles (slug) where slug is not null';
  end if;
end $$;

-- RLS enable
alter table public.athlete_profiles enable row level security;
alter table public.coach_profiles enable row level security;
alter table public.highlights enable row level security;
alter table public.highlight_likes enable row level security;
alter table public.documents enable row level security;
alter table public.messages enable row level security;
alter table public.favorites enable row level security;
alter table public.profile_views enable row level security;
alter table public.athlete_of_week enable row level security;

-- Athlete profiles policies (public readable)
drop policy if exists "athlete_profiles select own" on public.athlete_profiles;
drop policy if exists "athlete_profiles public readable" on public.athlete_profiles;
create policy "athlete_profiles public readable" on public.athlete_profiles for select using (true);
drop policy if exists "athlete_profiles insert own" on public.athlete_profiles;
create policy "athlete_profiles insert own" on public.athlete_profiles for insert with check (auth.uid() = user_id);
drop policy if exists "athlete_profiles update own" on public.athlete_profiles;
create policy "athlete_profiles update own" on public.athlete_profiles for update using (auth.uid() = user_id);

-- Coach profiles policies (public readable)
drop policy if exists "coach_profiles select own" on public.coach_profiles;
drop policy if exists "coach_profiles public readable" on public.coach_profiles;
create policy "coach_profiles public readable" on public.coach_profiles for select using (true);
drop policy if exists "coach_profiles insert own" on public.coach_profiles;
create policy "coach_profiles insert own" on public.coach_profiles for insert with check (auth.uid() = user_id);
drop policy if exists "coach_profiles update own" on public.coach_profiles;
create policy "coach_profiles update own" on public.coach_profiles for update using (auth.uid() = user_id);

-- Highlights policies
drop policy if exists "highlights owner crud" on public.highlights;
create policy "highlights owner crud" on public.highlights for all using (auth.uid() = athlete_id) with check (auth.uid() = athlete_id);
drop policy if exists "highlights readable" on public.highlights;
create policy "highlights readable" on public.highlights for select using (true);

-- Documents policies
drop policy if exists "documents owner crud" on public.documents;
create policy "documents owner crud" on public.documents for all using (auth.uid() = athlete_id) with check (auth.uid() = athlete_id);
drop policy if exists "documents readable" on public.documents;
create policy "documents readable" on public.documents for select using (true);

-- Messages policies
drop policy if exists "messages read by participants" on public.messages;
create policy "messages read by participants" on public.messages for select using (auth.uid() = sender_id or auth.uid() = recipient_id);
drop policy if exists "messages insert by sender" on public.messages;
create policy "messages insert by sender" on public.messages for insert with check (auth.uid() = sender_id);
drop policy if exists "messages update by participants" on public.messages;
create policy "messages update by participants" on public.messages for update using (auth.uid() = sender_id or auth.uid() = recipient_id);

-- Favorites policies
drop policy if exists "favorites coach crud" on public.favorites;
create policy "favorites coach crud" on public.favorites for all using (auth.uid() = coach_id) with check (auth.uid() = coach_id);
drop policy if exists "favorites readable" on public.favorites;
create policy "favorites readable" on public.favorites for select using (true);

-- Profile views policies
drop policy if exists "profile views insert" on public.profile_views;
create policy "profile views insert" on public.profile_views for insert with check (true);
drop policy if exists "profile views readable" on public.profile_views;
create policy "profile views readable" on public.profile_views for select using (true);

-- Athlete of week policies
drop policy if exists "aow readable" on public.athlete_of_week;
create policy "aow readable" on public.athlete_of_week for select using (true);

-- Storage bucket policies: avatars, documents, video
-- Run in SQL editor under the 'storage' schema.

-- AVATARS
drop policy if exists "Public read avatars" on storage.objects;
create policy "Public read avatars" on storage.objects for select to anon, authenticated using (bucket_id = 'avatars');
drop policy if exists "Users write own avatars" on storage.objects;
create policy "Users write own avatars" on storage.objects for insert to authenticated with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users update own avatars" on storage.objects;
create policy "Users update own avatars" on storage.objects for update to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users delete own avatars" on storage.objects;
create policy "Users delete own avatars" on storage.objects for delete to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- DOCUMENTS
drop policy if exists "Public read documents" on storage.objects;
create policy "Public read documents" on storage.objects for select to anon, authenticated using (bucket_id = 'documents');
drop policy if exists "Users write own documents" on storage.objects;
create policy "Users write own documents" on storage.objects for insert to authenticated with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users update own documents" on storage.objects;
create policy "Users update own documents" on storage.objects for update to authenticated using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users delete own documents" on storage.objects;
create policy "Users delete own documents" on storage.objects for delete to authenticated using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

-- VIDEO (singulier)
drop policy if exists "Public read video" on storage.objects;
create policy "Public read video" on storage.objects for select to anon, authenticated using (bucket_id = 'video');
drop policy if exists "Users write own video" on storage.objects;
create policy "Users write own video" on storage.objects for insert to authenticated with check (bucket_id = 'video' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users update own video" on storage.objects;
create policy "Users update own video" on storage.objects for update to authenticated using (bucket_id = 'video' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users delete own video" on storage.objects;
create policy "Users delete own video" on storage.objects for delete to authenticated using (bucket_id = 'video' and (storage.foldername(name))[1] = auth.uid()::text);

-- User notification settings
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  notification_email text,
  email_on_message boolean not null default true,
  email_on_comment boolean not null default false,
  email_on_like boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;
drop policy if exists "user_settings public readable" on public.user_settings;
create policy "user_settings public readable" on public.user_settings for select using (true);
drop policy if exists "user_settings upsert own" on public.user_settings;
create policy "user_settings upsert own" on public.user_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Saved searches
create table if not exists public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) > 0 and char_length(name) <= 120),
  params jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.saved_searches enable row level security;
drop policy if exists "saved_searches read own" on public.saved_searches;
create policy "saved_searches read own" on public.saved_searches for select using (auth.uid() = user_id);
drop policy if exists "saved_searches write own" on public.saved_searches;
create policy "saved_searches write own" on public.saved_searches for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists idx_saved_searches_user on public.saved_searches (user_id, created_at desc);

-- Data normalization: map various level strings to three categories
-- This is safe to run multiple times (idempotent)
update public.athlete_profiles
set level = case
  when level ilike 'nca%' or level ilike 'naia' or level ilike 'juco' or level ilike 'national%' then 'National'
  when level ilike 'reg%' or level = 'Régional' then 'Régional'
  when level ilike 'dep%' or level = 'Départemental' then 'Départemental'
  else level
end,
level_base = case
  when level_base ilike 'nca%' or level_base ilike 'naia' or level_base ilike 'juco' or level_base ilike 'national%' then 'National'
  when level_base ilike 'reg%' or level_base = 'Régional' then 'Régional'
  when level_base ilike 'dep%' or level_base = 'Départemental' then 'Départemental'
  else level_base
end;

-- Highlight comments
create table if not exists public.highlight_comments (
  id uuid primary key default gen_random_uuid(),
  highlight_id uuid not null references public.highlights(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(content) > 0 and char_length(content) <= 2000),
  created_at timestamptz not null default now()
);

create index if not exists idx_highlight_comments_highlight on public.highlight_comments (highlight_id, created_at desc);

-- Performance indexes (safe, idempotent)
create index if not exists idx_favorites_athlete on public.favorites (athlete_id);
create index if not exists idx_favorites_coach_athlete on public.favorites (coach_id, athlete_id);
create index if not exists idx_profile_views_athlete on public.profile_views (athlete_id);
create index if not exists idx_profile_views_athlete_created on public.profile_views (athlete_id, viewed_at desc);
create index if not exists idx_highlight_likes_highlight on public.highlight_likes (highlight_id);
create index if not exists idx_highlight_likes_highlight_user on public.highlight_likes (highlight_id, user_id);
create index if not exists idx_highlights_athlete_created on public.highlights (athlete_id, created_at desc);

create index if not exists idx_highlight_comments_author on public.highlight_comments (author_id, created_at desc);

alter table public.highlight_comments enable row level security;

-- Public read
drop policy if exists "highlight_comments public read" on public.highlight_comments;
create policy "highlight_comments public read" on public.highlight_comments for select using (true);

-- Author insert
drop policy if exists "highlight_comments author insert" on public.highlight_comments;
create policy "highlight_comments author insert" on public.highlight_comments for insert to authenticated with check (auth.uid() = author_id);

-- Author delete
drop policy if exists "highlight_comments author delete" on public.highlight_comments;
create policy "highlight_comments author delete" on public.highlight_comments for delete to authenticated using (auth.uid() = author_id);
