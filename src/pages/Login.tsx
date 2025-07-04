import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Login as LoginComponent } from '../components/auth/Login';

export const LoginPage = () => {
  const { user } = useAuth();
  
  // If user is already logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
        <LoginComponent />
      </div>
    </div>
  );
};