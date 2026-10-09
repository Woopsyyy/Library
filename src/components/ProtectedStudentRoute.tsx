import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { dataService } from '../services/dataService';

export const ProtectedStudentRoute: React.FC = () => {
  const student = dataService.getCurrentStudent();
  const location = useLocation();

  if (!student) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return <Outlet />;
};
