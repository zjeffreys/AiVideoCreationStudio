import React, { useState } from 'react';
import { Save, User, Lock, Bell, Crown, Star, Zap, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { MembershipType } from '../types';
import { MembershipCard } from '../components/membership/MembershipCard';
import { PurchaseModal } from '../components/membership/PurchaseModal';
import { revenueCatService, initializeRevenueCat, getCurrentOffering, getCustomerInfo } from '../lib/revenuecat';
import { PurchasesPackage, PurchasesOffering } from '@revenuecat/purchases-js';

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
  
  // RevenueCat state
  const [revenueCatInitialized, setRevenueCatInitialized] = useState(false);
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);
  const [loadingOfferings, setLoadingOfferings] = useState(false);
  const [revenueCatError, setRevenueCatError] = useState<string | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [processingPurchase, setProcessingPurchase] = useState(false);

  // Initialize RevenueCat when component mounts
  React.useEffect(() => {
    const initRC = async () => {
      if (!user || revenueCatInitialized) return;
      
      try {
        setLoadingOfferings(true);
        setRevenueCatError(null);
        
        await initializeRevenueCat(user.id);
        setRevenueCatInitialized(true);
        
        const offering = await getCurrentOffering();
        setCurrentOffering(offering);
        
        console.log('✅ RevenueCat initialized with offering:', offering);
      } catch (error) {
        console.error('❌ Failed to initialize RevenueCat:', error);
        setRevenueCatError(error instanceof Error ? error.message : 'Failed to load subscription options');
      } finally {
        setLoadingOfferings(false);
      }
    };

    initRC();
  }, [user, revenueCatInitialized]);

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

  const handleEarlyAdopterUpgrade = async () => {
    if (!currentOffering || !revenueCatInitialized) {
      setUpdateError('Subscription options are not available. Please try again later.');
      return;
    }

    // Find the early adopter package
    const earlyAdopterPackage = currentOffering.availablePackages.find(pkg => 
      pkg.identifier.toLowerCase().includes('early_adopter') ||
      pkg.identifier.toLowerCase().includes('monthly')
    );

    if (!earlyAdopterPackage) {
      setUpdateError('Early adopter subscription is not available. Please contact support.');
      return;
    }

    setSelectedPackage(earlyAdopterPackage);
    setShowPurchaseModal(true);
  };

  const handlePurchaseSuccess = async () => {
    setShowPurchaseModal(false);
    setSelectedPackage(null);
    
    // Refresh user profile to get updated membership status
    await refreshUserProfile();
    
    setUpdateSuccess('Successfully upgraded to Early Adopter! Welcome to the program!');
  };

  const handleRestorePurchases = async () => {
    if (!revenueCatInitialized) return;
    
    setIsUpdatingMembership(true);
    setUpdateError(null);
    
    try {
      const result = await revenueCatService.restorePurchases();
      
      if (result.success) {
        await refreshUserProfile();
        setUpdateSuccess('Purchases restored successfully!');
      } else {
        setUpdateError(result.error || 'Failed to restore purchases');
      }
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : 'Failed to restore purchases');
    } finally {
      setIsUpdatingMembership(false);
    }
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
              </div>

              {/* RevenueCat Error */}
              {revenueCatError && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-700 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <div>
                    <p className="text-red-700 dark:text-red-300 font-medium">Subscription Error</p>
                    <p className="text-red-600 dark:text-red-400 text-sm">{revenueCatError}</p>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {loadingOfferings && (
                <div className="mb-6 flex items-center justify-center py-8">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                    <span className="text-slate-600 dark:text-slate-400">Loading subscription options...</span>
                  </div>
                </div>
              )}

              {/* Membership Cards */}
              {!loadingOfferings && !revenueCatError && (
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
                      title="Early Adopter"
                      price={currentOffering?.availablePackages[0] ? revenueCatService.formatPrice(currentOffering.availablePackages[0]) : "$50"}
                      duration={currentOffering?.availablePackages[0] ? revenueCatService.getPackageDuration(currentOffering.availablePackages[0]) : "month"}
                      features={[
                        "Unlimited video generations",
                        "Priority support",
                        "Early access to new features",
                        "Direct feedback channel",
                        "Advanced AI features",
                        "Premium templates"
                      ]}
                      isCurrentPlan={userProfile?.membership_type === 'early_adopter'}
                      isPopular={true}
                      onSelect={handleEarlyAdopterUpgrade}
                      loading={processingPurchase}
                      disabled={userProfile?.membership_type === 'early_adopter' || !currentOffering}
                    />
                  </div>

                  {/* Restore Purchases Button */}
                  {revenueCatInitialized && (
                    <div className="flex justify-center pt-4">
                      <Button
                        variant="outline"
                        onClick={handleRestorePurchases}
                        disabled={isUpdatingMembership}
                        isLoading={isUpdatingMembership}
                        loadingText="Restoring..."
                        className="text-sm"
                      >
                        Restore Purchases
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Purchase Modal */}
              <PurchaseModal
                isOpen={showPurchaseModal}
                onClose={() => {
                  setShowPurchaseModal(false);
                  setSelectedPackage(null);
                }}
                packageToPurchase={selectedPackage}
                onSuccess={handlePurchaseSuccess}
              />

              {/* Development Note */}
              <div className="mt-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">RevenueCat Integration</h4>
                <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <p><strong>Platform:</strong> Web (Stripe integration)</p>
                  <p><strong>Product IDs needed:</strong> early_adopter_monthly, early_adopter_yearly</p>
                  <p><strong>Offering ID:</strong> default (or early_adopter)</p>
                  <p><strong>Environment:</strong> {import.meta.env.VITE_REVENUECAT_PUBLIC_API_KEY ? 'Configured' : 'Missing API key'}</p>
                </div>
              </div>

              <div className="mt-6 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Note:</strong> This is a demo implementation. In production, payment processing would be handled through a secure payment provider like Stripe or RevenueCat.
                </p>
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