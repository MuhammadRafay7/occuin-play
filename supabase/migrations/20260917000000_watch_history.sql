create extension if not exists "uuid-ossp";

create table if not exists public.watch_history (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    tmdb_id integer not null,
    media_type text check (media_type in ('movie', 'tv')) not null,
    season_num integer default 1 not null,
    episode_num integer default 1 not null,
    watched_sec numeric default 0 not null,
    total_sec numeric default 0 not null,
    completed boolean default false not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (user_id, tmdb_id, media_type, season_num, episode_num)
);

create index if not exists watch_history_user_recent_idx
    on public.watch_history (user_id, updated_at desc);

alter table public.watch_history enable row level security;

drop policy if exists "Users manage own history" on public.watch_history;

create policy "Users manage own history"
    on public.watch_history for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create table if not exists public.timeline_comments (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    tmdb_id integer not null,
    media_type text check (media_type in ('movie', 'tv')) not null,
    season_num integer default 1 not null,
    episode_num integer default 1 not null,
    timestamp_sec integer not null check (timestamp_sec >= 0),
    body text not null check (char_length(body) between 1 and 500),
    author text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists timeline_comments_lookup_idx
    on public.timeline_comments (tmdb_id, media_type, season_num, episode_num, timestamp_sec);

alter table public.timeline_comments enable row level security;

drop policy if exists "Comments are readable by everyone" on public.timeline_comments;
create policy "Comments are readable by everyone"
    on public.timeline_comments for select
    using (true);

drop policy if exists "Users insert own comments" on public.timeline_comments;
create policy "Users insert own comments"
    on public.timeline_comments for insert
    with check (auth.uid() = user_id);

drop policy if exists "Users delete own comments" on public.timeline_comments;
create policy "Users delete own comments"
    on public.timeline_comments for delete
    using (auth.uid() = user_id);
