import {
  Book, BookType, Author, Tag, BookCopy, BorrowRequest, BorrowRecord, BorrowRecordStatus, ReturnRecord, User, AccountType, ActivityLog
} from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Local storage keys for fallback cache
const STORAGE_KEYS = {
  TYPES: 'talisay_book_types',
  AUTHORS: 'talisay_authors',
  TAGS: 'talisay_tags',
  COPIES: 'talisay_book_copies',
  BOOKS: 'talisay_books',
  REQUESTS: 'talisay_borrow_requests',
  RECORDS: 'talisay_borrow_records',
  RETURNS: 'talisay_returns',
  USERS: 'talisay_users',
  LOGS: 'talisay_activity_logs',
  // Single session for both account types; AUTH/STUDENT_AUTH are legacy keys (read-only fallback).
  SESSION: 'talisay_session',
  AUTH: 'talisay_auth_user',
  STUDENT_AUTH: 'talisay_student_auth',
  LEGACY_ADMIN_USERS: 'talisay_admin_users',
  LEGACY_STUDENTS: 'talisay_student_users',
};

// School ID format: <four digits>-<four digits>, e.g. 1234-5678 (typed manually by the student)
export function isValidSchoolId(schoolId: string): boolean {
  const clean = schoolId.trim();
  return /^\d{4}-\d{4}$/.test(clean);
}

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

// Normalize a row (Supabase or legacy local shape) into a User.
function normalizeUser(row: any, fallbackType: AccountType = 'student'): User {
  const type: AccountType = row.account_type === 'admin' ? 'admin' : fallbackType;
  return {
    id: String(row.id ?? 'usr-' + Date.now()),
    account_type: type,
    username: row.username || '',
    school_id: row.school_id || '',
    full_name: row.full_name || '',
    role: row.role || (type === 'admin' ? 'Admin' : 'Student'),
    status: row.status || 'Active',
    created_at: row.created_at,
    password: row.password,
    plain_password: row.plain_password,
  };
}

// Merged local user list: new key first, then legacy per-type keys.
function getLocalUsers(): User[] {
  try {
    const merged = localStorage.getItem(STORAGE_KEYS.USERS);
    if (merged) return (JSON.parse(merged) as any[]).map(r => normalizeUser(r));
  } catch { /* fall through to legacy keys */ }
  try {
    const admins = JSON.parse(localStorage.getItem(STORAGE_KEYS.LEGACY_ADMIN_USERS) || '[]');
    const students = JSON.parse(localStorage.getItem(STORAGE_KEYS.LEGACY_STUDENTS) || '[]');
    return [
      ...(admins as any[]).map(r => normalizeUser(r, 'admin')),
      ...(students as any[]).map(r => normalizeUser(r, 'student')),
    ];
  } catch {
    return [];
  }
}

// Current session: new single key, then legacy per-type sessions.
function readSession(): User | null {
  for (const key of [STORAGE_KEYS.SESSION, STORAGE_KEYS.AUTH, STORAGE_KEYS.STUDENT_AUTH]) {
    try {
      const data = localStorage.getItem(key);
      if (!data) continue;
      const row = JSON.parse(data);
      const fallback: AccountType = key === STORAGE_KEYS.AUTH ? 'admin' : 'student';
      return normalizeUser(row, fallback);
    } catch { /* try next key */ }
  }
  return null;
}

function clearSessions(): void {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
  localStorage.removeItem(STORAGE_KEYS.AUTH);
  localStorage.removeItem(STORAGE_KEYS.STUDENT_AUTH);
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
    const logForDb = {
      action,
      details,
      user_name: userName,
      created_at: new Date().toISOString(),
    };
    supabase.from('activity_logs').insert([logForDb]).then(({ error }) => {
      if (error) console.warn('Supabase activity log error:', error.message);
    });
  }
}

// Hash a password with SHA-256 (Web Crypto). Falls back to plaintext on insecure contexts.
async function hashPassword(password: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const data = new TextEncoder().encode(password);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  return password;
}

// Generate a random temporary password (no ambiguous chars like 0/O, 1/l/I).
function generateTemporaryPassword(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const values = new Uint32Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(values);
  } else {
    for (let i = 0; i < length; i++) values[i] = Math.floor(Math.random() * 0xffffffff);
  }
  return Array.from(values, v => chars[v % chars.length]).join('');
}

// Generate a unique, formatted inquiry number for a borrow request.
function generateInquiryNumber(): string {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `TLB-${yyyy}${mm}${dd}-${hh}${min}${ss}`;
}

const BOOK_COVER_BUCKET = 'book-covers';
const MAX_COVER_SIZE = 5 * 1024 * 1024;

// Upload a book cover to Supabase Storage and return its public URL.
async function uploadBookCover(file: File): Promise<string> {
  if (!supabase) throw new Error('Supabase storage is not configured.');
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file (PNG, JPG, WebP).');
  if (file.size > MAX_COVER_SIZE) throw new Error('Image must be 5MB or smaller.');

  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_') || 'cover';
  const path = `${Date.now()}-${cleanName}`;
  const { error } = await supabase.storage.from(BOOK_COVER_BUCKET).upload(path, file, {
    contentType: file.type || 'application/octet-stream',
    upsert: true,
  });
  if (error) throw new Error(`Image upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BOOK_COVER_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// Read an image file as a data URL (local-storage fallback).
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// Resolve a cover file to a stored URL (Supabase upload or local data URL).
async function resolveCoverUrl(file: File): Promise<string> {
  if (isSupabaseConfigured && supabase) {
    return await uploadBookCover(file);
  }
  return await fileToDataUrl(file);
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

  // AUTHORS
  async getAuthors(): Promise<Author[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('authors').select('*').order('name');
      if (!error && data) return data;
    }
    return getLocal<Author[]>(STORAGE_KEYS.AUTHORS, []);
  },

  async addAuthor(name: string): Promise<Author> {
    const cleanName = name.trim();
    if (!cleanName) throw new Error('Author name is required.');

    const conn = await validateDatabaseConnection();
    if (!conn.connected && isSupabaseConfigured) {
      throw new Error(conn.message || 'Database not connected.');
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('authors').insert([{ name: cleanName }]).select().single();
      if (error) {
        if (/duplicate|already exists/i.test(error.message)) throw new Error('Author already exists.');
        throw new Error(error.message);
      }
      logActivity('Author added', `Added author "${cleanName}"`);
      return data;
    }

    const authors = getLocal<Author[]>(STORAGE_KEYS.AUTHORS, []);
    if (authors.some(a => a.name.toLowerCase() === cleanName.toLowerCase())) {
      throw new Error('Author already exists.');
    }
    const newAuthor: Author = { id: 'author-' + Date.now(), name: cleanName, created_at: new Date().toISOString() };
    authors.push(newAuthor);
    setLocal(STORAGE_KEYS.AUTHORS, authors);
    logActivity('Author added', `Added author "${cleanName}"`);
    return newAuthor;
  },

  async deleteAuthor(id: string): Promise<void> {
    const conn = await validateDatabaseConnection();
    if (!conn.connected && isSupabaseConfigured) {
      throw new Error(conn.message || 'Database not connected.');
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('authors').delete().eq('id', id);
      if (error) throw new Error(error.message);
      logActivity('Author removed', `Deleted author ID ${id}`);
      return;
    }

    const authors = getLocal<Author[]>(STORAGE_KEYS.AUTHORS, []);
    const target = authors.find(a => a.id === id);
    setLocal(STORAGE_KEYS.AUTHORS, authors.filter(a => a.id !== id));
    logActivity('Author removed', `Deleted author "${target?.name || id}"`);
  },

  // TAGS
  async getTags(): Promise<Tag[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('tags').select('*').order('name');
      if (!error && data) return data;
    }
    return getLocal<Tag[]>(STORAGE_KEYS.TAGS, []);
  },

  async addTag(name: string): Promise<Tag> {
    const cleanName = name.trim();
    if (!cleanName) throw new Error('Tag name is required.');

    const conn = await validateDatabaseConnection();
    if (!conn.connected && isSupabaseConfigured) {
      throw new Error(conn.message || 'Database not connected.');
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('tags').insert([{ name: cleanName }]).select().single();
      if (error) {
        if (/duplicate|already exists/i.test(error.message)) throw new Error('Tag already exists.');
        throw new Error(error.message);
      }
      logActivity('Tag added', `Added tag "${cleanName}"`);
      return data;
    }

    const tags = getLocal<Tag[]>(STORAGE_KEYS.TAGS, []);
    if (tags.some(t => t.name.toLowerCase() === cleanName.toLowerCase())) {
      throw new Error('Tag already exists.');
    }
    const newTag: Tag = { id: 'tag-' + Date.now(), name: cleanName, created_at: new Date().toISOString() };
    tags.push(newTag);
    setLocal(STORAGE_KEYS.TAGS, tags);
    logActivity('Tag added', `Added tag "${cleanName}"`);
    return newTag;
  },

  async deleteTag(id: string): Promise<void> {
    const conn = await validateDatabaseConnection();
    if (!conn.connected && isSupabaseConfigured) {
      throw new Error(conn.message || 'Database not connected.');
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('tags').delete().eq('id', id);
      if (error) throw new Error(error.message);
      logActivity('Tag removed', `Deleted tag ID ${id}`);
      return;
    }

    const tags = getLocal<Tag[]>(STORAGE_KEYS.TAGS, []);
    const target = tags.find(t => t.id === id);
    setLocal(STORAGE_KEYS.TAGS, tags.filter(t => t.id !== id));
    logActivity('Tag removed', `Deleted tag "${target?.name || id}"`);
  },

  // Ensure free-typed author/tags exist in the lookup tables (best effort).
  async ensureAuthor(name: string): Promise<string> {
    const clean = name.trim();
    if (!clean) return '';
    const authors = await this.getAuthors();
    if (authors.some(a => a.name.toLowerCase() === clean.toLowerCase())) return clean;
    try {
      const created = await this.addAuthor(clean);
      return created.name;
    } catch {
      return clean;
    }
  },

  async ensureTags(names: string[]): Promise<string[]> {
    // Tags must already exist in the database (managed in Config) —
    // unknown entries are dropped, never auto-created.
    const cleaned = [...new Set(names.map(n => n.trim()).filter(Boolean))];
    if (cleaned.length === 0) return [];
    const tags = await this.getTags();
    const known = new Set(tags.map(t => t.name.toLowerCase()));
    return cleaned.filter(n => known.has(n.toLowerCase()));
  },

  // ---- Per-copy serial numbers (TLB-<book>-001, ...) ----
  makeSerial(bookId: string, n: number, existingSerials?: Set<string>): string {
    let key = '';
    if (bookId.startsWith('book-')) {
      const digits = bookId.replace(/\D/g, '');
      const tail = digits.length >= 6 ? digits.slice(-6) : digits.padStart(6, '0');
      key = `BK${tail}`.padEnd(8, '0');
    } else {
      key = bookId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase().padEnd(8, 'X');
    }
    let candidate = `TLB-${key}-${String(n).padStart(3, '0')}`;
    if (existingSerials && existingSerials.has(candidate)) {
      let bump = n + 1;
      while (existingSerials.has(`TLB-${key}-${String(bump).padStart(3, '0')}`)) {
        bump++;
      }
      candidate = `TLB-${key}-${String(bump).padStart(3, '0')}`;
    }
    return candidate;
  },

  nextCopyNumber(copies: BookCopy[]): number {
    let max = 0;
    for (const c of copies) {
      const m = /-(\d+)$/.exec(c.serial_number || '');
      if (m) max = Math.max(max, Number(m[1]));
    }
    return max + 1;
  },

  async getRawBookCopies(bookId: string): Promise<BookCopy[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('book_copies')
        .select('*')
        .eq('book_id', bookId)
        .order('serial_number');
      if (!error && data) return data;
    }
    return getLocal<BookCopy[]>(STORAGE_KEYS.COPIES, []).filter(c => c.book_id === bookId);
  },

  async getBookCopies(bookId: string): Promise<BookCopy[]> {
    const raw = await this.getRawBookCopies(bookId);
    if (raw.length > 0) return raw;

    // Auto-heal: If book exists and has total_copies > 0, generate copies automatically
    try {
      const books = await this.getBooks();
      const book = books.find(b => b.id === bookId);
      if (book && (book.total_copies || 0) > 0) {
        await this.reconcileCopies(bookId, book.total_copies);
        return await this.getRawBookCopies(bookId);
      }
    } catch {
      // Fall through if lookup fails
    }
    return raw;
  },

  async setCopyStatus(copyId: string, status: 'Available' | 'Borrowed'): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('book_copies').update({ status }).eq('id', copyId);
      if (error) throw new Error(error.message);
    } else {
      const all = getLocal<BookCopy[]>(STORAGE_KEYS.COPIES, []).map(c =>
        c.id === copyId ? { ...c, status } : c
      );
      setLocal(STORAGE_KEYS.COPIES, all);
    }
  },

  // Grow/shrink the copy list to match `total`. Never removes borrowed copies —
  // throws when total is set below the borrowed count.
  async reconcileCopies(bookId: string, total: number): Promise<{ total: number; available: number }> {
    const copies = await this.getRawBookCopies(bookId);
    const borrowed = copies.filter(c => c.status === 'Borrowed').length;
    if (total < borrowed) {
      throw new Error(`Cannot set total below ${borrowed} (copies are currently borrowed).`);
    }
    let next = this.nextCopyNumber(copies);

    if (copies.length < total) {
      const allLocal = getLocal<BookCopy[]>(STORAGE_KEYS.COPIES, []);
      const existingSerials = new Set(allLocal.map(c => c.serial_number));

      const toAdd: Partial<BookCopy>[] = [];
      for (let i = copies.length; i < total; i++, next++) {
        const serial = this.makeSerial(bookId, next, existingSerials);
        existingSerials.add(serial);
        toAdd.push({ book_id: bookId, serial_number: serial, status: 'Available' });
      }
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from('book_copies').insert(toAdd);
        if (error) throw new Error(error.message);
      } else {
        const all = getLocal<BookCopy[]>(STORAGE_KEYS.COPIES, []);
        toAdd.forEach((c, i) => all.push({ id: `copy-${Date.now()}-${i}`, created_at: new Date().toISOString(), ...c } as BookCopy));
        setLocal(STORAGE_KEYS.COPIES, all);
      }
    } else if (copies.length > total) {
      const removeCount = copies.length - total;
      const removable = copies.filter(c => c.status === 'Available').slice(0, removeCount);
      if (removable.length < removeCount) {
        throw new Error(`Cannot remove copies — only ${removable.length} are available (rest are borrowed).`);
      }
      const ids = new Set(removable.map(c => c.id));
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from('book_copies').delete().in('id', [...ids]);
        if (error) throw new Error(error.message);
      } else {
        setLocal(STORAGE_KEYS.COPIES, getLocal<BookCopy[]>(STORAGE_KEYS.COPIES, []).filter(c => !ids.has(c.id)));
      }
    }

    const fresh = await this.getRawBookCopies(bookId);
    return { total: fresh.length, available: fresh.filter(c => c.status === 'Available').length };
  },

  // Quickly add 1 more copy with an auto-generated serial number
  async addBookCopy(bookId: string): Promise<BookCopy> {
    const books = await this.getBooks();
    const book = books.find(b => b.id === bookId);
    if (!book) throw new Error('Book not found.');
    const updatedTotal = (book.total_copies || 0) + 1;
    await this.updateBook(bookId, { total_copies: updatedTotal });
    const copies = await this.getBookCopies(bookId);
    const newest = copies[copies.length - 1];
    logActivity('Book copy added', `Added copy to "${book.title}" (Serial: ${newest?.serial_number || 'Auto-generated'})`);
    return newest;
  },

  // BOOKS
  async getBooks(): Promise<Book[]> {
    const types = await this.getBookTypes();

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
      return {
        ...b,
        total_copies: Number(b.total_copies) || 0,
        available_copies: Number(b.available_copies) || 0,
        type_name: typeObj ? typeObj.name : (b.type_name || 'Unassigned'),
        author: b.author || '',
        published_date: b.published_date || null,
        tags: Array.isArray(b.tags) ? b.tags : [],
      };
    });
  },

  async addBook(data: { title: string; type_id: string; total_copies: number; author?: string; published_date?: string | null; tags?: string[]; cover_file?: File | null }): Promise<Book> {
    if (!data.title.trim()) throw new Error('Book title is required.');
    if (data.total_copies < 1) throw new Error('Total copies must be at least 1.');

    const conn = await validateDatabaseConnection();
    if (!conn.connected && isSupabaseConfigured) {
      throw new Error(conn.message || 'Database connection error. Please run supabase.txt SQL script.');
    }

    const total = Number(data.total_copies);
    const types = await this.getBookTypes();
    const typeObj = types.find(t => t.id === data.type_id);
    if (!typeObj) throw new Error('Please select a book type.');
    const author = await this.ensureAuthor(data.author || '');
    const tags = await this.ensureTags(data.tags || []);
    const published = (data.published_date || '').trim() || null;

    const cover_url = data.cover_file ? await resolveCoverUrl(data.cover_file) : undefined;

    const newBookObj = {
      title: data.title.trim(),
      type_id: data.type_id,
      total_copies: total,
      available_copies: total,
      status: 'Available' as const,
      author,
      published_date: published,
      tags,
      ...(cover_url ? { cover_url } : {}),
    };

    if (isSupabaseConfigured && supabase) {
      const { data: inserted, error } = await supabase.from('books').insert([newBookObj]).select().single();
      if (error) throw new Error(error.message);
      const counts = await this.reconcileCopies(inserted.id, total);
      await supabase.from('books').update({ total_copies: counts.total, available_copies: counts.available }).eq('id', inserted.id);
      logActivity('Book added', `Added book "${data.title}" (${total} copies)`);
      return {
        ...inserted,
        total_copies: counts.total,
        available_copies: counts.available,
        type_name: typeObj?.name || '',
        author: inserted.author || '',
        published_date: inserted.published_date || null,
        tags: Array.isArray(inserted.tags) ? inserted.tags : [],
      };
    }

    const books = getLocal<Book[]>(STORAGE_KEYS.BOOKS, []);
    const newBook: Book = {
      id: 'book-' + Date.now(),
      ...newBookObj,
      type_name: typeObj?.name || '',
      created_at: new Date().toISOString(),
    };
    books.unshift(newBook);
    setLocal(STORAGE_KEYS.BOOKS, books);
    const counts = await this.reconcileCopies(newBook.id, total);
    newBook.total_copies = counts.total;
    newBook.available_copies = counts.available;
    setLocal(STORAGE_KEYS.BOOKS, books);
    logActivity('Book added', `Added book "${data.title}" (${total} copies)`);
    return newBook;
  },

  async updateBook(id: string, updates: Partial<Book> & { cover_file?: File | null }): Promise<Book> {
    const conn = await validateDatabaseConnection();
    if (!conn.connected && isSupabaseConfigured) {
      throw new Error(conn.message || 'Database not connected.');
    }

    const books = getLocal<Book[]>(STORAGE_KEYS.BOOKS, []);
    const index = books.findIndex(b => b.id === id);

    // Copy serials are the source of truth for counts.
    const existingCopies = await this.getBookCopies(id);
    const targetTotal = updates.total_copies !== undefined
      ? Number(updates.total_copies)
      : (existingCopies.length || books[index]?.total_copies || 1);
    if (targetTotal < 1) throw new Error('Total copies must be at least 1.');
    const counts = await this.reconcileCopies(id, targetTotal);
    const totalCopies = counts.total;
    const availCopies = counts.available;

    const bookUpdates: Partial<Book> = { ...updates };
    delete (bookUpdates as Partial<Book> & { cover_file?: File | null }).cover_file;
    if (updates.cover_file) {
      bookUpdates.cover_url = await resolveCoverUrl(updates.cover_file);
    }
    // Keep lookup tables complete when new author/tags are typed in.
    if (updates.author !== undefined) {
      bookUpdates.author = await this.ensureAuthor(updates.author);
    }
    if (updates.tags !== undefined) {
      bookUpdates.tags = await this.ensureTags(updates.tags);
    }
    if (updates.published_date !== undefined) {
      bookUpdates.published_date = (updates.published_date || '').trim() || null;
    }

    const updatedBook: Book = {
      ...books[index],
      ...bookUpdates,
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
        total_copies: updatedBook.total_copies,
        available_copies: updatedBook.available_copies,
        status: updatedBook.status,
        author: updatedBook.author || '',
        published_date: (updatedBook.published_date || '').trim() || null,
        tags: Array.isArray(updatedBook.tags) ? updatedBook.tags : [],
        ...(updatedBook.cover_url ? { cover_url: updatedBook.cover_url } : {}),
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

  async getBorrowRequestByInquiryNumber(inquiryNumber: string): Promise<BorrowRequest> {
    const clean = inquiryNumber.trim().toUpperCase();
    if (!clean) throw new Error('Please enter your inquiry number.');

    let requests: BorrowRequest[] = [];
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('borrow_requests')
        .select('*')
        .ilike('inquiry_number', clean);
      if (!error && data && data.length > 0) requests = data;
    }
    if (requests.length === 0) {
      requests = getLocal<BorrowRequest[]>(STORAGE_KEYS.REQUESTS, []);
    }

    const found = requests.find(r => r.inquiry_number?.toUpperCase() === clean);
    if (!found) throw new Error('No request found with that inquiry number.');

    const books = await this.getBooks();
    const book = books.find(b => b.id === found.book_id);
    return {
      ...found,
      book_title: found.book_title || book?.title || 'Book',
      book_type: found.book_type || book?.type_name,
      book_series: found.book_series || book?.series_name,
    };
  },

  async submitBorrowRequest(data: {
    student_name: string;
    student_id: string;
    course: string;
    year_level: string;
    section: string;
    book_id: string;
    serial_number?: string;
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
    if (data.duration_days < 1 || data.duration_days > 3) {
      throw new Error('Borrow duration cannot exceed 3 days.');
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
      inquiry_number: generateInquiryNumber(),
      student_name: data.student_name.trim(),
      student_id: data.student_id.trim(),
      course: data.course.trim(),
      year_level: data.year_level,
      section: data.section.trim(),
      book_id: data.book_id,
      book_title: targetBook.title,
      book_type: targetBook.type_name,
      book_series: targetBook.series_name,
      serial_number: data.serial_number?.trim() || undefined,
      duration_days: Number(data.duration_days),
      request_date: new Date().toISOString(),
      status: 'Pending',
    };

    if (isSupabaseConfigured && supabase) {
      const reqForDb = {
        inquiry_number: newReq.inquiry_number,
        student_name: newReq.student_name,
        student_id: newReq.student_id,
        course: newReq.course,
        year_level: newReq.year_level,
        section: newReq.section,
        book_id: newReq.book_id,
        serial_number: newReq.serial_number,
        duration_days: newReq.duration_days,
        request_date: newReq.request_date,
        status: newReq.status,
      };
      const { data: inserted, error } = await supabase.from('borrow_requests').insert([reqForDb]).select().single();
      if (error) throw new Error(`Supabase Error: ${error.message}`);
      logActivity('Borrow Request Submitted', `Student ${data.student_name} requested "${targetBook.title}" (Serial: ${newReq.serial_number || 'Auto-assign'})`);
      return inserted;
    }

    requests.unshift(newReq);
    setLocal(STORAGE_KEYS.REQUESTS, requests);
    logActivity('Borrow Request Submitted', `Student ${data.student_name} requested "${targetBook.title}" (Serial: ${newReq.serial_number || 'Auto-assign'})`);
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

    // Assign specific physical copy by serial number if requested, or first available copy
    const allCopies = await this.getBookCopies(req.book_id);
    let assigned = req.serial_number
      ? allCopies.find(c => c.serial_number === req.serial_number && c.status === 'Available')
      : undefined;

    if (!assigned) {
      const availableCopies = allCopies
        .filter(c => c.status === 'Available')
        .sort((a, b) => a.serial_number.localeCompare(b.serial_number));
      if (availableCopies.length === 0) {
        throw new Error('No available copies — every serial of this book is currently lent out.');
      }
      assigned = availableCopies[0];
    }
    const availableLeft = allCopies.filter(c => c.status === 'Available' && c.id !== assigned!.id).length;
    const newAvailableCopies = availableLeft;
    const newBookStatus = newAvailableCopies === 0 ? 'Borrowed' : (targetBook?.status || 'Available');

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
      serial_number: assigned.serial_number,
      borrow_date: borrowDate.toISOString(),
      due_date: dueDate.toISOString(),
      status: 'Borrowed',
    };

    if (isSupabaseConfigured && supabase) {
      await this.setCopyStatus(assigned.id, 'Borrowed');
      const { error: reqErr } = await supabase.from('borrow_requests').update({ status: 'Approved' }).eq('id', requestId);
      if (reqErr) throw new Error(reqErr.message);

      const { error: recErr } = await supabase.from('borrow_records').insert([{
        request_id: newRecord.request_id,
        student_name: newRecord.student_name,
        student_id: newRecord.student_id,
        book_id: newRecord.book_id,
        serial_number: newRecord.serial_number,
        borrow_date: newRecord.borrow_date,
        due_date: newRecord.due_date,
        status: newRecord.status,
      }]);
      if (recErr) throw new Error(recErr.message);

      if (targetBook) {
        await supabase.from('books').update({
          available_copies: newAvailableCopies,
          status: newBookStatus
        }).eq('id', req.book_id);
      }
    } else {
      await this.setCopyStatus(assigned.id, 'Borrowed');
      req.status = 'Approved';
      setLocal(STORAGE_KEYS.REQUESTS, requests);
      const records = getLocal<BorrowRecord[]>(STORAGE_KEYS.RECORDS, []);
      records.unshift(newRecord);
      setLocal(STORAGE_KEYS.RECORDS, records);
    }

    logActivity('Borrow approved', `Approved request for ${req.student_name} ("${newRecord.book_title}", serial ${assigned.serial_number})`);
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

    // Free the exact physical copy that was lent out.
    if (rec.serial_number) {
      const copy = (await this.getBookCopies(rec.book_id)).find(c => c.serial_number === rec.serial_number);
      if (copy) await this.setCopyStatus(copy.id, 'Available');
    }
    const freshCopies = await this.getBookCopies(rec.book_id);
    const newAvail = freshCopies.filter(c => c.status === 'Available').length;

    const newReturn: ReturnRecord = {
      id: 'ret-' + Date.now(),
      record_id: rec.id,
      student_name: rec.student_name,
      book_title: rec.book_title || 'Book',
      serial_number: rec.serial_number || '',
      borrow_date: rec.borrow_date,
      return_date: new Date().toISOString(),
      status: 'Returned',
    };

    if (isSupabaseConfigured && supabase) {
      const { error: recErr } = await supabase.from('borrow_records').update({ status: 'Returned' }).eq('id', recordId);
      if (recErr) throw new Error(recErr.message);

      const { error: retErr } = await supabase.from('returns').insert([{
        record_id: newReturn.record_id,
        student_name: newReturn.student_name,
        book_title: newReturn.book_title,
        serial_number: newReturn.serial_number,
        borrow_date: newReturn.borrow_date,
        return_date: newReturn.return_date,
        status: newReturn.status,
      }]);
      if (retErr) throw new Error(retErr.message);

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

  // USERS MANAGEMENT (single "users" table for admins + students)
  async getUsers(): Promise<User[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      if (!error && data) return (data as any[]).map(r => normalizeUser(r));
    }
    return getLocalUsers();
  },

  async getAdminUsers(): Promise<User[]> {
    return (await this.getUsers()).filter(u => u.account_type === 'admin');
  },

  async getStudentUsers(): Promise<User[]> {
    return (await this.getUsers()).filter(u => u.account_type === 'student');
  },

  async addAdminUser(data: { username: string; full_name: string; role: 'Admin' | 'Librarian'; password: string }): Promise<User> {
    const cleanUser = data.username.trim();
    const cleanName = data.full_name.trim();
    if (!cleanUser || !cleanName) throw new Error('Username and Full Name are required.');
    if (!data.password || data.password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    const conn = await validateDatabaseConnection();
    if (!conn.connected && isSupabaseConfigured) {
      throw new Error(conn.message || 'Database not connected.');
    }

    const newUser: User = {
      id: 'usr-' + Date.now(),
      account_type: 'admin',
      username: cleanUser,
      school_id: '',
      full_name: cleanName,
      role: data.role,
      status: 'Active',
      created_at: new Date().toISOString(),
      password: await hashPassword(data.password),
      plain_password: data.password,
    };

    if (isSupabaseConfigured && supabase) {
      const { data: inserted, error } = await supabase.from('users').insert([{
        account_type: newUser.account_type,
        username: newUser.username,
        school_id: newUser.school_id,
        full_name: newUser.full_name,
        role: newUser.role,
        status: newUser.status,
        created_at: newUser.created_at,
        password: newUser.password,
        plain_password: newUser.plain_password,
      }]).select().single();
      if (error) {
        if (/duplicate|already exists/i.test(error.message)) throw new Error('This username is already taken.');
        throw new Error(error.message);
      }
      logActivity('Admin created', `Created admin user "${cleanUser}" (${cleanName})`);
      return inserted;
    }

    const users = getLocalUsers();
    if (users.some(u => u.username && u.username.toLowerCase() === cleanUser.toLowerCase())) {
      throw new Error('This username is already taken.');
    }
    users.unshift(newUser);
    setLocal(STORAGE_KEYS.USERS, users);
    logActivity('Admin created', `Created admin user "${cleanUser}" (${cleanName})`);
    return newUser;
  },

  async updateAdminUser(id: string, updates: Partial<User>): Promise<User> {
    const conn = await validateDatabaseConnection();
    if (!conn.connected && isSupabaseConfigured) {
      throw new Error(conn.message || 'Database not connected.');
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('users').update(updates).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      logActivity('Admin updated', `Updated admin user ID ${id}`);
      return data;
    }

    const users = getLocalUsers();
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
      const { error } = await supabase.from('users').update({ status: newStatus }).eq('id', id);
      if (error) throw new Error(error.message);
    } else {
      const all = getLocalUsers().map(u => u.id === id ? { ...u, status: newStatus } : u);
      setLocal(STORAGE_KEYS.USERS, all);
    }

    logActivity('Admin updated', `${newStatus === 'Disabled' ? 'Disabled' : 'Enabled'} user "${target.username}"`);
  },

  async resetAdminPassword(username: string): Promise<string> {
    const cleanUser = username.trim();
    if (!cleanUser) throw new Error('Username is required.');

    const newPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(newPassword);

    if (isSupabaseConfigured && supabase) {
      const conn = await validateDatabaseConnection();
      if (!conn.connected) {
        throw new Error(conn.message || 'Database not connected.');
      }
      const { error } = await supabase
        .from('users')
        .update({ password: passwordHash, plain_password: newPassword })
        .eq('username', cleanUser);
      if (error) throw new Error(error.message);
    } else {
      const users = getLocalUsers();
      const index = users.findIndex(u => u.username.toLowerCase() === cleanUser.toLowerCase());
      if (index !== -1) {
        users[index] = { ...users[index], password: passwordHash, plain_password: newPassword };
        setLocal(STORAGE_KEYS.USERS, users);
      }
    }

    logActivity('Password reset', `Reset password for user "${cleanUser}"`);
    return newPassword;
  },

  async deleteAdminUser(id: string): Promise<void> {
    const conn = await validateDatabaseConnection();
    if (!conn.connected && isSupabaseConfigured) {
      throw new Error(conn.message || 'Database not connected.');
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw new Error(error.message);
    } else {
      const users = getLocalUsers();
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

  // UNIFIED LOGIN — one identifier (username or School ID), routed by role.
  async loginUser(identifier: string, password: string): Promise<User> {
    const clean = identifier.trim();
    if (!clean || !password) {
      throw new Error('Please enter your username or School ID and password.');
    }

    const conn = await validateDatabaseConnection();
    if (!conn.connected && isSupabaseConfigured) {
      throw new Error(conn.message || 'Database connection error. Please run supabase.txt SQL script in Supabase.');
    }

    const users = await this.getUsers();
    const lowered = clean.toLowerCase();
    const found = users.find(u =>
      (u.username && u.username.toLowerCase() === lowered) ||
      (u.school_id && u.school_id.toLowerCase() === lowered)
    );
    if (!found) throw new Error('Invalid username / School ID or password.');
    if (found.status !== 'Active') throw new Error('This account has been disabled. Please contact the library.');

    const inputHash = await hashPassword(password);
    const ok = (found.password && found.password === inputHash) ||
      (!found.password && found.plain_password === password); // legacy plain-text rows
    if (!ok) throw new Error('Invalid username / School ID or password.');

    setLocal(STORAGE_KEYS.SESSION, found);
    if (found.account_type === 'admin') {
      logActivity('Login successful', `Admin ${found.username} logged in`, found.username);
    } else {
      logActivity('Student login', `Student ${found.full_name} (${found.school_id}) signed in`, found.full_name);
    }
    return found;
  },

  // AUTHENTICATION WITH SUPABASE & SEED VALIDATION
  async loginAdmin(username: string, password: string): Promise<User> {
    const user = await this.loginUser(username, password);
    if (user.account_type !== 'admin') throw new Error('Invalid username or password.');
    return user;
  },

  getCurrentUser(): User | null {
    const session = readSession();
    return session && session.account_type === 'admin' ? session : null;
  },

  logoutAdmin(): void {
    const user = this.getCurrentUser();
    clearSessions();
    if (user) {
      logActivity('Logout successful', `Admin ${user.username} logged out`, user.username);
    }
  },

  // STUDENT ACCOUNTS (school_id + password)

  async signupStudent(data: { school_id: string; username: string; full_name: string; password: string; course: string; year_level: string; section: string }): Promise<User> {
    const schoolId = data.school_id.trim();
    const username = data.username.trim();
    const fullName = data.full_name.trim();
    if (!fullName) throw new Error('Full name is required.');
    if (!isValidSchoolId(schoolId)) {
      throw new Error('School ID must look like 1234-5678.');
    }
    if (!username || username.length < 3) {
      throw new Error('Username must be at least 3 characters.');
    }
    if (/\s/.test(username)) {
      throw new Error('Username cannot contain spaces.');
    }
    if (!data.password || data.password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    const newStudent: User = {
      id: 'stu-' + Date.now(),
      account_type: 'student',
      username,
      school_id: schoolId,
      full_name: fullName,
      role: 'Student',
      status: 'Active',
      course: data.course.trim(),
      year_level: data.year_level,
      section: data.section.trim(),
      created_at: new Date().toISOString(),
      password: await hashPassword(data.password),
      plain_password: data.password,
    };

    if (isSupabaseConfigured && supabase) {
      const { data: inserted, error } = await supabase.from('users').insert([{
        account_type: newStudent.account_type,
        username: newStudent.username,
        school_id: newStudent.school_id,
        full_name: newStudent.full_name,
        role: newStudent.role,
        status: newStudent.status,
        course: newStudent.course,
        year_level: newStudent.year_level,
        section: newStudent.section,
        created_at: newStudent.created_at,
        password: newStudent.password,
        plain_password: newStudent.plain_password,
      }]).select().single();
      if (!error && inserted) {
        const session = normalizeUser(inserted);
        setLocal(STORAGE_KEYS.SESSION, session);
        logActivity('Student signup', `Student ${fullName} (${schoolId}) created an account`, fullName);
        return session;
      }
      const msg = error?.message || '';
      if (/duplicate|already exists/i.test(msg)) {
        throw new Error('This School ID or username is already registered. Please sign in.');
      }
      // Table missing (fresh Supabase project without migration) -> fall back to local.
      const missingTable = /users/i.test(msg) && /schema cache|Could not find the table|does not exist/i.test(msg);
      if (!missingTable) throw new Error(error?.message || 'Failed to create account.');
    }

    const students = getLocalUsers();
    if (students.some(s => s.school_id.toLowerCase() === schoolId.toLowerCase())) {
      throw new Error('This School ID is already registered. Please sign in.');
    }
    if (students.some(s => s.username && s.username.toLowerCase() === username.toLowerCase())) {
      throw new Error('This username is already taken.');
    }
    students.unshift(newStudent);
    setLocal(STORAGE_KEYS.USERS, students);
    setLocal(STORAGE_KEYS.SESSION, newStudent);
    logActivity('Student signup', `Student ${fullName} (${schoolId}) created an account`, fullName);
    return newStudent;
  },

  async loginStudent(schoolId: string, password: string): Promise<User> {
    const user = await this.loginUser(schoolId, password);
    if (user.account_type !== 'student') throw new Error('Invalid School ID or password.');
    return user;
  },

  getCurrentStudent(): User | null {
    const session = readSession();
    return session && session.account_type === 'student' ? session : null;
  },

  logoutStudent(): void {
    const student = this.getCurrentStudent();
    clearSessions();
    if (student) {
      logActivity('Student logout', `Student ${student.full_name} (${student.school_id}) signed out`, student.full_name);
    }
  },
};
