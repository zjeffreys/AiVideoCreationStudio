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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-slate-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-lg">
        <SignUpComponent />
      </div>
    </div>
  );
};