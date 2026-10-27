-- Talisay Online Library Management System - Complete Supabase Schema
-- Safe for repeated execution. Run in Supabase SQL Editor.

-- Enable UUID Extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. BOOK TYPES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.book_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- 2. BOOKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    type_id UUID REFERENCES public.book_types(id) ON DELETE SET NULL,
    total_copies INT NOT NULL DEFAULT 1 CHECK (total_copies >= 0),
    available_copies INT NOT NULL DEFAULT 1 CHECK (available_copies >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Unavailable', 'Reserved', 'Lost', 'Damaged')),
    cover_url VARCHAR(500),
    author VARCHAR(255) NOT NULL DEFAULT '',
    published_date DATE,
    tags TEXT[] NOT NULL DEFAULT '{}',
    location VARCHAR(255),
    copyright_year VARCHAR(10),
    publisher VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_books_type ON public.books(type_id);
CREATE INDEX IF NOT EXISTS idx_books_author ON public.books(author);

-- ============================================
-- 3. BOOK COPIES TABLE (Each physical copy has an auto-generated unique serial number)
-- ============================================
CREATE TABLE IF NOT EXISTS public.book_copies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    serial_number VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Unavailable')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Upgrade an existing schema to admin-managed availability statuses.
ALTER TABLE public.book_copies DROP CONSTRAINT IF EXISTS book_copies_status_check;
UPDATE public.book_copies SET status = 'Unavailable' WHERE status = 'Borrowed';
ALTER TABLE public.book_copies
    ADD CONSTRAINT book_copies_status_check CHECK (status IN ('Available', 'Unavailable'));
ALTER TABLE public.books DROP CONSTRAINT IF EXISTS books_status_check;
UPDATE public.books SET status = 'Unavailable' WHERE status = 'Borrowed';
ALTER TABLE public.books
    ADD CONSTRAINT books_status_check CHECK (status IN ('Available', 'Unavailable', 'Reserved', 'Lost', 'Damaged'));

-- ============================================
-- 7. UNIFIED USERS TABLE (replaces admin_users + students)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_type VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (account_type IN ('admin', 'student')),
    username VARCHAR(100) NOT NULL DEFAULT '',
    school_id VARCHAR(50) NOT NULL DEFAULT '',
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Student' CHECK (role IN ('Admin', 'Librarian', 'Student')),
    status VARCHAR(50) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Disabled')),
    course VARCHAR(100),
    year_level VARCHAR(50),
    section VARCHAR(50),
    password VARCHAR(255) NOT NULL DEFAULT '',
    plain_password VARCHAR(255) NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Safe migrations for existing users table (adds missing columns if table already exists)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS course VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS year_level VARCHAR(50);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS section VARCHAR(50);

-- Unique logins, scoped per account kind (empty string = "not applicable")
CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON public.users(username) WHERE username <> '';
CREATE UNIQUE INDEX IF NOT EXISTS users_school_id_unique ON public.users(school_id) WHERE school_id <> '';
CREATE INDEX IF NOT EXISTS idx_users_account_type ON public.users(account_type);

-- ============================================
-- STUDENT BOOK LISTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.student_book_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    list_kind VARCHAR(20) NOT NULL CHECK (list_kind IN ('favorite', 'wishlist', 'recommendation')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (student_id, book_id, list_kind)
);

CREATE INDEX IF NOT EXISTS idx_student_book_lists_student_kind ON public.student_book_lists(student_id, list_kind);

-- ============================================
-- 8. AUTHORS TABLE (managed in Config page)
-- ============================================
CREATE TABLE IF NOT EXISTS public.authors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- 9. TAGS TABLE (managed in Config page)
-- ============================================
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- 10. ACTIVITY LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(255) NOT NULL,
    details TEXT,
    user_name VARCHAR(255) DEFAULT 'System',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE public.book_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_copies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_book_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- OPEN-ACCESS POLICIES (matches this app's demo policy using the anon key)
-- ============================================
-- Book Types
DROP POLICY IF EXISTS "Allow all access to book_types" ON public.book_types;
CREATE POLICY "Allow all access to book_types"
    ON public.book_types FOR ALL USING (true) WITH CHECK (true);

-- Books
DROP POLICY IF EXISTS "Allow all access to books" ON public.books;
CREATE POLICY "Allow all access to books"
    ON public.books FOR ALL USING (true) WITH CHECK (true);

-- Book Copies
DROP POLICY IF EXISTS "Allow all access to book_copies" ON public.book_copies;
CREATE POLICY "Allow all access to book_copies"
    ON public.book_copies FOR ALL USING (true) WITH CHECK (true);

-- Users
DROP POLICY IF EXISTS "Allow all access to users" ON public.users;
CREATE POLICY "Allow all access to users"
    ON public.users FOR ALL USING (true) WITH CHECK (true);

-- Student book lists
DROP POLICY IF EXISTS "Allow all access to student_book_lists" ON public.student_book_lists;
CREATE POLICY "Allow all access to student_book_lists"
    ON public.student_book_lists FOR ALL USING (true) WITH CHECK (true);

-- Authors
DROP POLICY IF EXISTS "Allow all access to authors" ON public.authors;
CREATE POLICY "Allow all access to authors"
    ON public.authors FOR ALL USING (true) WITH CHECK (true);

-- Tags
DROP POLICY IF EXISTS "Allow all access to tags" ON public.tags;
CREATE POLICY "Allow all access to tags"
    ON public.tags FOR ALL USING (true) WITH CHECK (true);

-- Activity Logs
DROP POLICY IF EXISTS "Allow all access to activity_logs" ON public.activity_logs;
CREATE POLICY "Allow all access to activity_logs"
    ON public.activity_logs FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- STORAGE BUCKET for book cover images (public read access)
-- ============================================
-- Note: Run this only if bucket doesn't exist, or ignore error if it does
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--     'book-covers',
--     'book-covers',
--     true,
--     5242880,
--     ARRAY['image/png','image/jpeg','image/webp','image/gif']
-- );

-- Storage RLS policies: allow anyone to upload & read book cover images
DROP POLICY IF EXISTS "Allow public insert book-covers" ON storage.objects;
CREATE POLICY "Allow public insert book-covers"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'book-covers');

DROP POLICY IF EXISTS "Allow public read book-covers" ON storage.objects;
CREATE POLICY "Allow public read book-covers"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'book-covers');

-- ============================================
-- SEED INITIAL DATA
-- ============================================
-- Book Types
INSERT INTO public.book_types (name) VALUES
    ('Agriculture'),
    ('Technical'),
    ('Educational'),
    ('Research')
ON CONFLICT (name) DO NOTHING;

-- Admin User
INSERT INTO public.users (account_type, username, school_id, full_name, role, status, password, plain_password)
VALUES
    ('admin', 'woopsy', '', 'System Administrator', 'Admin', 'Active', '', '')
ON CONFLICT DO NOTHING;

-- Seed Books (skip if a book with the same title already exists)
INSERT INTO public.books (title, type_id, total_copies, available_copies, status)
SELECT 
    'Introduction to Modern Agriculture',
    bt.id,
    10,
    9,
    'Available'
FROM public.book_types bt
WHERE bt.name = 'Agriculture'
  AND NOT EXISTS (SELECT 1 FROM public.books WHERE title = 'Introduction to Modern Agriculture');

INSERT INTO public.books (title, type_id, total_copies, available_copies, status)
SELECT 
    'Advanced Web Development Systems',
    bt.id,
    5,
    5,
    'Available'
FROM public.book_types bt
WHERE bt.name = 'Technical'
  AND NOT EXISTS (SELECT 1 FROM public.books WHERE title = 'Advanced Web Development Systems');

INSERT INTO public.books (title, type_id, total_copies, available_copies, status)
SELECT 
    'Educational Psychology Fundamentals',
    bt.id,
    8,
    7,
    'Available'
FROM public.book_types bt
WHERE bt.name = 'Educational'
  AND NOT EXISTS (SELECT 1 FROM public.books WHERE title = 'Educational Psychology Fundamentals');

INSERT INTO public.books (title, type_id, total_copies, available_copies, status)
SELECT 
    'Research Methodologies & Data Analysis',
    bt.id,
    12,
    12,
    'Available'
FROM public.book_types bt
WHERE bt.name = 'Research'
  AND NOT EXISTS (SELECT 1 FROM public.books WHERE title = 'Research Methodologies & Data Analysis');
