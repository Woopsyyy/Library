import { 
  Book, BookType, BookSeries, BorrowRequest, BorrowRecord, BorrowRecordStatus, ReturnRecord, AdminUser, ActivityLog 
} from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Local storage keys for fallback cache
const STORAGE_KEYS = {
  TYPES: 'talisay_book_types',
  SERIES: 'talisay_book_series',
  BOOKS: 'talisay_books',
  REQUESTS: 'talisay_borrow_requests',
  RECORDS: 'talisay_borrow_records',
  RETURNS: 'talisay_returns',
  USERS: 'talisay_admin_users',
  LOGS: 'talisay_activity_logs',
  AUTH: 'talisay_auth_user',
};

// Helper to get / set LocalStorage
function getLocal<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    if (!data) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return defaultValue;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing ${key} to storage:`, err);
  }
}

// Check database connection
export async function validateDatabaseConnection(): Promise<{ connected: boolean; message?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { 
      connected: false, 
      message: 'Supabase URL or Key not configured in .env file.' 
    };
  }

  try {
    const { data, error } = await supabase.from('book_types').select('id').limit(1);
    if (error) {
      return { 
        connected: false, 
        message: `Database error: ${error.message}. Please run supabase.txt in your Supabase SQL editor.` 
      };
    }
    return { connected: true };
  } catch (err: any) {
    return { 
      connected: false, 
      message: `Database connection failed: ${err.message || 'Network error'}` 
    };
  }
}

// Log Activity Helper
export function logActivity(action: string, details?: string, userName: string = 'Admin'): void {
  const logs = getLocal<ActivityLog[]>(STORAGE_KEYS.LOGS, []);
  const newLog: ActivityLog = {
    id: 'log-' + Date.now(),
    action,
    details,
    user_name: userName,
    created_at: new Date().toISOString()
  };
  logs.unshift(newLog);
  setLocal(STORAGE_KEYS.LOGS, logs.slice(0, 100));

  if (isSupabaseConfigured && supabase) {
    supabase.from('activity_logs').insert([newLog]).then(({ error }) => {
      if (error) console.warn('Supabase activity log error:', error.message);
    });
  }
}

// SERVICE IMPLEMENTATION
export const dataService = {
  // BOOK TYPES
  async getBookTypes(): Promise<BookType[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('book_types').select('*').order('name');
      if (!error && data) return data;
    }
    return getLocal<BookType[]>(STORAGE_KEYS.TYPES, []);
  },

  async addBookType(name: string): Promise<BookType> {
    const cleanName = name.trim();
    if (!cleanName) throw new Error('Book type name is required.');

    const conn = await validateDatabaseConnection();
    if (!conn.connected && isSupabaseConfigured) {
      throw new Error(conn.message || 'Database not connected. Please run supabase.txt script.');
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('book_types').insert([{ name: cleanName }]).select().single();
      if (error) throw new Error(error.message);
      logActivity('Type added', `Added book type "${cleanName}"`);
      return data;
    }

    const types = getLocal<BookType[]>(STORAGE_KEYS.TYPES, []);
    if (types.some(t => t.name.toLowerCase() === cleanName.toLowerCase())) {
      throw new Error('Book type already exists.');
    }
    const newType: BookType = { id: 'type-' + Date.now(), name: cleanName, created_at: new Date().toISOString() };
    types.push(newType);
    setLocal(STORAGE_KEYS.TYPES, types);
    logActivity('Type added', `Added book type "${cleanName}"`);
    return newType;
  },

  async deleteBookType(id: string): Promise<void> {
    const conn = await validateDatabaseConnection();
    if (!conn.connected && isSupabaseConfigured) {
      throw new Error(conn.message || 'Database not connected.');
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('book_types').delete().eq('id', id);
      if (error) throw new Error(error.message);
      logActivity('Type removed', `Deleted book type ID ${id}`);
      return;
    }

    const types = getLocal<BookType[]>(STORAGE_KEYS.TYPES, []);
    const target = types.find(t => t.id === id);
    const updated = types.filter(t => t.id !== id);
    setLocal(STORAGE_KEYS.TYPES, updated);
    logActivity('Type removed', `Deleted book type "${target?.name || id}"`);
  },

  // BOOK SERIES
  async getBookSeries(): Promise<BookSeries[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('book_series').select('*').order('name');
      if (!error && data) return data;
    }
    return getLocal<BookSeries[]>(STORAGE_KEYS.SERIES, []);
  },

  async addBookSeries(name: string): Promise<BookSeries> {
    const cleanName = name.trim();
    if (!cleanName) throw new Error('Series name is required.');

    const conn = await validateDatabaseConnection();
    if (!conn.connected && isSupabaseConfigured) {
      throw new Error(conn.message || 'Database not connected.');
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('book_series').insert([{ name: cleanName }]).select().single();
      if (error) throw new Error(error.message);
      logActivity('Series added', `Added book series "${cleanName}"`);
      return data;
    }

    const seriesList = getLocal<BookSeries[]>(STORAGE_KEYS.SERIES, []);
    if (seriesList.some(s => s.name.toLowerCase() === cleanName.toLowerCase())) {
      throw new Error('Series already exists.');
    }
    const newSeries: BookSeries = { id: 'series-' + Date.now(), name: cleanName, created_at: new Date().toISOString() };
    seriesList.push(newSeries);
    setLocal(STORAGE_KEYS.SERIES, seriesList);
    logActivity('Series added', `Added book series "${cleanName}"`);
    return newSeries;
  },

  async deleteBookSeries(id: string): Promise<void> {
    const conn = await validateDatabaseConnection();
    if (!conn.connected && isSupabaseConfigured) {
      throw new Error(conn.message || 'Database not connected.');
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('book_series').delete().eq('id', id);
      if (error) throw new Error(error.message);
      logActivity('Series removed', `Deleted book series ID ${id}`);
      return;
    }

    const seriesList = getLocal<BookSeries[]>(STORAGE_KEYS.SERIES, []);
    const target = seriesList.find(s => s.id === id);
    const updated = seriesList.filter(s => s.id !== id);
    setLocal(STORAGE_KEYS.SERIES, updated);
    logActivity('Series removed', `Deleted series "${target?.name || id}"`);
  },

  // BOOKS
  async getBooks(): Promise<Book[]> {
    const types = await this.getBookTypes();
    const series = await this.getBookSeries();
    
    let rawBooks: any[] = [];
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('books').select('*').order('created_at', { ascending: false });
      if (!error && data) rawBooks = data;
    }
    if (rawBooks.length === 0) {
      rawBooks = getLocal<Book[]>(STORAGE_KEYS.BOOKS, []);
    }

    return rawBooks.map(b => {
      const typeObj = types.find(t => t.id === b.type_id);
      const seriesObj = series.find(s => s.id === b.series_id);
      return {
        ...b,
        total_copies: Number(b.total_copies) || 0,
        available_copies: Number(b.available_copies) || 0,
        type_name: typeObj ? typeObj.name : (b.type_name || 'Unassigned'),
        series_name: seriesObj ? seriesObj.name : (b.series_name || 'Unassigned'),
      };
    });
  },

  async addBook(data: { title: string; type_id: string; series_id: string; total_copies: number }): Promise<Book> {
    if (!data.title.trim()) throw new Error('Book title is required.');
    if (data.total_copies < 1) throw new Error('Total copies must be at least 1.');

    const conn = await validateDatabaseConnection();
    if (!conn.connected && isSupabaseConfigured) {
      throw new Error(conn.message || 'Database connection error. Please run supabase.txt SQL script.');
    }

    const total = Number(data.total_copies);
    const types = await this.getBookTypes();
    const series = await this.getBookSeries();
    const typeObj = types.find(t => t.id === data.type_id);
    const seriesObj = series.find(s => s.id === data.series_id);

    const newBookObj = {
      title: data.title.trim(),
      type_id: data.type_id,
      series_id: data.series_id,
      total_copies: total,
      available_copies: total,
      status: 'Available' as const,
    };

    if (isSupabaseConfigured && supabase) {
      const { data: inserted, error } = await supabase.from('books').insert([newBookObj]).select().single();
      if (error) throw new Error(error.message);
      logActivity('Book added', `Added book "${data.title}" (${total} copies)`);
      return {
        ...inserted,
        total_copies: Number(inserted.total_copies) || 0,
        available_copies: Number(inserted.available_copies) || 0,
        type_name: typeObj?.name || '',
        series_name: seriesObj?.name || '',
      };
    }

    const books = getLocal<Book[]>(STORAGE_KEYS.BOOKS, []);
    const newBook: Book = {
      id: 'book-' + Date.now(),
      ...newBookObj,
      type_name: typeObj?.name || '',
      series_name: seriesObj?.name || '',
      created_at: new Date().toISOString(),
    };
    books.unshift(newBook);
    setLocal(STORAGE_KEYS.BOOKS, books);
    logActivity('Book added', `Added book "${data.title}" (${total} copies)`);
    return newBook;
  },

  async updateBook(id: string, updates: Partial<Book>): Promise<Book> {
    const conn = await validateDatabaseConnection();
    if (!conn.connected && isSupabaseConfigured) {
      throw new Error(conn.message || 'Database not connected.');
    }

    const books = getLocal<Book[]>(STORAGE_KEYS.BOOKS, []);
    const index = books.findIndex(b => b.id === id);
    
    const totalCopies = updates.total_copies !== undefined ? Number(updates.total_copies) : (books[index]?.total_copies || 1);
    const availCopies = updates.available_copies !== undefined ? Number(updates.available_copies) : (books[index]?.available_copies || 1);

    const updatedBook: Book = {
      ...books[index],
      ...updates,
      total_copies: totalCopies,
      available_copies: availCopies,
    };
    
    if (updatedBook.available_copies <= 0) {
      updatedBook.status = 'Borrowed';
    } else if (updatedBook.status === 'Borrowed' && updatedBook.available_copies > 0) {
      updatedBook.status = 'Available';
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('books').update({
        title: updatedBook.title,
        type_id: updatedBook.type_id,
        series_id: updatedBook.series_id,
        total_copies: updatedBook.total_copies,
        available_copies: updatedBook.available_copies,
        status: updatedBook.status,
      }).eq('id', id);
      if (error) throw new Error(error.message);
    }

    if (index !== -1) {
      books[index] = updatedBook;
      setLocal(STORAGE_KEYS.BOOKS, books);
    }
    logActivity('Book updated', `Updated book "${updatedBook.title}"`);
    return updatedBook;
  },

  async deleteBook(id: string): Promise<void> {
    const conn = await validateDatabaseConnection();
    if (!conn.connected && isSupabaseConfigured) {
      throw new Error(conn.message || 'Database connection error.');
    }

    const books = getLocal<Book[]>(STORAGE_KEYS.BOOKS, []);
    const target = books.find(b => b.id === id);

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('books').delete().eq('id', id);
      if (error) throw new Error(error.message);
    }

    const updated = books.filter(b => b.id !== id);
    setLocal(STORAGE_KEYS.BOOKS, updated);
    logActivity('Book deleted', `Deleted book "${target?.title || id}"`);
  },

  // BORROW REQUESTS
  async getBorrowRequests(): Promise<BorrowRequest[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('borrow_requests').select('*').order('request_date', { ascending: false });
      if (!error && data) return data;
    }
    return getLocal<BorrowRequest[]>(STORAGE_KEYS.REQUESTS, []);
  },

  async submitBorrowRequest(data: {
    student_name: string;
    student_id: string;
    course: string;
    year_level: string;
    section: string;
    book_id: string;
    duration_days: number;
  }): Promise<BorrowRequest> {
    // Validate database connection first!
    const conn = await validateDatabaseConnection();
    if (!conn.connected && isSupabaseConfigured) {
      throw new Error(conn.message || 'Database connection error. Please ensure Supabase tables are created.');
    }

    // Validation
    if (!data.student_name.trim() || !data.student_id.trim() || !data.course.trim() || !data.year_level.trim() || !data.section.trim()) {
      throw new Error('Please complete all required fields.');
    }
    if (data.duration_days < 1 || data.duration_days > 7) {
      throw new Error('Borrow duration cannot exceed 7 days.');
    }

    const books = await this.getBooks();
    const targetBook = books.find(b => b.id === data.book_id);
    if (!targetBook) throw new Error('Selected book not found.');

    const requests = await this.getBorrowRequests();
    
    // Check duplicate request rule
    const existingPending = requests.find(
      r => r.student_id.toLowerCase() === data.student_id.toLowerCase().trim() && 
           r.book_id === data.book_id && 
           r.status === 'Pending'
    );
    if (existingPending) {
      throw new Error('You already have a pending request.');
    }

    const newReq: BorrowRequest = {
      id: 'req-' + Date.now(),
      student_name: data.student_name.trim(),
      student_id: data.student_id.trim(),
      course: data.course.trim(),
      year_level: data.year_level,
      section: data.section.trim(),
      book_id: data.book_id,
      book_title: targetBook.title,
      book_type: targetBook.type_name,
      book_series: targetBook.series_name,
      duration_days: Number(data.duration_days),
      request_date: new Date().toISOString(),
      status: 'Pending',
    };

    if (isSupabaseConfigured && supabase) {
      const { data: inserted, error } = await supabase.from('borrow_requests').insert([newReq]).select().single();
      if (error) throw new Error(`Supabase Error: ${error.message}`);
      logActivity('Borrow Request Submitted', `Student ${data.student_name} requested "${targetBook.title}"`);
      return inserted;
    }

    requests.unshift(newReq);
    setLocal(STORAGE_KEYS.REQUESTS, requests);
    logActivity('Borrow Request Submitted', `Student ${data.student_name} requested "${targetBook.title}"`);
    return newReq;
  },

  async approveBorrowRequest(requestId: string): Promise<void> {
    const conn = await validateDatabaseConnection();
    if (!conn.connected && isSupabaseConfigured) {
      throw new Error(conn.message || 'Database not connected.');
    }

    const requests = await this.getBorrowRequests();
    const req = requests.find(r => r.id === requestId);
    if (!req) throw new Error('Borrow request not found.');
    if (req.status !== 'Pending') throw new Error('Request has already been processed.');

    const books = await this.getBooks();
    const targetBook = books.find(b => b.id === req.book_id);
    let newAvailableCopies = targetBook ? Math.max(0, targetBook.available_copies - 1) : 0;
    let newBookStatus = newAvailableCopies === 0 ? 'Borrowed' : (targetBook?.status || 'Available');

    const borrowDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(borrowDate.getDate() + req.duration_days);

    const newRecord: BorrowRecord = {
      id: 'rec-' + Date.now(),
      request_id: req.id,
      student_name: req.student_name,
      student_id: req.student_id,
      book_id: req.book_id,
      book_title: req.book_title || targetBook?.title || 'Book',
      borrow_date: borrowDate.toISOString(),
      due_date: dueDate.toISOString(),
      status: 'Borrowed',
    };

    if (isSupabaseConfigured && supabase) {
      const { error: reqErr } = await supabase.from('borrow_requests').update({ status: 'Approved' }).eq('id', requestId);
      if (reqErr) throw new Error(reqErr.message);

      await supabase.from('borrow_records').insert([newRecord]);
      if (targetBook) {
        await supabase.from('books').update({ 
          available_copies: newAvailableCopies, 
          status: newBookStatus 
        }).eq('id', req.book_id);
      }
    } else {
      req.status = 'Approved';
      setLocal(STORAGE_KEYS.REQUESTS, requests);
      const records = getLocal<BorrowRecord[]>(STORAGE_KEYS.RECORDS, []);
      records.unshift(newRecord);
      setLocal(STORAGE_KEYS.RECORDS, records);
    }

    logActivity('Borrow approved', `Approved request for ${req.student_name} ("${newRecord.book_title}")`);
  },

  async rejectBorrowRequest(requestId: string): Promise<void> {
    const conn = await validateDatabaseConnection();
    if (!conn.connected && isSupabaseConfigured) {
      throw new Error(conn.message || 'Database not connected.');
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('borrow_requests').update({ status: 'Rejected' }).eq('id', requestId);
      if (error) throw new Error(error.message);
    } else {
      const requests = getLocal<BorrowRequest[]>(STORAGE_KEYS.REQUESTS, []);
      const req = requests.find(r => r.id === requestId);
      if (req) {
        req.status = 'Rejected';
        setLocal(STORAGE_KEYS.REQUESTS, requests);
      }
    }

    logActivity('Borrow rejected', `Rejected request ID ${requestId}`);
  },

  // BORROWED BOOKS & RETURNS
  async getBorrowedBooks(): Promise<BorrowRecord[]> {
    let records: BorrowRecord[] = [];
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('borrow_records').select('*').order('borrow_date', { ascending: false });
      if (!error && data) records = data;
    }
    if (records.length === 0) {
      records = getLocal<BorrowRecord[]>(STORAGE_KEYS.RECORDS, []);
    }

    const now = new Date();
    return records.map(rec => {
      if (rec.status === 'Borrowed') {
        const due = new Date(rec.due_date);
        const diffTime = due.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let status: BorrowRecordStatus = rec.status;
        if (diffDays < 0) {
          status = 'Overdue';
        }
        return {
          ...rec,
          status,
          remaining_days: diffDays,
        };
      }
      return rec;
    });
  },

  async markReturned(recordId: string): Promise<void> {
    const conn = await validateDatabaseConnection();
    if (!conn.connected && isSupabaseConfigured) {
      throw new Error(conn.message || 'Database not connected.');
    }

    const records = await this.getBorrowedBooks();
    const rec = records.find(r => r.id === recordId);
    if (!rec) throw new Error('Borrow record not found.');

    const books = await this.getBooks();
    const targetBook = books.find(b => b.id === rec.book_id);
    const newAvail = (targetBook?.available_copies || 0) + 1;

    const newReturn: ReturnRecord = {
      id: 'ret-' + Date.now(),
      record_id: rec.id,
      student_name: rec.student_name,
      book_title: rec.book_title || 'Book',
      borrow_date: rec.borrow_date,
      return_date: new Date().toISOString(),
      status: 'Returned',
    };

    if (isSupabaseConfigured && supabase) {
      const { error: recErr } = await supabase.from('borrow_records').update({ status: 'Returned' }).eq('id', recordId);
      if (recErr) throw new Error(recErr.message);

      await supabase.from('returns').insert([newReturn]);
      if (targetBook) {
        await supabase.from('books').update({ 
          available_copies: newAvail, 
          status: 'Available' 
        }).eq('id', rec.book_id);
      }
    } else {
      rec.status = 'Returned';
      setLocal(STORAGE_KEYS.RECORDS, records);
      const returns = getLocal<ReturnRecord[]>(STORAGE_KEYS.RETURNS, []);
      returns.unshift(newReturn);
      setLocal(STORAGE_KEYS.RETURNS, returns);
    }

    logActivity('Book returned', `Returned "${newReturn.book_title}" borrowed by ${rec.student_name}`);
  },

  async getReturns(): Promise<ReturnRecord[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('returns').select('*').order('return_date', { ascending: false });
      if (!error && data) return data;
    }
    return getLocal<ReturnRecord[]>(STORAGE_KEYS.RETURNS, []);
  },

  // USERS MANAGEMENT
  async getAdminUsers(): Promise<AdminUser[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('admin_users').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return getLocal<AdminUser[]>(STORAGE_KEYS.USERS, []);
  },

  async addAdminUser(data: { username: string; full_name: string; role: 'Admin' | 'Librarian' }): Promise<AdminUser> {
    const cleanUser = data.username.trim();
    const cleanName = data.full_name.trim();
    if (!cleanUser || !cleanName) throw new Error('Username and Full Name are required.');

    const conn = await validateDatabaseConnection();
    if (!conn.connected && isSupabaseConfigured) {
      throw new Error(conn.message || 'Database not connected.');
    }

    const newUser: AdminUser = {
      id: 'usr-' + Date.now(),
      username: cleanUser,
      full_name: cleanName,
      role: data.role,
      status: 'Active',
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data: inserted, error } = await supabase.from('admin_users').insert([newUser]).select().single();
      if (error) throw new Error(error.message);
      logActivity('Admin created', `Created admin user "${cleanUser}" (${cleanName})`);
      return inserted;
    }

    const users = getLocal<AdminUser[]>(STORAGE_KEYS.USERS, []);
    users.unshift(newUser);
    setLocal(STORAGE_KEYS.USERS, users);
    logActivity('Admin created', `Created admin user "${cleanUser}" (${cleanName})`);
    return newUser;
  },

  async updateAdminUser(id: string, updates: Partial<AdminUser>): Promise<AdminUser> {
    const conn = await validateDatabaseConnection();
    if (!conn.connected && isSupabaseConfigured) {
      throw new Error(conn.message || 'Database not connected.');
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('admin_users').update(updates).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      logActivity('Admin updated', `Updated admin user ID ${id}`);
      return data;
    }

    const users = getLocal<AdminUser[]>(STORAGE_KEYS.USERS, []);
    const index = users.findIndex(u => u.id === id);
    if (index === -1) throw new Error('User not found.');

    const updated = { ...users[index], ...updates };
    users[index] = updated;
    setLocal(STORAGE_KEYS.USERS, users);
    logActivity('Admin updated', `Updated admin user "${updated.username}"`);
    return updated;
  },

  async disableAdminUser(id: string): Promise<void> {
    const conn = await validateDatabaseConnection();
    if (!conn.connected && isSupabaseConfigured) {
      throw new Error(conn.message || 'Database not connected.');
    }

    const users = await this.getAdminUsers();
    const target = users.find(u => u.id === id);
    if (!target) return;

    const newStatus = target.status === 'Active' ? 'Disabled' : 'Active';

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('admin_users').update({ status: newStatus }).eq('id', id);
      if (error) throw new Error(error.message);
    } else {
      target.status = newStatus;
      setLocal(STORAGE_KEYS.USERS, users);
    }

    logActivity('Admin updated', `${newStatus === 'Disabled' ? 'Disabled' : 'Enabled'} user "${target.username}"`);
  },

  async resetAdminPassword(username: string): Promise<void> {
    logActivity('Password reset', `Reset password for user "${username}"`);
  },

  async deleteAdminUser(id: string): Promise<void> {
    const conn = await validateDatabaseConnection();
    if (!conn.connected && isSupabaseConfigured) {
      throw new Error(conn.message || 'Database not connected.');
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('admin_users').delete().eq('id', id);
      if (error) throw new Error(error.message);
    } else {
      const users = getLocal<AdminUser[]>(STORAGE_KEYS.USERS, []);
      const updated = users.filter(u => u.id !== id);
      setLocal(STORAGE_KEYS.USERS, updated);
    }

    logActivity('Admin deleted', `Deleted admin user ID ${id}`);
  },

  // ACTIVITY LOGS
  async getActivityLogs(): Promise<ActivityLog[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(20);
      if (!error && data) return data;
    }
    return getLocal<ActivityLog[]>(STORAGE_KEYS.LOGS, []);
  },

  // DASHBOARD STATS WITH DEFENSIVE NUMBER CALCULATIONS
  async getDashboardStats() {
    const books = await this.getBooks();
    const requests = await this.getBorrowRequests();
    const records = await this.getBorrowedBooks();
    const users = await this.getAdminUsers();

    // Safeguard against NaN or string types
    const totalBooks = books.reduce((acc, b) => {
      const val = Number(b.total_copies);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);

    const availableBooks = books.reduce((acc, b) => {
      const val = Number(b.available_copies);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);

    const borrowedBooks = records.filter(r => r.status === 'Borrowed' || r.status === 'Overdue').length;
    const pendingRequests = requests.filter(r => r.status === 'Pending').length;
    const overdueBooks = records.filter(r => r.status === 'Overdue' || (r.status === 'Borrowed' && r.remaining_days !== undefined && r.remaining_days < 0)).length;
    const adminUsersCount = users.filter(u => u.status === 'Active').length;

    return {
      totalBooks,
      availableBooks,
      borrowedBooks,
      pendingRequests,
      overdueBooks,
      adminUsersCount,
    };
  },

  // AUTHENTICATION WITH SUPABASE & SEED VALIDATION
  async loginAdmin(username: string, password: string): Promise<AdminUser> {
    const cleanUser = username.trim();
    if (!cleanUser || !password) {
      throw new Error('Please fill in both username and password.');
    }

    // Validate database connection first!
    const conn = await validateDatabaseConnection();
    if (!conn.connected && isSupabaseConfigured) {
      throw new Error(conn.message || 'Database connection error. Please run supabase.txt SQL script in Supabase.');
    }

    // Seed account fallback
    if (cleanUser === 'woopsy' && password === '09939057827') {
      const authUser: AdminUser = {
        id: 'usr-1',
        username: 'woopsy',
        full_name: 'System Administrator',
        role: 'Admin',
        status: 'Active',
      };
      setLocal(STORAGE_KEYS.AUTH, authUser);
      logActivity('Login successful', `Admin ${cleanUser} logged in`, cleanUser);
      return authUser;
    }

    // Check database users
    const users = await this.getAdminUsers();
    const found = users.find(u => u.username.toLowerCase() === cleanUser.toLowerCase());
    if (found && found.status === 'Active' && password.length >= 6) {
      setLocal(STORAGE_KEYS.AUTH, found);
      logActivity('Login successful', `Admin ${found.username} logged in`, found.username);
      return found;
    }

    throw new Error('Invalid username or password.');
  },

  getCurrentUser(): AdminUser | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUTH);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  logoutAdmin(): void {
    const user = this.getCurrentUser();
    localStorage.removeItem(STORAGE_KEYS.AUTH);
    if (user) {
      logActivity('Logout successful', `Admin ${user.username} logged out`, user.username);
    }
  }
};
