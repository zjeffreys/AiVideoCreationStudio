import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, User } from 'lucide-react';
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
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
      <button
        className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-500 hover:text-slate-900 lg:hidden"
        onClick={toggleMobileSidebar}
      >
        <Menu className="h-6 w-6" />
        <span className="sr-only">Toggle sidebar</span>
      </button>
      
      <div className="flex items-center gap-4">
        <button className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-red-500"></span>
          <span className="sr-only">Notifications</span>
        </button>
        
        <div className="relative">
          <button
            className="flex items-center gap-2 rounded-full border border-slate-200 p-1 pl-1 pr-3 text-sm hover:bg-slate-100"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-900">
              <User className="h-4 w-4" />
            </span>
            <span className="font-medium">
              {user?.email?.split('@')[0] || 'User'}
            </span>
          </button>
          
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
              <div className="border-b border-slate-200 px-4 py-2">
                <p className="text-sm font-medium">{user?.email}</p>
              </div>
              <button
                className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                onClick={() => {
                  setIsProfileOpen(false);
                  navigate('/settings');
                }}
              >
                Account settings
              </button>
              <button
                className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-slate-100"
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