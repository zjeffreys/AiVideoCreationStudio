import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { 
  LayoutDashboard, 
  Film, 
  Users, 
  Mic2, 
  Settings,
  Menu,
  X
} from 'lucide-react';

type SidebarProps = {
  isMobileOpen: boolean;
  toggleMobileSidebar: () => void;
};

type NavItem = {
  label: string;
  path: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    label: 'My Videos',
    path: '/videos',
    icon: <Film className="h-5 w-5" />,
  },
  {
    label: 'Characters',
    path: '/characters',
    icon: <Users className="h-5 w-5" />,
  },
  {
    label: 'Voices',
    path: '/voices',
    icon: <Mic2 className="h-5 w-5" />,
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: <Settings className="h-5 w-5" />,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, toggleMobileSidebar }) => {
  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={toggleMobileSidebar}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
          <div className="flex items-center">
            <img 
              src="/EduMotionLogo.png" 
              alt="EduMotion Logo" 
              className="h-8 w-auto"
            />
            <span className="ml-2 text-xl font-bold bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-transparent">EduMotion</span>
          </div>
          <button 
            className="lg:hidden"
            onClick={toggleMobileSidebar}
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <nav className="flex flex-col gap-1 p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-200",
                isActive 
                  ? "bg-gradient-to-r from-purple-600 to-orange-500 text-white" 
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
              onClick={() => {
                // Close the mobile sidebar when a link is clicked
                if (isMobileOpen) {
                  toggleMobileSidebar();
                }
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center gap-2 rounded-md bg-gradient-to-r from-purple-900/50 to-orange-900/50 p-3">
            <img 
              src="/EduMotionLogo.png" 
              alt="EduMotion Logo" 
              className="h-8 w-auto"
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white">EduMotion</span>
              <span className="text-xs text-slate-400">v0.1.0</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};