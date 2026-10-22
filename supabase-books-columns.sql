-- Migration: Add missing columns to books table
-- Safe to re-run (uses IF NOT EXISTS)

ALTER TABLE public.books ADD COLUMN IF NOT EXISTS author        VARCHAR(255);
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS published_date VARCHAR(50);
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS tags          TEXT[]   DEFAULT '{}';
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS location       VARCHAR(255);
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS copyright_year VARCHAR(10);
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS publisher      VARCHAR(255);
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS accession_number VARCHAR(100);
