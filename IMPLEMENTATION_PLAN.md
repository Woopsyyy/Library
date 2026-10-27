# Library Catalog and Student Book Lists

## Summary

This handoff plan describes replacing circulation workflows with student book lists and manual per-copy availability. The checkout initially had a catalog serials modal with a borrow action, borrow/waitlist cards, circulation pages and service methods, display-only copy statuses, and no favorite, wishlist, or recommendation persistence.

## Implementation

- The catalog presents one **More Details** action per book. The modal shows book details and calling numbers, with green Available and red Unavailable statuses. Borrow and waitlist actions are removed.
- Catalog cards provide independent Favorite, Wishlist, and Recommendation toggles. Choices are scoped to the signed-in student and persisted in Supabase; local storage remains the offline fallback. Guests are sent through login and returned to the catalog.
- The student page shows counts and a separate carousel for each list. Each carousel shows three books, has independent navigation, and only shows arrows when there are more than three books.
- Admins toggle each calling number between Available and Unavailable. Availability totals derive from available copies.
- Configuration and book forms call the existing book type classification Courses. Existing `book_types` rows and book links are retained.
- Circulation pages, routes, dashboard metrics/actions, service methods, and types are removed. The migration drops borrow request, borrow record, and return tables. Existing copies marked Borrowed become Unavailable before their constraint is changed. Other user, book, copy, and catalog data is retained.

## Data and Interface

- Add `student_book_lists` with a student ID, book ID, list kind (`favorite`, `wishlist`, or `recommendation`), and creation timestamp. Enforce one row per student/book/list kind, cascade on user/book deletion, and enable RLS with policies matching this demo app's existing open-access Supabase model.
- Expose service operations to retrieve a student's three lists and toggle one student/book/list entry. In offline mode, persist equivalent entries in a dedicated local storage key.
- Extend `book_copies.status` to allow only Available and Unavailable. Recalculate `books.available_copies` during migration and after copy status changes.
- Keep database table `book_types` and its `type_id` relation. Rename user-facing labels and messages to Courses without moving or deleting existing classification rows.

## Acceptance Checks

- More Details opens the full book modal; calling numbers use correct status labels and colors.
- Student list actions are independent, persist across reloads, and remain student-specific. Login redirection returns the visitor to the catalog.
- Each student carousel shows up to three cards, advances independently, and hides arrows at three books or fewer.
- Admin copy status changes persist and update counts and catalog availability.
- Existing course/type assignments remain associated and appear under Courses in the UI.
- Circulation controls, pages, routes, dashboard content, methods, and database tables are gone after applying the migration.
- TypeScript/Vite build succeeds; SQL scripts and migration are inspected for consistency.

## Assumptions

- Recommendation is the student's own saved list, not a shared public feed.
- A student may assign a book to any combination of the three lists.
- Existing Borrowed copies are unavailable after circulation data is removed.
- The current custom user session ID is the student key; `book_types` remains the backing table for Courses.
