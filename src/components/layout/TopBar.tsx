import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

type TopBarProps = {
  toggleMobileSidebar: () => void;
};

export const TopBar: React.FC<TopBarProps> = ({ toggleMobileSidebar }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-700 bg-slate-900 px-4 lg:px-6">
      <button
        className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-300 hover:text-white hover:bg-slate-800 lg:hidden"
        onClick={toggleMobileSidebar}
      >
        <Menu className="h-6 w-6" />
        <span className="sr-only">Toggle sidebar</span>
      </button>
      
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            className="flex items-center gap-2 rounded-full border border-slate-700 p-1 pl-1 pr-3 text-sm hover:bg-slate-800"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-900/50 text-purple-300">
              <User className="h-4 w-4" />
            </span>
            <span className="font-medium text-slate-300">
              {user?.email?.split('@')[0] || 'User'}
            </span>
          </button>
          
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-md border border-slate-700 bg-slate-800 py-1 shadow-lg">
              <div className="border-b border-slate-700 px-4 py-2">
                <p className="text-sm font-medium text-white">{user?.email}</p>
              </div>
              <button
                className="block w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
                onClick={() => {
                  setIsProfileOpen(false);
                  navigate('/settings');
                }}
              >
                Account settings
              </button>
              <button
                className="block w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-slate-700"
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};