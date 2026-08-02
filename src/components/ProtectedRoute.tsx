import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { dataService } from '../services/dataService';

export const ProtectedRoute: React.FC = () => {
  const user = dataService.getCurrentUser();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
