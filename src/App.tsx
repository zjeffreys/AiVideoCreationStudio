import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/Login';
import { SignUpPage } from './pages/SignUp';
import { Dashboard } from './pages/Dashboard';
import { Videos } from './pages/Videos';
import { Characters } from './pages/Characters';
import { Voices } from './pages/Voices';
import { MusicPage } from './pages/Music';
import { Settings } from './pages/Settings';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  // Show nothing while checking authentication
  if (loading) return null;
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          
          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard\" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="videos" element={<Videos />} />
            <Route path="characters" element={<Characters />} />
            <Route path="voices" element={<Voices />} />
            <Route path="music" element={<MusicPage />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/\" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;