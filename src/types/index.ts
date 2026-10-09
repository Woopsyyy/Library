export type BookStatus = 'Available' | 'Borrowed' | 'Reserved' | 'Lost' | 'Damaged';
export type RequestStatus = 'Pending' | 'Approved' | 'Rejected';
export type BorrowRecordStatus = 'Borrowed' | 'Returned' | 'Overdue';
export type UserStatus = 'Active' | 'Disabled';

export interface BookType {
  id: string;
  name: string;
  created_at?: string;
}


export interface Book {
  id: string;
  title: string;
  type_id: string;
  type_name?: string;
  total_copies: number;
  available_copies: number;
  status: BookStatus;
  cover_url?: string;
  author?: string;
  published_date?: string | null;
  tags?: string[];
  created_at?: string;
}

export interface Author {
  id: string;
  name: string;
  created_at?: string;
}

export interface Tag {
  id: string;
  name: string;
  created_at?: string;
}

export interface BorrowRequest {
  id: string;
  inquiry_number: string;
  student_name: string;
  student_id: string;
  course: string;
  year_level: string;
  section: string;
  book_id: string;
  book_title?: string;
  book_type?: string;

  serial_number?: string;
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
  serial_number?: string;
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
  serial_number?: string;
}

export type BookCopyStatus = 'Available' | 'Borrowed';

export interface BookCopy {
  id: string;
  book_id: string;
  serial_number: string;
  status: BookCopyStatus;
  created_at?: string;
}

export type AccountType = 'admin' | 'student';

export interface User {
  id: string;
  account_type: AccountType;
  /** Login name for admins; '' for students */
  username: string;
  /** School ID for students (XXXX-XXXX); '' for admins */
  school_id: string;
  full_name: string;
  role: 'Admin' | 'Librarian' | 'Student';
  status: UserStatus;
  course?: string;
  year_level?: string;
  section?: string;
  created_at?: string;
  password?: string;
  plain_password?: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  details?: string;
  user_name: string;
  created_at: string;
}
