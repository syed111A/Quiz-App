create extension if not exists vector with schema extensions;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 100),
  subject text not null check (char_length(subject) between 2 and 120),
  difficulty text not null check (difficulty in ('easy', 'mixed', 'advanced')),
  source text not null default 'ai' check (source in ('ai', 'manual', 'document')),
  question_count integer not null check (question_count between 1 and 50),
  questions jsonb not null default '[]'::jsonb check (jsonb_typeof(questions) = 'array'),
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  score integer not null check (score >= 0),
  total_questions integer not null check (total_questions > 0),
  completed_at timestamptz not null default now(),
  check (score <= total_questions)
);

create table if not exists public.ai_quiz_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  usage_date date not null default (now() at time zone 'utc')::date,
  generation_count integer not null default 0 check (generation_count >= 0),
  primary key (user_id, usage_date)
);

create table if not exists public.study_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  file_name text not null,
  storage_path text not null unique,
  page_count integer not null default 0 check (page_count >= 0),
  status text not null default 'uploaded' check (status in ('uploaded', 'processing', 'ready', 'failed')),
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  document_id uuid not null references public.study_documents (id) on delete cascade,
  chunk_index integer not null check (chunk_index >= 0),
  page_number integer not null check (page_number > 0),
  content text not null,
  embedding extensions.vector(768) not null,
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index)
);

alter table public.quizzes
  add column if not exists source_document_id uuid references public.study_documents (id) on delete set null,
  add column if not exists is_adaptive boolean not null default false;

create table if not exists public.ai_tutor_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  usage_date date not null default (now() at time zone 'utc')::date,
  request_count integer not null default 0 check (request_count >= 0),
  primary key (user_id, usage_date)
);

create table if not exists public.ai_document_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  usage_date date not null default (now() at time zone 'utc')::date,
  index_count integer not null default 0 check (index_count >= 0),
  primary key (user_id, usage_date)
);

create index if not exists quizzes_user_created_idx on public.quizzes (user_id, created_at desc);
create index if not exists quiz_attempts_user_completed_idx on public.quiz_attempts (user_id, completed_at desc);
create index if not exists quiz_attempts_quiz_idx on public.quiz_attempts (quiz_id);
create index if not exists study_documents_user_created_idx on public.study_documents (user_id, created_at desc);
create index if not exists document_chunks_document_idx on public.document_chunks (document_id, chunk_index);
create index if not exists document_chunks_embedding_idx on public.document_chunks
  using hnsw (embedding extensions.vector_cosine_ops);

alter table public.profiles enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.ai_quiz_usage enable row level security;
alter table public.study_documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.ai_tutor_usage enable row level security;
alter table public.ai_document_usage enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Users can update their own profile"
  on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users can read their own quizzes"
  on public.quizzes for select to authenticated using (auth.uid() = user_id);
create policy "Users can create their own quizzes"
  on public.quizzes for insert to authenticated
  with check (
    auth.uid() = user_id
    and (
      source_document_id is null
      or exists (
        select 1 from public.study_documents
        where study_documents.id = quizzes.source_document_id
          and study_documents.user_id = auth.uid()
      )
    )
  );
create policy "Users can update their own quizzes"
  on public.quizzes for update to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      source_document_id is null
      or exists (
        select 1 from public.study_documents
        where study_documents.id = quizzes.source_document_id
          and study_documents.user_id = auth.uid()
      )
    )
  );
create policy "Users can delete their own quizzes"
  on public.quizzes for delete to authenticated using (auth.uid() = user_id);

create policy "Users can read their own attempts"
  on public.quiz_attempts for select to authenticated using (auth.uid() = user_id);
create policy "Users can record attempts for their own quizzes"
  on public.quiz_attempts for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.quizzes
      where quizzes.id = quiz_attempts.quiz_id
        and quizzes.user_id = auth.uid()
    )
  );

create policy "Users can read their own AI usage"
  on public.ai_quiz_usage for select to authenticated using (auth.uid() = user_id);

create policy "Users can read their own study documents"
  on public.study_documents for select to authenticated using (auth.uid() = user_id);
create policy "Users can create their own study documents"
  on public.study_documents for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update their own study documents"
  on public.study_documents for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own study documents"
  on public.study_documents for delete to authenticated using (auth.uid() = user_id);

create policy "Users can read their own document chunks"
  on public.document_chunks for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert their own document chunks"
  on public.document_chunks for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.study_documents
      where study_documents.id = document_chunks.document_id
        and study_documents.user_id = auth.uid()
    )
  );
create policy "Users can delete their own document chunks"
  on public.document_chunks for delete to authenticated using (auth.uid() = user_id);

create policy "Users can read their own AI tutor usage"
  on public.ai_tutor_usage for select to authenticated using (auth.uid() = user_id);

create policy "Users can read their own document indexing usage"
  on public.ai_document_usage for select to authenticated using (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('study-materials', 'study-materials', false, 15728640, array['application/pdf'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Users can upload their own study files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'study-materials'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "Users can read their own study files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'study-materials'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "Users can delete their own study files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'study-materials'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.create_profile_for_new_user();

create or replace function public.consume_quiz_generation()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  updated_count integer;
begin
  if current_user_id is null then
    return false;
  end if;

  insert into public.ai_quiz_usage (user_id, usage_date, generation_count)
  values (current_user_id, (now() at time zone 'utc')::date, 1)
  on conflict (user_id, usage_date)
  do update set generation_count = public.ai_quiz_usage.generation_count + 1
  where public.ai_quiz_usage.generation_count < 10
  returning generation_count into updated_count;

  return updated_count is not null;
end;
$$;

revoke all on function public.consume_quiz_generation() from public, anon;
grant execute on function public.consume_quiz_generation() to authenticated;

create or replace function public.consume_tutor_request()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  updated_count integer;
begin
  if current_user_id is null then
    return false;
  end if;

  insert into public.ai_tutor_usage (user_id, usage_date, request_count)
  values (current_user_id, (now() at time zone 'utc')::date, 1)
  on conflict (user_id, usage_date)
  do update set request_count = public.ai_tutor_usage.request_count + 1
  where public.ai_tutor_usage.request_count < 40
  returning request_count into updated_count;

  return updated_count is not null;
end;
$$;

revoke all on function public.consume_tutor_request() from public, anon;
grant execute on function public.consume_tutor_request() to authenticated;

create or replace function public.consume_document_index()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  updated_count integer;
begin
  if current_user_id is null then
    return false;
  end if;

  insert into public.ai_document_usage (user_id, usage_date, index_count)
  values (current_user_id, (now() at time zone 'utc')::date, 1)
  on conflict (user_id, usage_date)
  do update set index_count = public.ai_document_usage.index_count + 1
  where public.ai_document_usage.index_count < 5
  returning index_count into updated_count;

  return updated_count is not null;
end;
$$;

revoke all on function public.consume_document_index() from public, anon;
grant execute on function public.consume_document_index() to authenticated;

create or replace function public.match_document_chunks(
  query_embedding extensions.vector(768),
  match_count integer default 6,
  filter_document_id uuid default null
)
returns table (
  id uuid,
  document_id uuid,
  document_title text,
  content text,
  page_number integer,
  similarity double precision
)
language sql
stable
set search_path = ''
as $$
  select
    chunks.id,
    chunks.document_id,
    documents.title,
    chunks.content,
    chunks.page_number,
    1 - (chunks.embedding OPERATOR(extensions.<=>) query_embedding) as similarity
  from public.document_chunks as chunks
  join public.study_documents as documents on documents.id = chunks.document_id
  where chunks.user_id = auth.uid()
    and documents.user_id = auth.uid()
    and documents.status = 'ready'
    and (filter_document_id is null or chunks.document_id = filter_document_id)
  order by chunks.embedding OPERATOR(extensions.<=>) query_embedding
  limit greatest(1, least(match_count, 12));
$$;

revoke all on function public.match_document_chunks(extensions.vector, integer, uuid) from public, anon;
grant execute on function public.match_document_chunks(extensions.vector, integer, uuid) to authenticated;

grant usage on schema public to authenticated;
grant usage on schema extensions to authenticated;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.quizzes to authenticated;
grant select, insert on public.quiz_attempts to authenticated;
grant select on public.ai_quiz_usage to authenticated;

grant select, insert, update, delete on public.study_documents to authenticated;
grant select, insert, delete on public.document_chunks to authenticated;
grant select on public.ai_tutor_usage to authenticated;
grant select on public.ai_document_usage to authenticated;
