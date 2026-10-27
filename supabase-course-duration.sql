-- Add borrow_duration_days to book_types for per-course loan duration config.
-- Run in Supabase SQL Editor.

ALTER TABLE public.book_types ADD COLUMN IF NOT EXISTS borrow_duration_days INT NOT NULL DEFAULT 7;

-- Backfill existing rows with a sane default.
UPDATE public.book_types SET borrow_duration_days = 7 WHERE borrow_duration_days IS NULL;
