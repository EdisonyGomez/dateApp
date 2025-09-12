create table public.daily_questions (
  id uuid not null default gen_random_uuid (),
  question_id uuid null,
  date date not null,
  created_at timestamp with time zone null default now(),
  pair_key text null,
  constraint daily_questions_pkey primary key (id),
  constraint daily_questions_date_key unique (date),
  constraint daily_questions_question_id_fkey foreign KEY (question_id) references game_questions (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_daily_questions_date on public.daily_questions using btree (date) TABLESPACE pg_default;

create index IF not exists idx_daily_questions_question_id on public.daily_questions using btree (question_id) TABLESPACE pg_default;

create unique INDEX IF not exists uq_daily_questions_pair_date on public.daily_questions using btree (pair_key, date) TABLESPACE pg_default;

create index IF not exists idx_daily_questions_pair_date on public.daily_questions using btree (pair_key, date) TABLESPACE pg_default;



create table public.diary_entries (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  date date not null,
  title text not null,
  content text not null,
  mood text not null,
  is_private boolean null default false,
  photos text[] null default '{}'::text[],
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint diary_entries_pkey primary key (id),
  constraint diary_entries_user_id_fkey foreign KEY (user_id) references auth.users (id),
  constraint diary_entries_user_id_fkey1 foreign KEY (user_id) references profiles (id),
  constraint diary_entries_mood_check check (
    (
      mood = any (
        array[
          'happy'::text,
          'sad'::text,
          'excited'::text,
          'calm'::text,
          'stressed'::text,
          'grateful'::text,
          'neutral'::text,
          'cansado'::text,
          'enamorado'::text,
          'aburrido'::text,
          'sorprendido'::text,
          'confundido'::text,
          'ansioso'::text,
          'relajado'::text,
          'nostálgico'::text,
          'motivado'::text,
          'inspirado'::text,
          'frustrado'::text,
          'aliviado'::text,
          'worried'::text,
          'scared'::text,
          'hopeful'::text,
          'mad'::text,
          'horny'::text,
          'meh'::text,
          'sleepy'::text,
          'sick'::text,
          'jealous'::text,
          'proud'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists diary_entries_user_idx on public.diary_entries using btree (user_id) TABLESPACE pg_default;

create index IF not exists diary_entries_date_idx on public.diary_entries using btree (date desc) TABLESPACE pg_default;

create table public.game_questions (
  id uuid not null default gen_random_uuid (),
  question text not null,
  category character varying(20) not null,
  created_by uuid null,
  created_at timestamp with time zone null default now(),
  is_active boolean null default true,
  constraint game_questions_pkey primary key (id),
  constraint game_questions_created_by_fkey foreign KEY (created_by) references profiles (id) on delete CASCADE,
  constraint game_questions_category_check check (
    (
      (category)::text = any (
        (
          array[
            'deep'::character varying,
            'fun'::character varying,
            'memory'::character varying,
            'future'::character varying,
            'intimate'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_game_questions_active on public.game_questions using btree (is_active, created_at) TABLESPACE pg_default;

create index IF not exists idx_game_questions_category on public.game_questions using btree (category) TABLESPACE pg_default;

create table public.game_reactions (
  id uuid not null default extensions.uuid_generate_v4 (),
  response_id uuid null,
  user_id uuid null,
  emoji text not null,
  created_at timestamp with time zone null default now(),
  constraint game_reactions_pkey primary key (id),
  constraint game_reactions_response_id_user_id_key unique (response_id, user_id),
  constraint game_reactions_response_id_fkey foreign KEY (response_id) references game_responses (id) on delete CASCADE,
  constraint game_reactions_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_game_reactions_response on public.game_reactions using btree (response_id) TABLESPACE pg_default;


create table public.game_responses (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  question_id text not null,
  question text not null,
  category text null,
  date date not null default CURRENT_DATE,
  created_at timestamp without time zone null default now(),
  is_private boolean null default false,
  answer text null,
  constraint game_responses_pkey primary key (id),
  constraint game_responses_user_id_fkey foreign KEY (user_id) references profiles (id)
) TABLESPACE pg_default;

create index IF not exists idx_game_responses_user_date on public.game_responses using btree (user_id, date) TABLESPACE pg_default;

create index IF not exists idx_game_responses_date on public.game_responses using btree (date desc) TABLESPACE pg_default;

create table public.game_streaks (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  current_streak integer null default 0,
  longest_streak integer null default 0,
  last_played_date date null,
  total_questions_answered integer null default 0,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint game_streaks_pkey primary key (id),
  constraint game_streaks_user_id_fkey foreign KEY (user_id) references auth.users (id)
) TABLESPACE pg_default;

create unique INDEX IF not exists game_streaks_user_idx on public.game_streaks using btree (user_id) TABLESPACE pg_default;

create table public.love_notes (
  id uuid not null default gen_random_uuid (),
  recipient_id uuid null,
  sender_id uuid null,
  message text not null,
  created_at timestamp with time zone null default now(),
  seen boolean null default false,
  constraint love_notes_pkey primary key (id),
  constraint love_notes_recipient_id_fkey foreign KEY (recipient_id) references profiles (id) on delete CASCADE,
  constraint love_notes_sender_id_fkey foreign KEY (sender_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.profiles (
  id uuid not null,
  email text not null,
  name text not null,
  partner_id uuid null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  avatar_url text null,
  birthday date null,
  meet_date date null,
  chinese_day text null,
  languages text[] null,
  profession text null,
  favorite_foods text[] null,
  hobbies text[] null,
  favorite_music text null,
  favorite_songs text[] null,
  favorite_movies text[] null,
  love_story text null,
  couple_song text null,
  special_places text[] null,
  favorite_activities text[] null,
  anniversaries jsonb null,
  dream_destinations text[] null,
  future_goals text[] null,
  love_languages text[] null,
  pet_names text[] null,
  relationship_milestones text[] null,
  watched_media jsonb null default '[]'::jsonb,
  constraint profiles_pkey primary key (id),
  constraint profiles_email_key unique (email),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id),
  constraint profiles_partner_id_fkey foreign KEY (partner_id) references auth.users (id)
) TABLESPACE pg_default;

create index IF not exists profiles_email_idx on public.profiles using btree (email) TABLESPACE pg_default;

create index IF not exists profiles_partner_idx on public.profiles using btree (partner_id) TABLESPACE pg_default;

create index IF not exists idx_profiles_dream_destinations on public.profiles using gin (dream_destinations) TABLESPACE pg_default;

create index IF not exists idx_profiles_future_goals on public.profiles using gin (future_goals) TABLESPACE pg_default;

create index IF not exists idx_profiles_love_languages on public.profiles using gin (love_languages) TABLESPACE pg_default;

create index IF not exists idx_profiles_pet_names on public.profiles using gin (pet_names) TABLESPACE pg_default;

create index IF not exists idx_profiles_relationship_milestones on public.profiles using gin (relationship_milestones) TABLESPACE pg_default;

create index IF not exists idx_profiles_watched_media on public.profiles using gin (watched_media) TABLESPACE pg_default;

create table public.profiles (
  id uuid not null,
  email text not null,
  name text not null,
  partner_id uuid null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  avatar_url text null,
  birthday date null,
  meet_date date null,
  chinese_day text null,
  languages text[] null,
  profession text null,
  favorite_foods text[] null,
  hobbies text[] null,
  favorite_music text null,
  favorite_songs text[] null,
  favorite_movies text[] null,
  love_story text null,
  couple_song text null,
  special_places text[] null,
  favorite_activities text[] null,
  anniversaries jsonb null,
  dream_destinations text[] null,
  future_goals text[] null,
  love_languages text[] null,
  pet_names text[] null,
  relationship_milestones text[] null,
  watched_media jsonb null default '[]'::jsonb,
  constraint profiles_pkey primary key (id),
  constraint profiles_email_key unique (email),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id),
  constraint profiles_partner_id_fkey foreign KEY (partner_id) references auth.users (id)
) TABLESPACE pg_default;

create index IF not exists profiles_email_idx on public.profiles using btree (email) TABLESPACE pg_default;

create index IF not exists profiles_partner_idx on public.profiles using btree (partner_id) TABLESPACE pg_default;

create index IF not exists idx_profiles_dream_destinations on public.profiles using gin (dream_destinations) TABLESPACE pg_default;

create index IF not exists idx_profiles_future_goals on public.profiles using gin (future_goals) TABLESPACE pg_default;

create index IF not exists idx_profiles_love_languages on public.profiles using gin (love_languages) TABLESPACE pg_default;

create index IF not exists idx_profiles_pet_names on public.profiles using gin (pet_names) TABLESPACE pg_default;

create index IF not exists idx_profiles_relationship_milestones on public.profiles using gin (relationship_milestones) TABLESPACE pg_default;

create index IF not exists idx_profiles_watched_media on public.profiles using gin (watched_media) TABLESPACE pg_default;