import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from './Button';

interface StickyTopBarProps {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  breadcrumbTrail: string[];
  currentStep?: number;
}

const StickyTopBar: React.FC<StickyTopBarProps> = ({
  onBack,
  onNext,
  nextLabel = 'Next',
  breadcrumbTrail,
  currentStep = 0,
}) => {
  return (
    <div className="w-full sticky top-0 z-10 bg-[#f6f3ff]/80 backdrop-blur border-b border-[#e5e7eb] rounded-b-2xl px-6 pt-6 pb-3 flex flex-col gap-2 shadow-sm mb-6">
      <div className="flex items-center justify-between">
        {onBack ? (
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        ) : <div />}
        {onNext && (
          <Button
            onClick={onNext}
            className="ml-auto px-5 py-2 rounded-lg bg-[#a78bfa] hover:bg-[#8b5cf6] text-white font-semibold flex items-center gap-2 shadow transition"
          >
            {nextLabel} <span className="ml-1">✨</span>
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-400">
        {breadcrumbTrail.map((crumb, idx) => (
          <React.Fragment key={crumb}>
            {idx > 0 && <span>/</span>}
            <span className={idx === currentStep ? 'text-slate-600 font-medium' : ''}>{crumb}</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default StickyTopBar; 