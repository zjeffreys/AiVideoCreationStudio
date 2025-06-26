import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { PurchasesPackage } from '@revenuecat/purchases-js';
import { revenueCatService } from '../../lib/revenuecat';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageToPurchase: PurchasesPackage | null;
  onSuccess: () => void;
}

export const PurchaseModal: React.FC<PurchaseModalProps> = ({
  isOpen,
  onClose,
  packageToPurchase,
  onSuccess,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !packageToPurchase) return null;

  const handlePurchase = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await revenueCatService.purchasePackage(packageToPurchase);
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
          setSuccess(false);
        }, 2000);
      } else {
        setError(result.error || 'Purchase failed');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = () => {
    return revenueCatService.formatPrice(packageToPurchase);
  };

  const getDuration = () => {
    return revenueCatService.getPackageDuration(packageToPurchase);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Confirm Purchase
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-500"
            disabled={isProcessing}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Purchase Successful!
            </h4>
            <p className="text-slate-600 dark:text-slate-300">
              Your subscription has been activated. Redirecting...
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  Early Adopter Plan
                </h4>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">
                    {formatPrice()}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    per {getDuration()}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <p>✅ Unlimited video generations</p>
                <p>✅ Priority support</p>
                <p>✅ Early access to new features</p>
                <p>✅ Direct feedback channel</p>
              </div>
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
                onClick={handlePurchase}
                disabled={isProcessing}
                isLoading={isProcessing}
                loadingText="Processing..."
                className="flex-1 bg-purple-600 text-white hover:bg-purple-700"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Complete Purchase'
                )}
              </Button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center">
              You can cancel your subscription at any time from your account settings.
            </p>
          </>
        )}
      </div>
    </div>
  );
};