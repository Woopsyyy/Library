-- Talisay Online Library: merge admin_users + students into a single users table
-- Safe for repeated execution. Run in Supabase SQL editor (or via MCP apply_migration).
-- Step 1 creates + backfills; step 2 (bottom) drops the old tables after verification.

-- 1. Unified users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_type VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (account_type IN ('admin', 'student')),
    username VARCHAR(100) NOT NULL DEFAULT '',
    school_id VARCHAR(50) NOT NULL DEFAULT '',
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Student' CHECK (role IN ('Admin', 'Librarian', 'Student')),
    status VARCHAR(50) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Disabled')),
    password VARCHAR(255) NOT NULL DEFAULT '',
    plain_password VARCHAR(255) NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Unique logins, scoped per account kind (empty string = "not applicable")
CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON public.users(username) WHERE username <> '';
CREATE UNIQUE INDEX IF NOT EXISTS users_school_id_unique ON public.users(school_id) WHERE school_id <> '';
CREATE INDEX IF NOT EXISTS idx_users_account_type ON public.users(account_type);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Open-access policy (matches this app's demo policy using the anon key)
DROP POLICY IF EXISTS "Allow all access to users" ON public.users;
CREATE POLICY "Allow all access to users"
    ON public.users FOR ALL USING (true) WITH CHECK (true);

-- 2. Backfill from the old tables (no-op when already merged)
INSERT INTO public.users (id, account_type, username, school_id, full_name, role, status, password, plain_password, created_at)
SELECT id, 'admin', username, '', full_name, role, status, password, plain_password, created_at
FROM public.admin_users
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, account_type, username, school_id, full_name, role, status, password, plain_password, created_at)
SELECT id, 'student', '', school_id, full_name, 'Student', 'Active', password, plain_password, created_at
FROM public.students
ON CONFLICT (id) DO NOTHING;

-- 3. Remove the legacy tables (all rows are now in users — verified 3 admin + 1 student)
DROP TABLE IF EXISTS public.admin_users;
DROP TABLE IF EXISTS public.students;
