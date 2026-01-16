import React, { useState, useEffect, useCallback } from 'react';
import { Clock, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';

interface HoldTimerProps {
  holdExpiresAt: string;
  onExpired?: () => void;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'badge' | 'inline' | 'card';
}

export const HoldTimer: React.FC<HoldTimerProps> = ({
  holdExpiresAt,
  onExpired,
  showLabel = true,
  size = 'md',
  variant = 'badge',
}) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  const calculateTimeRemaining = useCallback(() => {
    const now = new Date().getTime();
    const expiry = new Date(holdExpiresAt).getTime();
    const diff = expiry - now;
    return Math.max(0, diff);
  }, [holdExpiresAt]);

  useEffect(() => {
    // Initial calculation
    const initial = calculateTimeRemaining();
    setTimeRemaining(initial);

    if (initial <= 0) {
      setIsExpired(true);
      onExpired?.();
      return;
    }

    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        setIsExpired(true);
        onExpired?.();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [holdExpiresAt, calculateTimeRemaining, onExpired]);

  // Format time remaining
  const formatTime = (ms: number): string => {
    if (ms <= 0) return '00:00';

    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get urgency level based on time remaining
  const getUrgencyLevel = (): 'critical' | 'warning' | 'normal' | 'expired' => {
    if (isExpired || timeRemaining <= 0) return 'expired';
    if (timeRemaining <= 5 * 60 * 1000) return 'critical'; // Less than 5 minutes
    if (timeRemaining <= 15 * 60 * 1000) return 'warning'; // Less than 15 minutes
    return 'normal';
  };

  const urgency = getUrgencyLevel();

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2',
  };

  // Color classes based on urgency
  const colorClasses = {
    expired: 'bg-gray-100 text-gray-600 border-gray-300',
    critical: 'bg-red-100 text-red-700 border-red-300 animate-pulse',
    warning: 'bg-amber-100 text-amber-700 border-amber-300',
    normal: 'bg-amber-50 text-amber-600 border-amber-200',
  };

  // Icon based on urgency
  const Icon = urgency === 'expired' ? XCircle : urgency === 'critical' ? AlertTriangle : Clock;

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${sizeClasses[size]} ${colorClasses[urgency]}`}>
        <Icon className={`${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'}`} />
        {isExpired ? (
          <span>Expired</span>
        ) : (
          <>
            {showLabel && <span className="hidden sm:inline">Hold expires in</span>}
            <span className="font-mono font-bold">{formatTime(timeRemaining)}</span>
          </>
        )}
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <span className={`inline-flex items-center gap-1 ${urgency === 'critical' ? 'text-red-600' : urgency === 'warning' ? 'text-amber-600' : urgency === 'expired' ? 'text-gray-500' : 'text-amber-500'}`}>
        <Icon className={`${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'}`} />
        {isExpired ? (
          <span className="font-medium">Expired</span>
        ) : (
          <span className="font-mono font-bold">{formatTime(timeRemaining)}</span>
        )}
      </span>
    );
  }

  // Card variant
  return (
    <div className={`rounded-xl p-4 ${urgency === 'expired' ? 'bg-gray-50 border border-gray-200' : urgency === 'critical' ? 'bg-red-50 border border-red-200' : urgency === 'warning' ? 'bg-amber-50 border border-amber-200' : 'bg-amber-50/50 border border-amber-100'}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${urgency === 'expired' ? 'bg-gray-100' : urgency === 'critical' ? 'bg-red-100' : 'bg-amber-100'}`}>
          <Icon className={`w-5 h-5 ${urgency === 'expired' ? 'text-gray-500' : urgency === 'critical' ? 'text-red-600' : 'text-amber-600'}`} />
        </div>
        <div className="flex-1">
          <p className={`text-sm font-medium ${urgency === 'expired' ? 'text-gray-600' : urgency === 'critical' ? 'text-red-700' : 'text-amber-700'}`}>
            {isExpired ? 'Hold Expired' : 'Payment Required'}
          </p>
          {!isExpired && (
            <p className={`text-2xl font-bold font-mono ${urgency === 'critical' ? 'text-red-600' : urgency === 'warning' ? 'text-amber-600' : 'text-amber-500'}`}>
              {formatTime(timeRemaining)}
            </p>
          )}
          {isExpired && (
            <p className="text-sm text-gray-500">This booking has expired and needs to be renewed or cancelled.</p>
          )}
        </div>
      </div>
      {!isExpired && urgency === 'critical' && (
        <p className="mt-2 text-xs text-red-600 font-medium">
          Booking will be automatically cancelled if payment is not received!
        </p>
      )}
    </div>
  );
};

// Component to display hold status badge
interface HoldStatusBadgeProps {
  status: string;
  isHold?: boolean;
  holdExpiresAt?: string;
  paymentStatus?: string;
}

export const HoldStatusBadge: React.FC<HoldStatusBadgeProps> = ({
  status,
  isHold,
  holdExpiresAt,
  paymentStatus,
}) => {
  // If it's a hold booking with expiry time, show the timer
  if ((isHold || status === 'hold') && holdExpiresAt) {
    return <HoldTimer holdExpiresAt={holdExpiresAt} size="sm" variant="badge" showLabel={false} />;
  }

  // Standard status badges
  const statusConfig: Record<string, { label: string; className: string; icon?: React.ReactNode }> = {
    hold: { label: 'On Hold', className: 'bg-amber-100 text-amber-700 border-amber-200', icon: <Clock className="w-3 h-3" /> },
    pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    confirmed: { label: 'Confirmed', className: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle className="w-3 h-3" /> },
    cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700 border-red-200', icon: <XCircle className="w-3 h-3" /> },
    completed: { label: 'Completed', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    expired: { label: 'Expired', className: 'bg-gray-100 text-gray-600 border-gray-200', icon: <XCircle className="w-3 h-3" /> },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

export default HoldTimer;
