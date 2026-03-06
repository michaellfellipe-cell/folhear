-- PROFILES
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  bio text,
  photo_url text,
  first_name text,
  last_name text,
  birthday date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- LIBRARY (livros avaliados)
create table public.library (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  author text,
  year text,
  genre text,
  pages integer,
  rating text check (rating in ('loved','saved','disliked')),
  added_at timestamptz default now()
);

-- READING (lendo agora)
create table public.reading (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  author text,
  pages integer default 0,
  total_pages integer default 300,
  start_date timestamptz default now()
);

-- FINISHED (concluídos)
create table public.finished (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  author text,
  pages integer default 0,
  total_pages integer default 300,
  finished_at timestamptz default now()
);

-- NOTES
create table public.notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  book_title text not null,
  type text check (type in ('note','quote')),
  content text not null,
  created_at timestamptz default now()
);

-- WISHLIST
create table public.wishlist (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  author text,
  year text,
  genre text,
  pages integer,
  priority text default 'media' check (priority in ('alta','media','baixa')),
  added_at timestamptz default now()
);

-- READING GOAL
create table public.reading_goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  year integer not null,
  target integer default 12,
  done integer default 0,
  unique(user_id, year)
);

-- CLUBS
create table public.clubs (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  book text not null,
  description text,
  is_public boolean default true,
  owner_id uuid references auth.users on delete cascade,
  owner_username text,
  created_at timestamptz default now()
);

-- CLUB MEMBERS
create table public.club_members (
  club_id uuid references public.clubs on delete cascade,
  user_id uuid references auth.users on delete cascade,
  joined_at timestamptz default now(),
  primary key (club_id, user_id)
);

-- CLUB POSTS
create table public.club_posts (
  id uuid default gen_random_uuid() primary key,
  club_id uuid references public.clubs on delete cascade,
  user_id uuid references auth.users on delete cascade,
  author_username text,
  type text check (type in ('review','comment','question')),
  content text not null,
  created_at timestamptz default now()
);

-- CHALLENGES
create table public.challenges (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  challenge_id text not null,
  title text,
  badge text,
  color text,
  joined_at timestamptz default now(),
  completed boolean default false,
  completed_at timestamptz,
  unique(user_id, challenge_id)
);

-- FOLLOWS
create table public.follows (
  follower_id uuid references auth.users on delete cascade,
  following_id uuid references auth.users on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id)
);

-- AI CACHE
create table public.ai_cache (
  cache_key text primary key,
  response text not null,
  user_id uuid references auth.users on delete cascade,
  created_at timestamptz default now()
);

-- AI USAGE (rate limiting)
create table public.ai_usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  model text,
  tokens integer default 0,
  created_at timestamptz default now()
);

-- AI PROFILE ANALYSIS (cached per user)
create table public.ai_analysis (
  user_id uuid references auth.users on delete cascade primary key,
  profile_text text,
  recs jsonb,
  updated_at timestamptz default now()
);

-- ═══════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════

alter table public.profiles enable row level security;
alter table public.library enable row level security;
alter table public.reading enable row level security;
alter table public.finished enable row level security;
alter table public.notes enable row level security;
alter table public.wishlist enable row level security;
alter table public.reading_goals enable row level security;
alter table public.clubs enable row level security;
alter table public.club_members enable row level security;
alter table public.club_posts enable row level security;
alter table public.challenges enable row level security;
alter table public.follows enable row level security;
alter table public.ai_cache enable row level security;
alter table public.ai_usage enable row level security;
alter table public.ai_analysis enable row level security;

-- Profiles: público para leitura, privado para escrita
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Library, Reading, Finished, Notes, Wishlist, Goals: apenas o dono
create policy "Own library" on public.library for all using (auth.uid() = user_id);
create policy "Own reading" on public.reading for all using (auth.uid() = user_id);
create policy "Own finished" on public.finished for all using (auth.uid() = user_id);
create policy "Own notes" on public.notes for all using (auth.uid() = user_id);
create policy "Own wishlist" on public.wishlist for all using (auth.uid() = user_id);
create policy "Own goals" on public.reading_goals for all using (auth.uid() = user_id);
create policy "Own challenges" on public.challenges for all using (auth.uid() = user_id);
create policy "Own ai cache" on public.ai_cache for all using (auth.uid() = user_id);
create policy "Own ai usage" on public.ai_usage for all using (auth.uid() = user_id);
create policy "Own ai analysis" on public.ai_analysis for all using (auth.uid() = user_id);

-- Clubs: públicos visíveis para todos
create policy "Public clubs viewable" on public.clubs for select using (is_public = true or owner_id = auth.uid());
create policy "Authenticated can create clubs" on public.clubs for insert with check (auth.uid() = owner_id);
create policy "Owner can update club" on public.clubs for update using (auth.uid() = owner_id);

create policy "Club members viewable" on public.club_members for select using (true);
create policy "Can join public clubs" on public.club_members for insert with check (auth.uid() = user_id);

create policy "Club posts viewable" on public.club_posts for select using (true);
create policy "Members can post" on public.club_posts for insert with check (auth.uid() = user_id);

-- Follows
create policy "Follows viewable" on public.follows for select using (true);
create policy "Can follow" on public.follows for insert with check (auth.uid() = follower_id);
create policy "Can unfollow" on public.follows for delete using (auth.uid() = follower_id);

-- ═══════════════════════════════════════
-- TRIGGER: auto-create profile on signup
-- ═══════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, first_name, last_name, birthday)
  values (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    (new.raw_user_meta_data->>'birthday')::date
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
