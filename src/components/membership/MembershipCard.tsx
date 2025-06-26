import React from 'react';
import { Check, Star, Crown, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { MembershipTier } from '../../lib/stripe';

interface MembershipCardProps {
  tier: MembershipTier;
  title: string;
  price: string;
  duration: string;
  features: string[];
  isCurrentPlan: boolean;
  isPopular?: boolean;
  onSelect: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export const MembershipCard: React.FC<MembershipCardProps> = ({
  tier,
  title,
  price,
  duration,
  features,
  isCurrentPlan,
  isPopular = false,
  onSelect,
  loading = false,
  disabled = false,
}) => {
  const getIcon = () => {
    switch (tier) {
      case 'free':
        return <Crown className="h-5 w-5 text-slate-500" />;
      case 'early_adopter':
        return <Star className="h-5 w-5 text-yellow-500" />;
      case 'paid':
        return <Crown className="h-5 w-5 text-purple-500" />;
      default:
        return <Crown className="h-5 w-5 text-slate-500" />;
    }
  };

  const getCardStyles = () => {
    if (isCurrentPlan) {
      return 'border-green-400 bg-green-50 dark:bg-green-900/20';
    }
    if (isPopular) {
      return 'border-purple-400 bg-purple-50 dark:bg-purple-900/20 relative';
    }
    return 'border-slate-200 dark:border-slate-700';
  };

  const getButtonStyles = () => {
    if (isCurrentPlan) {
      return 'bg-green-600 text-white hover:bg-green-700';
    }
    if (isPopular) {
      return 'bg-purple-600 text-white hover:bg-purple-700';
    }
    return 'bg-slate-600 text-white hover:bg-slate-700';
  };

  return (
    <div className={`rounded-lg border p-6 ${getCardStyles()}`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            Most Popular
          </span>
        </div>
      )}
      
      <div className="flex items-center gap-3 mb-4">
        {getIcon()}
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{price}</span>
            <span className="text-slate-500 dark:text-slate-400">/{duration}</span>
          </div>
        </div>
      </div>

      <ul className="space-y-3 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span className="text-sm text-slate-600 dark:text-slate-300">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        onClick={onSelect}
        disabled={disabled || loading || isCurrentPlan}
        isLoading={loading}
        loadingText={isCurrentPlan ? "Current Plan" : "Processing..."}
        className={`w-full ${getButtonStyles()}`}
      >
        {isCurrentPlan ? (
          "Current Plan"
        ) : loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          tier === 'free' ? 'Downgrade' : 'Upgrade'
        )}
      </Button>
    </div>
  );
};