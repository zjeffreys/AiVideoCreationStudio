import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

// Initialize Stripe
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.warn('Stripe publishable key not found. Payment features will be disabled.');
}

let stripePromise: Promise<Stripe | null> | null = null;

export const getStripe = () => {
  if (!stripePromise && stripePublishableKey) {
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise;
};

// Stripe price IDs - these should match your Stripe dashboard configuration
export const STRIPE_PRICES = {
  EARLY_ADOPTER_LIFETIME: 'prod_SZIXEBTZAkmQAN', // Early adopter product ID
  REGULAR_MONTHLY: 'price_regular_monthly',   // Future regular pricing
} as const;

export type MembershipTier = 'free' | 'early_adopter' | 'paid';

export interface CheckoutSessionResponse {
  sessionId?: string;
  url?: string;
  error?: string;
}

export interface CustomerPortalResponse {
  url?: string;
  error?: string;
}

class StripeService {
  async createCheckoutSession(
    productId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<CheckoutSessionResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User not authenticated');
      }

      const response = await supabase.functions.invoke('create-checkout-session', {
        body: {
          productId,
          successUrl,
          cancelUrl,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return {
        error: error instanceof Error ? error.message : 'Failed to create checkout session',
      };
    }
  }

  async createCustomerPortalSession(returnUrl: string): Promise<CustomerPortalResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User not authenticated');
      }

      const response = await supabase.functions.invoke('create-customer-portal', {
        body: {
          returnUrl,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (error) {
      console.error('Error creating customer portal session:', error);
      return {
        error: error instanceof Error ? error.message : 'Failed to create customer portal session',
      };
    }
  }

  async redirectToCheckout(sessionId: string): Promise<void> {
    const stripe = await getStripe();
    if (!stripe) {
      throw new Error('Stripe not initialized');
    }

    const { error } = await stripe.redirectToCheckout({ sessionId });
    if (error) {
      throw error;
    }
  }

  formatPrice(priceInCents: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(priceInCents / 100);
  }

  getMembershipTierFromPriceId(priceId: string): MembershipTier {
    switch (priceId) {
      case 'prod_SZIXEBTZAkmQAN':
        return 'early_adopter';
      case STRIPE_PRICES.REGULAR_MONTHLY:
      default:
        return 'paid';
    }
  }
}

// Export singleton instance
export const stripeService = new StripeService();

// Utility functions
export const createCheckoutSession = (productId: string, successUrl: string, cancelUrl: string) =>
  stripeService.createCheckoutSession(productId, successUrl, cancelUrl);

export const createCustomerPortalSession = (returnUrl: string) =>
  stripeService.createCustomerPortalSession(returnUrl);

export const redirectToCheckout = (sessionId: string) =>
  stripeService.redirectToCheckout(sessionId);

export const formatPrice = (priceInCents: number, currency?: string) =>
  stripeService.formatPrice(priceInCents, currency);