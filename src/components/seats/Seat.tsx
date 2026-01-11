import React from 'react';
import { Seat as SeatType, SeatStatus } from '../../types';

interface SeatProps {
  seat: SeatType;
  isSelected: boolean;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

const getStatusStyles = (status: SeatStatus, isSelected: boolean): string => {
  if (isSelected) {
    return 'bg-primary-500 text-white border-primary-600 shadow-lg shadow-primary-200 scale-105';
  }

  switch (status) {
    case 'available':
      return 'bg-white border-sand-300 text-sand-600 hover:border-primary-400 hover:bg-primary-50 cursor-pointer';
    case 'booked':
      return 'bg-gradient-to-br from-blue-100 to-blue-200 border-blue-300 text-blue-700 cursor-not-allowed';
    case 'blocked':
      return 'bg-sand-100 border-sand-300 text-sand-400 cursor-not-allowed';
    case 'selected':
      return 'bg-primary-500 text-white border-primary-600 shadow-lg shadow-primary-200';
    case 'sold':
      return 'bg-gradient-to-br from-red-100 to-red-200 border-red-300 text-red-700 cursor-not-allowed';
    default:
      return 'bg-white border-sand-300 text-sand-600';
  }
};

const getGenderBadgeStyles = (gender: string): string => {
  switch (gender) {
    case 'male':
      return 'bg-blue-500';
    case 'female':
      return 'bg-pink-500';
    default:
      return 'bg-sand-400';
  }
};

export const Seat: React.FC<SeatProps> = ({
  seat,
  isSelected,
  onClick,
  disabled = false,
  size = 'md',
  showLabel = true,
}) => {
  const isClickable = seat.status === 'available' && !disabled;
  const showGenderBadge = (seat.status === 'booked' || seat.status === 'sold') && seat.bookedBy?.gender;

  const handleClick = () => {
    if (isClickable && onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && isClickable && onClick) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={isClickable ? 0 : -1}
      aria-label={`Seat ${seat.label}, ${seat.status}${isSelected ? ', selected' : ''}`}
      aria-pressed={isSelected}
      aria-disabled={!isClickable}
      className={`
        relative flex items-center justify-center
        border-2 rounded-lg
        transition-all duration-200 ease-out
        font-medium select-none
        ${sizeClasses[size]}
        ${getStatusStyles(seat.status, isSelected)}
        ${isClickable ? 'active:scale-95' : ''}
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {/* Seat Icon */}
      <div className="relative">
        {/* Seat Back */}
        <svg
          viewBox="0 0 24 24"
          className={`absolute -top-1 left-1/2 -translate-x-1/2 ${
            size === 'sm' ? 'w-6 h-2' : size === 'md' ? 'w-7 h-2.5' : 'w-8 h-3'
          }`}
          fill="currentColor"
        >
          <rect x="2" y="0" width="20" height="6" rx="2" opacity="0.3" />
        </svg>

        {/* Label */}
        {showLabel && (
          <span className="relative z-10">{seat.label}</span>
        )}
      </div>

      {/* Gender Badge */}
      {showGenderBadge && (
        <div
          className={`
            absolute -top-1 -right-1
            w-4 h-4 rounded-full
            flex items-center justify-center
            text-white text-[10px] font-bold
            shadow-sm
            ${getGenderBadgeStyles(seat.bookedBy!.gender)}
          `}
        >
          {seat.bookedBy!.gender === 'male' ? 'M' : seat.bookedBy!.gender === 'female' ? 'F' : 'O'}
        </div>
      )}

      {/* Blocked Pattern Overlay */}
      {seat.status === 'blocked' && (
        <div
          className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none opacity-30"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 3px,
              currentColor 3px,
              currentColor 4px
            )`,
          }}
        />
      )}

      {/* Selected Checkmark */}
      {isSelected && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
          <svg className="w-3 h-3 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Tooltip on hover for booked/blocked */}
      {(seat.status === 'booked' || seat.status === 'blocked') && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-sand-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
          {seat.status === 'booked' && seat.bookedBy?.passengerName}
          {seat.status === 'blocked' && (seat.blockedReason || 'Blocked')}
        </div>
      )}
    </div>
  );
};

// Memoized version for performance
export const MemoizedSeat = React.memo(Seat);
