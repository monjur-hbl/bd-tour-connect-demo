import React from 'react';
import { Card } from './Card';

interface StatCardProps {
  title: string;
  titleBn?: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  titleBn,
  value,
  icon,
  trend,
  color = 'primary'
}) => {
  const colors = {
    primary: 'bg-primary-50 text-primary-600',
    secondary: 'bg-secondary-50 text-secondary-600',
    accent: 'bg-accent-50 text-accent-600',
    success: 'bg-green-50 text-green-600',
    warning: 'bg-amber-50 text-amber-600'
  };

  return (
    <Card hover className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sand-500 text-sm font-medium mb-1">
            {title}
            {titleBn && <span className="font-bengali ml-1">({titleBn})</span>}
          </p>
          <p className="text-3xl font-bold text-sand-800">{value}</p>
          {trend && (
            <p className={`text-sm mt-2 ${trend.isPositive ? 'text-green-600' : 'text-danger-500'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% from last week
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
};
