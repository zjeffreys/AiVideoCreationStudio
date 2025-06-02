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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-slate-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-lg">
        <LoginComponent />
      </div>
    </div>
  );
};