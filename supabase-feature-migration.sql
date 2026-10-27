-- Catalog favorites, wishlists, recommendations, and copy availability.
-- Run once in the Supabase SQL editor after deploying the matching app code.

BEGIN;

-- Preserve the current meaning of borrowed copies after circulation is removed.
ALTER TABLE public.book_copies DROP CONSTRAINT IF EXISTS book_copies_status_check;
UPDATE public.book_copies SET status = 'Unavailable' WHERE status = 'Borrowed';
ALTER TABLE public.book_copies
  ADD CONSTRAINT book_copies_status_check CHECK (status IN ('Available', 'Unavailable'));

ALTER TABLE public.books DROP CONSTRAINT IF EXISTS books_status_check;
UPDATE public.books SET status = 'Unavailable' WHERE status = 'Borrowed';
ALTER TABLE public.books
  ADD CONSTRAINT books_status_check CHECK (status IN ('Available', 'Unavailable', 'Reserved', 'Lost', 'Damaged'));

UPDATE public.books AS b
SET available_copies = counts.available_count
FROM (
  SELECT b2.id, COUNT(c.id) FILTER (WHERE c.status = 'Available')::integer AS available_count
  FROM public.books AS b2
  LEFT JOIN public.book_copies AS c ON c.book_id = b2.id
  GROUP BY b2.id
) AS counts
WHERE b.id = counts.id;

CREATE TABLE IF NOT EXISTS public.student_book_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  list_kind VARCHAR(20) NOT NULL CHECK (list_kind IN ('favorite', 'wishlist', 'recommendation')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (student_id, book_id, list_kind)
);

CREATE INDEX IF NOT EXISTS idx_student_book_lists_student_kind
  ON public.student_book_lists(student_id, list_kind);

ALTER TABLE public.student_book_lists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to student_book_lists" ON public.student_book_lists;
CREATE POLICY "Allow all access to student_book_lists"
  ON public.student_book_lists FOR ALL USING (true) WITH CHECK (true);

DROP TABLE IF EXISTS public.returns CASCADE;
DROP TABLE IF EXISTS public.borrow_records CASCADE;
DROP TABLE IF EXISTS public.borrow_requests CASCADE;

COMMIT;
