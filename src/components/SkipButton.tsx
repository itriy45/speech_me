import React, { useState, useRef, useEffect } from 'react';
import { SkipForward, Check, ArrowRight } from 'lucide-react';

interface SkipButtonProps {
  onSkip: () => void;
  hasAttempted: boolean;
  className?: string;
  disabled?: boolean;
}

export default function SkipButton({ 
  onSkip, 
  hasAttempted,  // We keep this prop for state management even though we don't use it for visibility
  className = '',
  disabled = false 
}: SkipButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const confirmTimeoutRef = useRef<NodeJS.Timeout>();
  const animationTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (confirmTimeoutRef.current) {
        clearTimeout(confirmTimeoutRef.current);
      }
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  const handleClick = () => {
    if (disabled) return;
    
    if (!showConfirm) {
      setShowConfirm(true);
      confirmTimeoutRef.current = setTimeout(() => {
        setShowConfirm(false);
      }, 3000);
    } else {
      setIsAnimating(true);
      
      // Enhanced animation sequence
      animationTimeoutRef.current = setTimeout(() => {
        onSkip();
        setShowConfirm(false);
        
        setTimeout(() => {
          setIsAnimating(false);
        }, 800); // Extended animation duration
      }, 600);

      if (confirmTimeoutRef.current) {
        clearTimeout(confirmTimeoutRef.current);
      }
    }
  };

  return (
    <div className="relative flex items-center group">
      {/* Click again tooltip - Now positioned to the left */}
      {showConfirm && !isAnimating && (
        <div className={`
          absolute right-full mr-3 whitespace-nowrap
          transition-all duration-300 ease-out
          animate-slide-in
        `}>
          <div className="
            flex items-center
            bg-amber-50 text-amber-700 px-3 py-2 rounded-lg text-sm font-medium 
            border border-amber-200 shadow-sm
            transition-all duration-300
          ">
            <span>Click again</span>
            <ArrowRight className="w-4 h-4 ml-2 animate-bounce-x" />
          </div>
        </div>
      )}

      <button
        onClick={handleClick}
        disabled={disabled}
        className={`
          relative p-3 rounded-full
          transition-all duration-500 ease-in-out
          transform hover:scale-105
          ${isAnimating ? 'scale-90 opacity-0 rotate-180' : 'scale-100 opacity-100 rotate-0'}
          ${showConfirm 
            ? 'bg-amber-100 text-amber-600 hover:bg-amber-200 hover:shadow-lg' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:shadow-md'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${className}
          overflow-hidden
        `}
        aria-label={showConfirm ? "Confirm skip" : "Skip phrase"}
      >
        <div className="relative">
          {/* Main icon with rotation animation */}
          <SkipForward className={`
            w-5 h-5
            transition-all duration-500
            transform
            ${isAnimating ? 'scale-0 opacity-0 rotate-180' : 'scale-100 opacity-100 rotate-0'}
            ${showConfirm ? 'animate-pulse' : ''}
          `} />
          
          {/* Success check icon overlay with spring animation */}
          <Check className={`
            absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
            w-5 h-5 text-green-500
            transition-all duration-500
            transform
            ${isAnimating ? 'scale-100 opacity-100 rotate-0' : 'scale-0 opacity-0 rotate-180'}
          `} />
        </div>

        {/* Inner ripple effect */}
        <div className={`
          absolute inset-0 rounded-full
          transition-all duration-300
          ${showConfirm ? 'bg-amber-400/10' : ''}
        `} />
      </button>

      {/* Multiple ripple effects */}
      {isAnimating && (
        <>
          <div className="absolute inset-0 animate-ripple-1">
            <div className="absolute inset-0 bg-green-400/20 rounded-full" />
          </div>
          <div className="absolute inset-0 animate-ripple-2">
            <div className="absolute inset-0 bg-green-300/15 rounded-full" />
          </div>
          <div className="absolute inset-0 animate-ripple-3">
            <div className="absolute inset-0 bg-green-200/10 rounded-full" />
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes ripple-1 {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
        
        @keyframes ripple-2 {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        
        @keyframes ripple-3 {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.4); opacity: 0; }
        }

        @keyframes slide-in {
          0% { transform: translateX(10px); opacity: 0; }
          50% { transform: translateX(-2px); opacity: 0.8; }
          100% { transform: translateX(0); opacity: 1; }
        }

        @keyframes bounce-x {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(3px); }
        }

        .animate-ripple-1 {
          animation: ripple-1 0.8s ease-out forwards;
        }

        .animate-ripple-2 {
          animation: ripple-2 0.8s ease-out 0.1s forwards;
        }

        .animate-ripple-3 {
          animation: ripple-3 0.8s ease-out 0.2s forwards;
        }

        .animate-slide-in {
          animation: slide-in 0.5s ease-out forwards;
        }

        .animate-bounce-x {
          animation: bounce-x 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}