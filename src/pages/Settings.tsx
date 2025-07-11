import React, { useState, useEffect } from 'react';
import { Save, User, Lock, Bell, Crown, Star, Zap, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { MembershipType } from '../types';
import { MembershipCard } from '../components/membership/MembershipCard';
import { CheckoutModal } from '../components/membership/CheckoutModal';
import { stripeService, STRIPE_PRICES } from '../lib/stripe';

export const Settings = () => {
  const { user, userProfile, signOut, refreshUserProfile } = useAuth();
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
  const { theme, toggleTheme } = useTheme();
  const [isUpdatingMembership, setIsUpdatingMembership] = useState(false);
  
  // Stripe state
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedPlanName, setSelectedPlanName] = useState<string>('');

  // Check for success/cancel URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');
    const plan = urlParams.get('plan');

    if (success === 'true') {
      setUpdateSuccess(`Successfully upgraded to ${plan || 'premium'}! Welcome to the program!`);
      // Refresh user profile to get updated membership status
      refreshUserProfile();
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (canceled === 'true') {
      setUpdateError('Payment was canceled. You can try again anytime.');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [refreshUserProfile]);

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

  const handleFreeMembershipDowngrade = async () => {
    if (!user || !userProfile) return;
    
    setIsUpdatingMembership(true);
    setUpdateError(null);
    setUpdateSuccess(null);
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          membership_type: 'free',
          subscription_start_date: null,
          subscription_end_date: null,
        })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      await refreshUserProfile();
      setUpdateSuccess('Successfully downgraded to free membership!');
    } catch (error) {
      if (error instanceof Error) {
        setUpdateError(error.message);
      } else {
        setUpdateError('An error occurred while downgrading membership');
      }
    } finally {
      setIsUpdatingMembership(false);
    }
  };

  const handleEarlyAdopterUpgrade = () => {
    setSelectedProductId(STRIPE_PRICES.EARLY_ADOPTER_LIFETIME);
    setSelectedPlanName('Early Adopter');
    setShowCheckoutModal(true);
  };

  const handleManageSubscription = async () => {
    setIsUpdatingMembership(true);
    setUpdateError(null);
    
    try {
      const returnUrl = `${window.location.origin}/settings`;
      const result = await stripeService.createCustomerPortalSession(returnUrl);
      
      if (result.error) {
        setUpdateError(result.error);
      } else if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : 'Failed to open customer portal');
    } finally {
      setIsUpdatingMembership(false);
    }
  };

  const handleCheckoutSuccess = async () => {
    setShowCheckoutModal(false);
    setSelectedProductId('');
    setSelectedPlanName('');
    
    // Refresh user profile to get updated membership status
    await refreshUserProfile();
    
    setUpdateSuccess('Successfully upgraded to Early Adopter! Welcome to the program!');
  };

  const getMembershipIcon = (type: MembershipType) => {
    switch (type) {
      case 'free':
        return <User className="h-5 w-5" />;
      case 'early_adopter':
        return <Star className="h-5 w-5" />;
      case 'paid':
        return <Crown className="h-5 w-5" />;
      default:
        return <User className="h-5 w-5" />;
    }
  };

  const getMembershipColor = (type: MembershipType) => {
    switch (type) {
      case 'free':
        return 'text-slate-500';
      case 'early_adopter':
        return 'text-yellow-500';
      case 'paid':
        return 'text-purple-500';
      default:
        return 'text-slate-500';
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-transparent">Settings</h1>
        <p className="text-slate-500 dark:text-slate-300">Manage your account settings and preferences</p>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-slate-500">Theme:</span>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 rounded bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 transition"
          >
            {theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          </button>
        </div>
      </div>
      
      <div className="grid gap-8 md:grid-cols-[250px_1fr]">
        <div className="space-y-1">
          <button
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium ${
              activeTab === 'profile' 
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400' 
                : 'text-slate-700 hover:bg-slate-100 hover:text-purple-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white'
            }`}
            onClick={() => setActiveTab('profile')}
          >
            <User className="h-5 w-5" />
            Profile
          </button>
          <button
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium ${
              activeTab === 'security' 
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400' 
                : 'text-slate-700 hover:bg-slate-100 hover:text-purple-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white'
            }`}
            onClick={() => setActiveTab('security')}
          >
            <Lock className="h-5 w-5" />
            Security
          </button>
          <button
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium ${
              activeTab === 'notifications' 
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400' 
                : 'text-slate-700 hover:bg-slate-100 hover:text-purple-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white'
            }`}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell className="h-5 w-5" />
            Notifications
          </button>
          <button
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium ${
              activeTab === 'membership' 
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400' 
                : 'text-slate-700 hover:bg-slate-100 hover:text-purple-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white'
            }`}
            onClick={() => setActiveTab('membership')}
          >
            <Crown className="h-5 w-5" />
            Membership
          </button>
        </div>
        
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          {updateError && (
            <div className="mb-6 rounded-md bg-red-50 dark:bg-red-900/50 p-4 text-sm text-red-600 dark:text-red-400">
              {updateError}
            </div>
          )}
          
          {updateSuccess && (
            <div className="mb-6 rounded-md bg-green-50 dark:bg-green-900/50 p-4 text-sm text-green-600 dark:text-green-400">
              {updateSuccess}
            </div>
          )}
          
          {activeTab === 'profile' && (
            <>
              <h2 className="mb-6 text-xl font-semibold text-slate-900 dark:text-white">Profile Settings</h2>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled
                  fullWidth
                  className="bg-white border-slate-200 text-slate-700 placeholder:text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:placeholder:text-slate-500"
                />
                <Input
                  label="Display Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={user?.email?.split('@')[0] || 'Your name'}
                  fullWidth
                  className="bg-white border-slate-200 text-slate-700 placeholder:text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-400"
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
              <h2 className="mb-6 text-xl font-semibold text-slate-900 dark:text-white">Security Settings</h2>
              <form onSubmit={handleUpdatePassword} className="space-y-6">
                <Input
                  label="Current Password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  fullWidth
                  className="bg-white border-slate-200 text-slate-700 placeholder:text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:placeholder:text-slate-500"
                />
                <Input
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  fullWidth
                  className="bg-white border-slate-200 text-slate-700 placeholder:text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:placeholder:text-slate-500"
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  fullWidth
                  className="bg-white border-slate-200 text-slate-700 placeholder:text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:placeholder:text-slate-500"
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    isLoading={isUpdating}
                    loadingText="Saving..."
                    leftIcon={!isUpdating ? <Save className="h-5 w-5" /> : undefined}
                  >
                    Update Password
                  </Button>
                </div>
              </form>
            </>
          )}
          
          {activeTab === 'membership' && (
            <>
              <h2 className="mb-6 text-xl font-semibold text-slate-900 dark:text-white">Membership Settings</h2>
              
              {/* Current Membership Status */}
              <div className="mb-6 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`${getMembershipColor(userProfile?.membership_type || 'free')}`}>
                    {getMembershipIcon(userProfile?.membership_type || 'free')}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Current Plan: {userProfile?.membership_type?.replace('_', ' ').toUpperCase() || 'FREE'}
                  </h3>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  <p>Video Generation: {userProfile?.video_generation_count || 0} / {userProfile?.video_generation_limit || 3} used</p>
                  {userProfile?.subscription_start_date && (
                    <p>Member since: {new Date(userProfile.subscription_start_date).toLocaleDateString()}</p>
                  )}
                </div>
                
                {/* Manage Subscription Button for paid users */}
                {userProfile?.membership_type !== 'free' && (
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      onClick={handleManageSubscription}
                      disabled={isUpdatingMembership}
                      isLoading={isUpdatingMembership}
                      loadingText="Opening..."
                      leftIcon={!isUpdatingMembership ? <ExternalLink className="h-4 w-4" /> : undefined}
                    >
                      Manage Subscription
                    </Button>
                  </div>
                )}
              </div>

              {/* Membership Cards */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">Available Plans</h3>
                
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Free Plan */}
                  <MembershipCard
                    tier="free"
                    title="Free"
                    price="$0"
                    duration="forever"
                    features={[
                      "3 video generations",
                      "Basic AI features",
                      "Community support",
                      "Standard templates"
                    ]}
                    isCurrentPlan={userProfile?.membership_type === 'free'}
                    onSelect={handleFreeMembershipDowngrade}
                    loading={isUpdatingMembership}
                    disabled={userProfile?.membership_type === 'free'}
                  />

                  {/* Early Adopter Plan */}
                  <MembershipCard
                    tier="early_adopter"
                    title="Early Adopter - Lifetime Deal"
                    price="$50"
                    duration="month for life"
                    features={[
                      "🔥 Lifetime $50/month pricing lock",
                      "🎥 10 Video generations/month",
                      "🗣 60 AI generate voice minutes/month", 
                      "AI Storyboarding Assistant",
                      "Royalty Free Music Library",
                      "AI Script Generation",
                      "Direct Feedback Channel",
                      "Priority Support"
                    ]}
                    isCurrentPlan={userProfile?.membership_type === 'early_adopter'}
                    isPopular={true}
                    onSelect={handleEarlyAdopterUpgrade}
                    loading={false}
                    disabled={userProfile?.membership_type === 'early_adopter'}
                  />
                </div>
              </div>

              {/* Checkout Modal */}
              <CheckoutModal
                isOpen={showCheckoutModal}
                onClose={() => {
                  setShowCheckoutModal(false);
                  setSelectedProductId('');
                  setSelectedPlanName('');
                }}
                productId={selectedProductId}
                planName={selectedPlanName}
                price="$50"
                duration="month"
                onSuccess={handleCheckoutSuccess}
              />

              {/* Development Note */}
              <div className="mt-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Early Adopter Program</h4>
                <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <p><strong>Special Offer:</strong> $50/month for life (first 100 customers only)</p>
                  <p><strong>Regular Price:</strong> Will be $100/month after early adopter period</p>
                  <p><strong>Benefits:</strong> Lifetime pricing lock + direct input on product development</p>
                  <p><strong>Status:</strong> {import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? 'Ready to accept payments' : 'Payment setup needed'}</p>
                </div>
              </div>
            </>
          )}
          
          {activeTab === 'notifications' && (
            <>
              <h2 className="mb-6 text-xl font-semibold text-slate-900 dark:text-white">Notification Settings</h2>
              <form onSubmit={handleUpdateNotifications} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label htmlFor="email-notifications" className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Bell className="h-5 w-5" />
                      Email Notifications
                    </label>
                    <input
                      type="checkbox"
                      id="email-notifications"
                      checked={isEmailNotifications}
                      onChange={(e) => setIsEmailNotifications(e.target.checked)}
                      className="form-checkbox h-5 w-5 text-purple-600 border-slate-700 bg-slate-800 focus:ring-purple-500"
                    />
                  </div>
                  <p className="text-sm text-slate-400 dark:text-slate-500">
                    Receive email updates about your video creation progress and important announcements.
                  </p>
                </div>
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
        </div>
      </div>
    </div>
  );
};