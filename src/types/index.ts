export type BookStatus = 'Available' | 'Borrowed' | 'Reserved' | 'Lost' | 'Damaged';
export type RequestStatus = 'Pending' | 'Approved' | 'Rejected';
export type BorrowRecordStatus = 'Borrowed' | 'Returned' | 'Overdue';
export type UserStatus = 'Active' | 'Disabled';

export interface BookType {
  id: string;
  name: string;
  created_at?: string;
}

export interface BookSeries {
  id: string;
  name: string;
  created_at?: string;
}

export interface Book {
  id: string;
  title: string;
  type_id: string;
  series_id: string;
  type_name?: string;
  series_name?: string;
  total_copies: number;
  available_copies: number;
  status: BookStatus;
  created_at?: string;
}

export interface BorrowRequest {
  id: string;
  student_name: string;
  student_id: string;
  course: string;
  year_level: string;
  section: string;
  book_id: string;
  book_title?: string;
  book_type?: string;
  book_series?: string;
  duration_days: number;
  request_date: string;
  status: RequestStatus;
}

export interface BorrowRecord {
  id: string;
  request_id?: string;
  student_name: string;
  student_id: string;
  book_id: string;
  book_title?: string;
  borrow_date: string;
  due_date: string;
  status: BorrowRecordStatus;
  remaining_days?: number;
}

export interface ReturnRecord {
  id: string;
  record_id: string;
  student_name: string;
  book_title: string;
  borrow_date: string;
  return_date: string;
  status: 'Returned';
}

export interface AdminUser {
  id: string;
  username: string;
  full_name: string;
  role: 'Admin' | 'Librarian';
  status: UserStatus;
  created_at?: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  details?: string;
  user_name: string;
  created_at: string;
}
