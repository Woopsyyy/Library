-- Talisay Online Library: authors + tags catalog expansion
-- Safe for repeated execution. Run in Supabase SQL editor (or via MCP apply_migration).

-- 1. AUTHORS lookup table (managed in Config page)
CREATE TABLE IF NOT EXISTS public.authors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TAGS lookup table (managed in Config page)
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. New columns on books (free-text author, publish date, multi tags)
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS author VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS published_date DATE;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_books_author ON public.books(author);

ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Open-access policies (match this app's demo policy using the anon key)
DROP POLICY IF EXISTS "Allow all access to authors" ON public.authors;
CREATE POLICY "Allow all access to authors"
    ON public.authors FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to tags" ON public.tags;
CREATE POLICY "Allow all access to tags"
    ON public.tags FOR ALL USING (true) WITH CHECK (true);
