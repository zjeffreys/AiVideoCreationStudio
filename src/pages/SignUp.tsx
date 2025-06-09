import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SignUp as SignUpComponent } from '../components/auth/SignUp';

export const SignUpPage = () => {
  const { user } = useAuth();
  
  // If user is already logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 shadow-lg">
        <SignUpComponent />
      </div>
    </div>
  );
};