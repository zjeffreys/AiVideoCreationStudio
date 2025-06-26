import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const fetchUserProfile = async (userId: string) => {
    console.log('🔍 Fetching user profile for:', userId);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        // If profile doesn't exist, create one
        if (error.code === 'PGRST116') {
          console.log('📝 Creating new user profile for:', userId);
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert({
              user_id: userId,
              membership_type: 'free',
              video_generation_count: 0,
              video_generation_limit: 3
            })
            .select()
            .single();
          
          if (createError) throw createError;
          console.log('✅ Created user profile:', newProfile);
          setUserProfile(newProfile);
        } else {
          throw error;
        }
      } else {
        console.log('✅ Found existing user profile:', data);
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserProfile(null);
    }
  };

  const refreshUserProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  useEffect(() => {
    console.log('🚀 AuthProvider initializing...');
    const getSession = async () => {
      console.log('🔄 Getting initial session...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('📋 Initial session:', session ? 'Found' : 'None');
      console.log('👤 Initial user:', session?.user ? session.user.email : 'None');
      
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        console.log('🔍 Fetching profile for initial user...');
        await fetchUserProfile(session.user.id);
      }
      setInitialized(true);
      setLoading(false);
      console.log('✅ Initial auth state loaded');
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('🔔 Auth state changed:', event, session ? 'Session exists' : 'No session');
      console.log('👤 User in session:', session?.user ? session.user.email : 'None');
      
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        console.log('🔍 Fetching profile for auth change...');
        await fetchUserProfile(session.user.id);
      } else {
        console.log('🧹 Clearing user profile');
        setUserProfile(null);
      }
      
      if (initialized) {
        setLoading(false);
      }
      console.log('✅ Auth state change processed');
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [initialized]);

  const signIn = async (email: string, password: string) => {
    console.log('🔐 Signing in:', email);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    console.log('✅ Sign in successful');
  };

  const signInWithGoogle = async () => {
    console.log('🔐 Signing in with Google');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    console.log('📝 Signing up:', email);
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    console.log('✅ Sign up successful');
  };

  const signOut = async () => {
    console.log('🚪 Signing out');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn('Error during sign out:', error.message);
      }
    } catch (error) {
      console.warn('Error during sign out:', error);
    } finally {
      setSession(null);
      setUser(null);
      setUserProfile(null);
      console.log('✅ Sign out completed');
    }
  };

  // Add debug logging for render
  console.log('🎨 AuthProvider render - Loading:', loading, 'User:', user?.email || 'None', 'Initialized:', initialized);

  const value = {
    session,
    user,
    userProfile,
    loading,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    refreshUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};