import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { dataService } from '../services/dataService';

export const ProtectedStudentRoute: React.FC = () => {
  const student = dataService.getCurrentStudent();

  if (!student) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
