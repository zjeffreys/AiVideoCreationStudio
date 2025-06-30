import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle, Loader2, CreditCard, Tag } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { stripeService, STRIPE_PRICES } from '../../lib/stripe';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  planName: string;
  price: string;
  duration: string;
  onSuccess: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  productId,
  planName,
  price,
  duration,
  onSuccess,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [showCouponField, setShowCouponField] = useState(false);

  if (!isOpen) return null;

  const handleCheckout = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const successUrl = `${window.location.origin}/settings?success=true&plan=${planName}`;
      const cancelUrl = `${window.location.origin}/settings?canceled=true`;

      const result = await stripeService.createCheckoutSession(
        productId,
        successUrl,
        cancelUrl,
        couponCode.trim() || undefined
      );

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.sessionId) {
        // Redirect to Stripe Checkout
        await stripeService.redirectToCheckout(result.sessionId);
      } else if (result.url) {
        // Direct redirect
        window.location.href = result.url;
      } else {
        setError('Failed to create checkout session');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Upgrade to {planName}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-500"
            disabled={isProcessing}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
              {planName}
            </h4>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {price}
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                per {duration}
              </span>
            </div>
          </div>

          <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <p>🔥 <strong>LIFETIME DEAL</strong> - Price locked in forever!</p>
            <p>✅ Priority support</p>
            <p>✅ Early access to new features</p>
            <p>✅ Direct feedback channel</p>
            <p>✅ Advanced AI features</p>
            <p>✅ Premium templates</p>
            <p>✅ Help shape the product roadmap</p>
          </div>
        </div>

        {/* Coupon Code Section */}
        <div className="mb-4">
          {!showCouponField ? (
            <button
              type="button"
              onClick={() => setShowCouponField(true)}
              className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
              disabled={isProcessing}
            >
              <Tag className="h-4 w-4" />
              Have a coupon code?
            </button>
          ) : (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Coupon Code
              </label>
              <div className="flex gap-2">
                <Input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Enter coupon code"
                  disabled={isProcessing}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowCouponField(false);
                    setCouponCode('');
                  }}
                  disabled={isProcessing}
                  className="px-3"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {couponCode && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Coupon will be applied at checkout
                </p>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCheckout}
            disabled={isProcessing}
            isLoading={isProcessing}
            loadingText="Redirecting..."
            className="flex-1 bg-purple-600 text-white hover:bg-purple-700"
            leftIcon={!isProcessing ? <CreditCard className="h-4 w-4" /> : undefined}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Continue to Payment'
            )}
          </Button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center">
          Secure payment powered by Stripe. Limited to first 100 customers. Your $50/month rate is locked in for life!
        </p>
      </div>
    </div>
  );
};