import * as Purchases from '@revenuecat/purchases-js';
import { PurchasesOffering, PurchasesPackage, CustomerInfo } from '@revenuecat/purchases-js';
import { supabase } from './supabase';

// RevenueCat configuration
const REVENUECAT_PUBLIC_API_KEY = import.meta.env.VITE_REVENUECAT_PUBLIC_API_KEY;

if (!REVENUECAT_PUBLIC_API_KEY) {
  console.warn('RevenueCat API key not found. Membership features will be disabled.');
}

// Product IDs - these should match your RevenueCat configuration
export const PRODUCT_IDS = {
  EARLY_ADOPTER_MONTHLY: 'early_adopter_monthly',
  EARLY_ADOPTER_YEARLY: 'early_adopter_yearly',
} as const;

// Offering IDs - these should match your RevenueCat configuration
export const OFFERING_IDS = {
  DEFAULT: 'default',
  EARLY_ADOPTER: 'early_adopter',
} as const;

export type MembershipTier = 'free' | 'early_adopter';

export interface PurchaseResult {
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
}

export interface OfferingInfo {
  identifier: string;
  packages: PurchasesPackage[];
}

class RevenueCatService {
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  async initialize(userId?: string): Promise<void> {
    if (this.initialized) return;
    
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._initialize(userId);
    return this.initializationPromise;
  }

  private async _initialize(userId?: string): Promise<void> {
    if (!REVENUECAT_PUBLIC_API_KEY) {
      throw new Error('RevenueCat API key is required');
    }

    try {
      await Purchases.configure({
        apiKey: REVENUECAT_PUBLIC_API_KEY,
        appUserId: userId,
      });

      this.initialized = true;
      console.log('✅ RevenueCat initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize RevenueCat:', error);
      throw error;
    }
  }

  async getOfferings(): Promise<PurchasesOffering[]> {
    await this.ensureInitialized();
    
    try {
      const offerings = await Purchases.getOfferings();
      return offerings.all;
    } catch (error) {
      console.error('❌ Failed to get offerings:', error);
      throw new Error('Failed to load subscription options');
    }
  }

  async getCurrentOffering(): Promise<PurchasesOffering | null> {
    await this.ensureInitialized();
    
    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch (error) {
      console.error('❌ Failed to get current offering:', error);
      return null;
    }
  }

  async getCustomerInfo(): Promise<CustomerInfo> {
    await this.ensureInitialized();
    
    try {
      return await Purchases.getCustomerInfo();
    } catch (error) {
      console.error('❌ Failed to get customer info:', error);
      throw new Error('Failed to load subscription status');
    }
  }

  async purchasePackage(packageToPurchase: PurchasesPackage): Promise<PurchaseResult> {
    await this.ensureInitialized();
    
    try {
      console.log('🛒 Starting purchase for package:', packageToPurchase.identifier);
      
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      
      console.log('✅ Purchase successful:', customerInfo);
      
      // Sync with Supabase
      await this.syncMembershipWithSupabase(customerInfo);
      
      return {
        success: true,
        customerInfo,
      };
    } catch (error: any) {
      console.error('❌ Purchase failed:', error);
      
      // Handle specific RevenueCat errors
      if (error.userCancelled) {
        return {
          success: false,
          error: 'Purchase was cancelled',
        };
      }
      
      if (error.networkError) {
        return {
          success: false,
          error: 'Network error. Please check your connection and try again.',
        };
      }
      
      return {
        success: false,
        error: error.message || 'Purchase failed. Please try again.',
      };
    }
  }

  async restorePurchases(): Promise<PurchaseResult> {
    await this.ensureInitialized();
    
    try {
      console.log('🔄 Restoring purchases...');
      
      const customerInfo = await Purchases.restorePurchases();
      
      console.log('✅ Purchases restored:', customerInfo);
      
      // Sync with Supabase
      await this.syncMembershipWithSupabase(customerInfo);
      
      return {
        success: true,
        customerInfo,
      };
    } catch (error: any) {
      console.error('❌ Failed to restore purchases:', error);
      return {
        success: false,
        error: error.message || 'Failed to restore purchases',
      };
    }
  }

  async cancelSubscription(): Promise<boolean> {
    try {
      // Note: For web, cancellation typically happens through the payment provider's portal
      // This method would redirect to the appropriate cancellation flow
      console.log('🚫 Initiating subscription cancellation...');
      
      const customerInfo = await this.getCustomerInfo();
      
      // For web subscriptions, we typically need to redirect to the provider's portal
      // This is a placeholder - actual implementation depends on your payment provider
      
      return true;
    } catch (error) {
      console.error('❌ Failed to cancel subscription:', error);
      return false;
    }
  }

  private async syncMembershipWithSupabase(customerInfo: CustomerInfo): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('⚠️ No authenticated user found for membership sync');
        return;
      }

      // Determine membership type based on active entitlements
      let membershipType: MembershipTier = 'free';
      
      if (customerInfo.activeSubscriptions.length > 0) {
        // Check for early adopter subscription
        const hasEarlyAdopter = customerInfo.activeSubscriptions.some(sub => 
          sub.includes('early_adopter') || sub.includes(PRODUCT_IDS.EARLY_ADOPTER_MONTHLY)
        );
        
        if (hasEarlyAdopter) {
          membershipType = 'early_adopter';
        }
      }

      console.log('🔄 Syncing membership with Supabase:', membershipType);

      // Update user profile in Supabase
      const { error } = await supabase
        .from('user_profiles')
        .update({
          membership_type: membershipType,
          subscription_start_date: membershipType !== 'free' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Failed to sync membership with Supabase:', error);
        throw error;
      }

      console.log('✅ Membership synced with Supabase successfully');
    } catch (error) {
      console.error('❌ Error syncing membership:', error);
      throw error;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  getMembershipTierFromCustomerInfo(customerInfo: CustomerInfo): MembershipTier {
    if (customerInfo.activeSubscriptions.length === 0) {
      return 'free';
    }

    // Check for early adopter subscription
    const hasEarlyAdopter = customerInfo.activeSubscriptions.some(sub => 
      sub.includes('early_adopter') || sub.includes(PRODUCT_IDS.EARLY_ADOPTER_MONTHLY)
    );

    if (hasEarlyAdopter) {
      return 'early_adopter';
    }

    return 'free';
  }

  formatPrice(packageInfo: PurchasesPackage): string {
    if (packageInfo.product.priceString) {
      return packageInfo.product.priceString;
    }
    
    // Fallback formatting
    const price = packageInfo.product.price;
    const currency = packageInfo.product.currencyCode || 'USD';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  }

  getPackageDuration(packageInfo: PurchasesPackage): string {
    const identifier = packageInfo.identifier.toLowerCase();
    
    if (identifier.includes('monthly')) {
      return 'month';
    } else if (identifier.includes('yearly') || identifier.includes('annual')) {
      return 'year';
    }
    
    return 'month'; // default
  }
}

// Export singleton instance
export const revenueCatService = new RevenueCatService();

// Utility functions
export const initializeRevenueCat = async (userId?: string) => {
  return revenueCatService.initialize(userId);
};

export const getOfferings = () => revenueCatService.getOfferings();
export const getCurrentOffering = () => revenueCatService.getCurrentOffering();
export const getCustomerInfo = () => revenueCatService.getCustomerInfo();
export const purchasePackage = (pkg: PurchasesPackage) => revenueCatService.purchasePackage(pkg);
export const restorePurchases = () => revenueCatService.restorePurchases();
export const cancelSubscription = () => revenueCatService.cancelSubscription();