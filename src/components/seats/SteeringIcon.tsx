import React from 'react';

interface SteeringIconProps {
  className?: string;
}

export const SteeringIcon: React.FC<SteeringIconProps> = ({ className = '' }) => {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Driver Area Indicator */}
      <div className="relative">
        {/* Steering Wheel */}
        <svg
          viewBox="0 0 48 48"
          className="w-10 h-10 text-sand-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          {/* Outer Circle */}
          <circle cx="24" cy="24" r="16" />

          {/* Inner Circle */}
          <circle cx="24" cy="24" r="6" />

          {/* Spokes */}
          <line x1="24" y1="8" x2="24" y2="18" />
          <line x1="24" y1="30" x2="24" y2="40" />
          <line x1="8" y1="24" x2="18" y2="24" />
          <line x1="30" y1="24" x2="40" y2="24" />

          {/* Diagonal Spokes */}
          <line x1="12.7" y1="12.7" x2="19.5" y2="19.5" />
          <line x1="28.5" y1="28.5" x2="35.3" y2="35.3" />
        </svg>

        {/* Driver Label */}
        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-sand-400 font-medium whitespace-nowrap">
          DRIVER
        </span>
      </div>
    </div>
  );
};

// Compact version for tight spaces
export const CompactSteeringIcon: React.FC<SteeringIconProps> = ({ className = '' }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 24 24"
        className="w-6 h-6 text-sand-400"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3" />
        <line x1="12" y1="4" x2="12" y2="9" />
        <line x1="12" y1="15" x2="12" y2="20" />
        <line x1="4" y1="12" x2="9" y2="12" />
        <line x1="15" y1="12" x2="20" y2="12" />
      </svg>
    </div>
  );
};
