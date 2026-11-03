-- Borrowing support + per-book loan duration config

-- 1. Per-book independent borrow duration (max days)
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS borrow_duration_days INT NOT NULL DEFAULT 7;
UPDATE public.books AS b
SET borrow_duration_days = COALESCE(bt.borrow_duration_days, 7)
FROM public.book_types AS bt
WHERE b.type_id = bt.id AND (b.borrow_duration_days IS NULL OR b.borrow_duration_days = 7);

-- 2. Borrow records
CREATE TABLE IF NOT EXISTS public.borrow_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    copy_id UUID REFERENCES public.book_copies(id) ON DELETE SET NULL,
    borrow_days INT NOT NULL CHECK (borrow_days >= 1),
    borrowed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Borrowed' CHECK (status IN ('Borrowed','Returned','Overdue')),
    returned_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_borrow_records_student ON public.borrow_records(student_id);
CREATE INDEX IF NOT EXISTS idx_borrow_records_book ON public.borrow_records(book_id);
CREATE INDEX IF NOT EXISTS idx_borrow_records_status ON public.borrow_records(status);

ALTER TABLE public.borrow_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to borrow_records" ON public.borrow_records;
CREATE POLICY "Allow all access to borrow_records"
    ON public.borrow_records FOR ALL USING (true) WITH CHECK (true);
