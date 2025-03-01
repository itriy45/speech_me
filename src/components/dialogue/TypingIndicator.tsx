import React, { useState, useEffect, useMemo } from 'react';

const TypingIndicator = ({
  // Size configurations
  size = 'medium', // 'small' | 'medium' | 'large'
  bubbleWidth = '28%',
  animationScale = 1,
  
  // Color configurations
  primaryColor = '#4338CA', // indigo-700
  secondaryColor = '#7E22CE', // purple-700
  backgroundColor = '#F8FAFC', // slate-100
  hoverBackgroundColor = '#EEF2FF', // indigo-50
  
  // Animation configurations
  animationSpeed = 1.2,
  pulseIntensity = 1.2,
  particleCount = 7,
  ringCount = 4,
  dotsPerRing = 5,
  
  // Behavior configurations
  autoHide = true,
  hideDelay = 4000,
  enableRipple = true,
  enableHoverEffects = true,
  
  // Custom styles
  className = '',
  style = {},
}) => {
  const [isActive, setIsActive] = useState(true);
  const [interactionCount, setInteractionCount] = useState(0);

  // Calculate size-based dimensions
  const dimensions = useMemo(() => {
    const sizes = {
      small: { container: 'w-16 h-8', dot: 'w-1.5 h-1.5', particle: 'w-0.5 h-0.5', padding: 'px-4 py-2' },
      medium: { container: 'w-20 h-10', dot: 'w-2 h-2', particle: 'w-1 h-1', padding: 'px-6 py-4' },
      large: { container: 'w-24 h-12', dot: 'w-2.5 h-2.5', particle: 'w-1.5 h-1.5', padding: 'px-8 py-6' },
    };
    return sizes[size] || sizes.medium;
  }, [size]);

  // Auto-hide effect
  useEffect(() => {
    if (!autoHide) return;
    
    const interval = setInterval(() => {
      setIsActive((prev) => !prev);
    }, hideDelay);
    
    return () => clearInterval(interval);
  }, [autoHide, hideDelay]);

  // Generate animation styles
  const getAnimationStyle = (index, type) => {
    const baseSpeed = 3000 * (1 / animationSpeed);
    
    if (type === 'ring') {
      return {
        animation: `rotate-${index % 2 ? 'ccw' : 'cw'} ${baseSpeed + index * 1000}ms infinite linear`,
      };
    }
    
    if (type === 'particle') {
      return {
        animation: `particle-burst ${baseSpeed}ms infinite ${index * (baseSpeed / particleCount)}ms`,
      };
    }
    
    return {};
  };

  return (
    <div 
      className={`flex justify-start transition-opacity duration-500 ${
        isActive ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      style={style}
    >
      <div 
        className={`relative group ${enableHoverEffects ? 'hover:scale-105' : ''}`}
        onMouseEnter={() => setInteractionCount(prev => prev + 1)}
        style={{ width: bubbleWidth }}
      >
        <div 
          className={`
            relative
            ${enableHoverEffects ? 'group-hover:from-indigo-50 group-hover:via-purple-50 group-hover:to-indigo-50' : ''}
            rounded-2xl rounded-tl-sm
            transition-all duration-300 ease-in-out shadow-sm
            ${dimensions.padding}
          `}
          style={{
            background: `linear-gradient(to right, ${backgroundColor}, ${hoverBackgroundColor})`,
          }}
        >
          <div className="flex items-center gap-3 relative">
            {/* Main animation container */}
            <div className={`relative ${dimensions.container} flex items-center justify-center`}
                 style={{ transform: `scale(${animationScale})` }}>
              
              {/* Orbital rings */}
              {[...Array(ringCount)].map((_, ringIndex) => (
                <div
                  key={`ring-${ringIndex}`}
                  className="absolute"
                  style={{
                    width: `${20 + ringIndex * 8}px`,
                    height: `${20 + ringIndex * 8}px`,
                    ...getAnimationStyle(ringIndex, 'ring'),
                  }}
                >
                  {[...Array(dotsPerRing)].map((_, dotIndex) => (
                    <div
                      key={`dot-${ringIndex}-${dotIndex}`}
                      className={`absolute ${dimensions.dot} rounded-full`}
                      style={{
                        background: `linear-gradient(to right, ${primaryColor}80, ${secondaryColor}80)`,
                        transform: `rotate(${(dotIndex * 360) / dotsPerRing}deg) translateX(${10 + ringIndex * 4}px)`,
                        animation: `pulse-fade ${2 + ringIndex * 0.5}s infinite ${dotIndex * 500}ms`,
                      }}
                    />
                  ))}
                </div>
              ))}
              
              {/* Center particle system */}
              <div className="relative w-3 h-3">
                {[...Array(particleCount)].map((_, i) => (
                  <div
                    key={`particle-${i}`}
                    className={`absolute ${dimensions.particle} rounded-full`}
                    style={{
                      backgroundColor: `${primaryColor}80`,
                      ...getAnimationStyle(i, 'particle'),
                      transform: `rotate(${(i * 360) / particleCount}deg)`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Interactive ripples */}
          {enableRipple && interactionCount > 0 && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(3)].map((_, i) => (
                <div
                  key={`ripple-${i}`}
                  className="absolute inset-0 rounded-2xl border"
                  style={{
                    borderColor: `${primaryColor}40`,
                    animation: `ripple 2s infinite ${i * 600}ms`,
                    opacity: 0,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes rotate-cw {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes rotate-ccw {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }

        @keyframes pulse-fade {
          0%, 100% { 
            transform: scale(1) rotate(inherit) translateX(inherit);
            opacity: 0.5;
          }
          50% { 
            transform: scale(${pulseIntensity}) rotate(inherit) translateX(inherit);
            opacity: 1;
          }
        }

        @keyframes particle-burst {
          0% {
            transform: rotate(inherit) translateX(0);
            opacity: 1;
          }
          50% {
            transform: rotate(inherit) translateX(8px);
            opacity: 0.5;
          }
          100% {
            transform: rotate(inherit) translateX(0);
            opacity: 1;
          }
        }

        @keyframes ripple {
          0% {
            transform: scale(0.8);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.1);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default TypingIndicator;