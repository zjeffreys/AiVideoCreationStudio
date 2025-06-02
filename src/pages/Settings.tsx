import React, { useState } from 'react';
import { Save, User, Lock, Bell, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const Settings = () => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isEmailNotifications, setIsEmailNotifications] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError(null);
    setUpdateSuccess(null);
    setIsUpdating(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, this would update the user's profile in Supabase
      
      setUpdateSuccess('Profile updated successfully!');
    } catch (error) {
      if (error instanceof Error) {
        setUpdateError(error.message);
      } else {
        setUpdateError('An error occurred while updating your profile');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError(null);
    setUpdateSuccess(null);
    
    if (newPassword !== confirmPassword) {
      setUpdateError('New passwords do not match');
      return;
    }
    
    setIsUpdating(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, this would update the user's password in Supabase
      
      setUpdateSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      if (error instanceof Error) {
        setUpdateError(error.message);
      } else {
        setUpdateError('An error occurred while updating your password');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError(null);
    setUpdateSuccess(null);
    setIsUpdating(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, this would update the user's notification preferences in Supabase
      
      setUpdateSuccess('Notification preferences updated successfully!');
    } catch (error) {
      if (error instanceof Error) {
        setUpdateError(error.message);
      } else {
        setUpdateError('An error occurred while updating your notification preferences');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500">
          Manage your account and preferences
        </p>
      </div>
      
      <div className="grid gap-8 md:grid-cols-[250px_1fr]">
        <div className="space-y-1">
          <button
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium ${
              activeTab === 'profile' 
                ? 'bg-purple-100 text-purple-900' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            onClick={() => setActiveTab('profile')}
          >
            <User className="h-5 w-5" />
            Profile
          </button>
          <button
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium ${
              activeTab === 'security' 
                ? 'bg-purple-100 text-purple-900' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            onClick={() => setActiveTab('security')}
          >
            <Lock className="h-5 w-5" />
            Security
          </button>
          <button
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium ${
              activeTab === 'notifications' 
                ? 'bg-purple-100 text-purple-900' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell className="h-5 w-5" />
            Notifications
          </button>
          <button
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium ${
              activeTab === 'preferences' 
                ? 'bg-purple-100 text-purple-900' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            onClick={() => setActiveTab('preferences')}
          >
            <Globe className="h-5 w-5" />
            Preferences
          </button>
        </div>
        
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          {updateError && (
            <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-600">
              {updateError}
            </div>
          )}
          
          {updateSuccess && (
            <div className="mb-6 rounded-md bg-green-50 p-4 text-sm text-green-600">
              {updateSuccess}
            </div>
          )}
          
          {activeTab === 'profile' && (
            <>
              <h2 className="mb-6 text-xl font-semibold text-slate-900">Profile Settings</h2>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled
                  fullWidth
                />
                <Input
                  label="Display Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={user?.email?.split('@')[0] || 'Your name'}
                  fullWidth
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    isLoading={isUpdating}
                    loadingText="Saving..."
                    leftIcon={!isUpdating ? <Save className="h-5 w-5" /> : undefined}
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </>
          )}
          
          {activeTab === 'security' && (
            <>
              <h2 className="mb-6 text-xl font-semibold text-slate-900">Security Settings</h2>
              <form onSubmit={handleUpdatePassword} className="space-y-6">
                <Input
                  label="Current Password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  fullWidth
                />
                <Input
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  fullWidth
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  fullWidth
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    isLoading={isUpdating}
                    loadingText="Updating..."
                    leftIcon={!isUpdating ? <Save className="h-5 w-5" /> : undefined}
                  >
                    Update Password
                  </Button>
                </div>
              </form>
            </>
          )}
          
          {activeTab === 'notifications' && (
            <>
              <h2 className="mb-6 text-xl font-semibold text-slate-900">Notification Settings</h2>
              <form onSubmit={handleUpdateNotifications} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="email-notifications"
                      checked={isEmailNotifications}
                      onChange={() => setIsEmailNotifications(!isEmailNotifications)}
                      className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    <label htmlFor="email-notifications" className="text-sm font-medium text-slate-700">
                      Email Notifications
                    </label>
                  </div>
                  <p className="text-xs text-slate-500">
                    Receive email notifications when your videos are ready, when you receive comments, and for important account updates.
                  </p>
                </div>
                
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    isLoading={isUpdating}
                    loadingText="Saving..."
                    leftIcon={!isUpdating ? <Save className="h-5 w-5" /> : undefined}
                  >
                    Save Preferences
                  </Button>
                </div>
              </form>
            </>
          )}
          
          {activeTab === 'preferences' && (
            <>
              <h2 className="mb-6 text-xl font-semibold text-slate-900">App Preferences</h2>
              <p className="text-slate-600">
                Preferences settings will be available in a future update.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};