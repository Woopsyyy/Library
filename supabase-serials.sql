-- Talisay Online Library: per-copy serial numbers
-- Safe for repeated execution. Run in Supabase SQL editor (or via MCP apply_migration).
-- Every physical copy gets a unique serial (TLB-<book>-001, ...), so two copies
-- of the same title are always distinguishable.

-- 1. Copies table
CREATE TABLE IF NOT EXISTS public.book_copies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    serial_number VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Borrowed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_book_copies_book ON public.book_copies(book_id);
CREATE INDEX IF NOT EXISTS idx_book_copies_serial ON public.book_copies(serial_number);

ALTER TABLE public.book_copies ENABLE ROW LEVEL SECURITY;

-- Open-access policy (matches this app's demo policy using the anon key)
DROP POLICY IF EXISTS "Allow all access to book_copies" ON public.book_copies;
CREATE POLICY "Allow all access to book_copies"
    ON public.book_copies FOR ALL USING (true) WITH CHECK (true);

-- 2. Serial reference on circulation records
ALTER TABLE public.borrow_records ADD COLUMN IF NOT EXISTS serial_number VARCHAR(50) NOT NULL DEFAULT '';
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS serial_number VARCHAR(50) NOT NULL DEFAULT '';

-- 3. Backfill: one copy row per existing copy count.
-- Copies beyond the available count are marked Borrowed (they are lent out).
INSERT INTO public.book_copies (book_id, serial_number, status)
SELECT
    b.id,
    'TLB-' || upper(substr(replace(b.id::text, '-', ''), 1, 8)) || '-' || lpad(gs.n::text, 3, '0'),
    CASE WHEN gs.n <= GREATEST(b.total_copies - b.available_copies, 0) THEN 'Borrowed' ELSE 'Available' END
FROM public.books b
CROSS JOIN LATERAL generate_series(1, GREATEST(b.total_copies, 0)) AS gs(n)
WHERE NOT EXISTS (SELECT 1 FROM public.book_copies c WHERE c.book_id = b.id)
ON CONFLICT (serial_number) DO NOTHING;
