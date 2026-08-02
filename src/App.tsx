import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

// Layouts & Guard
import { PublicLayout } from './components/layouts/PublicLayout';
import { AdminLayout } from './components/layouts/AdminLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Public Pages
import { LandingPage } from './pages/Landing/LandingPage';
import { CatalogPage } from './pages/Catalog/CatalogPage';
import { BorrowPage } from './pages/Borrow/BorrowPage';
import { RequestSuccessPage } from './pages/RequestSuccess/RequestSuccessPage';

// Admin Pages
import { LoginPage } from './pages/Login/LoginPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { BooksPage } from './pages/Books/BooksPage';
import { BorrowRequestsPage } from './pages/BorrowRequests/BorrowRequestsPage';
import { BorrowedBooksPage } from './pages/BorrowedBooks/BorrowedBooksPage';
import { ReturnsPage } from './pages/Returns/ReturnsPage';
import { UsersPage } from './pages/Users/UsersPage';
import { ConfigPage } from './pages/Config/ConfigPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30, // 30 seconds
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" richColors theme="dark" closeButton />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/borrow" element={<BorrowPage />} />
            <Route path="/request-success" element={<RequestSuccessPage />} />
          </Route>

          {/* Admin Login */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="books" element={<BooksPage />} />
              <Route path="requests" element={<BorrowRequestsPage />} />
              <Route path="borrowed" element={<BorrowedBooksPage />} />
              <Route path="returns" element={<ReturnsPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="config" element={<ConfigPage />} />
            </Route>
          </Route>

          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
