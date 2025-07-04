import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Mail, Loader2 } from 'lucide-react';

export const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  
  const isProd = window.location.hostname === 'astonishing-lily-bc916b.netlify.app';

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      await signUp(email, password);
      setSuccess(true);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    setGoogleLoading(true);
    
    try {
      await signInWithGoogle();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const navigateToLogin = () => {
    navigate('/login');
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-md space-y-8 p-8">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="rounded-full bg-green-100 p-3">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Registration successful</h1>
          <p className="text-slate-600">
            Please check your email to confirm your account.
          </p>
        </div>
        <Button onClick={navigateToLogin}>
          Back to login
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md space-y-8 p-8">
      <div className="flex flex-col items-center space-y-2 text-center">
        <div className="rounded-full bg-gradient-to-r from-purple-100 to-orange-100 p-3">
          <Mail className="h-12 w-12 bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-transparent" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Create an account</h1>
        <p className="text-slate-600">Enter your details to get started</p>
      </div>

      {error && (
        <div className="w-full p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSignUp} className="w-full space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          required
          fullWidth
          className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          fullWidth
          className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
        />
        <Input
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          required
          fullWidth
          className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
        />
        
        <Button 
          type="submit" 
          isLoading={loading}
          loadingText="Creating account..."
          fullWidth
          className="bg-gradient-to-r from-purple-500 to-orange-400 text-white hover:from-purple-600 hover:to-orange-500"
        >
          Create account
        </Button>
      </form>

      <div className="relative w-full">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-slate-500">Or continue with</span>
        </div>
      </div>

      <div className="w-full">
        <Button 
          variant="outline" 
          onClick={handleGoogleSignUp} 
          disabled={!isProd || googleLoading}
          fullWidth
          className={`${!isProd ? 'opacity-50 cursor-not-allowed' : ''} border-slate-200 text-slate-700 hover:bg-slate-50`}
        >
          {googleLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          )}
          Sign up with Google
        </Button>
        {!isProd && (
          <p className="mt-2 text-xs text-center text-slate-400">
            Google Sign In is only available in production
          </p>
        )}
      </div>

      <p className="text-sm text-center text-slate-600">
        Already have an account?{' '}
        <button
          type="button"
          onClick={navigateToLogin}
          className="bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-transparent hover:underline font-medium"
        >
          Sign in
        </button>
      </p>
    </div>
  );
};