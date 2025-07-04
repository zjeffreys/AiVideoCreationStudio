import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { LandingPage } from './pages/Landing';
import { LoginPage } from './pages/Login';
import { SignUpPage } from './pages/SignUp';
import { Dashboard } from './pages/Dashboard';
import { Videos } from './pages/Videos';
import { VideoDetails } from './pages/VideoDetails';
import { Characters } from './pages/Characters';
import { Voices } from './pages/Voices';
import { MusicPage } from './pages/Music';
import { Settings } from './pages/Settings';
import StoryBoard from './pages/StoryBoard';
import StoryboardPlanner from './pages/StoryboardPlanner';
import VideoEditor from './pages/VideoEditor';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  console.log('🛡️ ProtectedRoute render - Loading:', loading, 'User:', user?.email || 'None');
  
  if (loading) return null;
  
  if (!user) {
    console.log('🚫 ProtectedRoute: No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  console.log('✅ ProtectedRoute: User authenticated, rendering children');
  return <>{children}</>;
};

const AuthCallback = () => {
  const { user, loading } = useAuth();
  
  console.log('🔄 AuthCallback render - Loading:', loading, 'User:', user?.email || 'None');
  
  if (loading) return null;
  
  if (user) {
    console.log('✅ AuthCallback: User found, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }
  
  console.log('🏠 AuthCallback: No user, redirecting to home');
  return <Navigate to="/" replace />;
};

function App() {
  const { user, loading } = useAuth();

  console.log('🎯 App render - Loading:', loading, 'User:', user?.email || 'None');

  if (loading) {
    console.log('⏳ App: Still loading, showing spinner');
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-purple-600"></div>
          <p className="text-lg font-medium text-slate-700">Loading...</p>
        </div>
      </div>
    );
  }

  console.log('🎨 App: Rendering router');

  return (
    <Router>
      <Routes>
        {/* Landing page for non-authenticated users */}
        <Route 
          path="/" 
          element={!user ? <LandingPage /> : <Navigate to="/dashboard" replace />} 
        />
        
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        
        {/* Auth callback route */}
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        {/* StoryboardPlanner route OUTSIDE layout for full-viewport */}
        <Route path="/storyboard-planner" element={<ProtectedRoute><StoryboardPlanner /></ProtectedRoute>} />
        
        {/* StoryBoard route OUTSIDE layout for full-viewport */}
        <Route path="/story-board" element={<ProtectedRoute><StoryBoard /></ProtectedRoute>} />
        
        {/* VideoEditor route OUTSIDE layout for full-viewport */}
        <Route path="/video-editor" element={<ProtectedRoute><VideoEditor /></ProtectedRoute>} />
        <Route path="/video-editor/:videoId" element={<ProtectedRoute><VideoEditor /></ProtectedRoute>} />
        
        {/* Protected routes with sidebar/topbar */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="videos" element={<Videos />} />
          <Route path="videos/:id" element={<VideoDetails />} />
          <Route path="characters" element={<Characters />} />
          <Route path="voices" element={<Voices />} />
          <Route path="music" element={<MusicPage />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;