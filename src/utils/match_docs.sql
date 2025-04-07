-- Run in Supabase SQL editor
create or replace function match_documents(query_embedding vector(768), match_count int default 5)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    id,
    content,
    metadata,
    1 - (embedding <=> query_embedding) as similarity
  from rag_docs
  order by embedding <=> query_embedding
  limit match_count;
$$;
