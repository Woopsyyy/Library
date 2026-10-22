-- Run this script in the Supabase SQL Editor:
-- It safely adds the student columns to your existing "users" table.

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS course VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS year_level VARCHAR(50);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS section VARCHAR(50);
