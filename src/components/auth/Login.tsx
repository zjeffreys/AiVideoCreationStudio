import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Loader2, Mail } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  
  const isProd = window.location.hostname === 'astonishing-lily-bc916b.netlify.app';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);
    
    try {
      await signInWithGoogle();
      // No need to navigate, as the OAuth provider will handle redirection
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
      setGoogleLoading(false);
    }
  };

  const navigateToSignUp = () => {
    navigate('/signup');
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md space-y-8 p-8">
      <div className="flex flex-col items-center space-y-2 text-center">
        <div className="rounded-full bg-gradient-to-r from-purple-200 to-orange-200 p-3">
          <Mail className="h-12 w-12 bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-transparent" />
        </div>
        <h1 className="text-2xl font-bold text-slate-700 dark:text-white">Welcome back</h1>
        <p className="text-slate-400 dark:text-slate-300">Sign in to your account to continue</p>
      </div>

      {error && (
        <div className="w-full p-3 bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 text-sm rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="w-full space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          required
          fullWidth
          className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400"
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          fullWidth
          className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400"
        />
        
        <Button 
          type="submit" 
          isLoading={loading}
          loadingText="Signing in..."
          fullWidth
          className="bg-gradient-to-r from-purple-500 to-orange-400 text-white hover:from-purple-600 hover:to-orange-500"
        >
          Sign in
        </Button>
      </form>

      <div className="relative w-full">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-slate-900 px-2 text-slate-500 dark:text-slate-400">Or continue with</span>
        </div>
      </div>

      <div className="w-full">
        <Button 
          variant="outline" 
          onClick={handleGoogleLogin} 
          disabled={!isProd || googleLoading}
          fullWidth
          className={`${!isProd ? 'opacity-50 cursor-not-allowed' : ''} border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800`}
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
          Sign in with Google
        </Button>
        {!isProd && (
          <p className="mt-2 text-xs text-center text-slate-400">
            Google Sign In is only available in production
          </p>
        )}
      </div>

      <p className="text-sm text-center text-slate-400 dark:text-slate-300">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={navigateToSignUp}
          className="bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-transparent hover:underline font-medium"
        >
          Sign up
        </button>
      </p>
    </div>
  );
};