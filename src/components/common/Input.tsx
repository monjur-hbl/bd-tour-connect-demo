import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelBn?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, labelBn, error, icon, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block mb-2">
            <span className="text-sand-700 font-medium">{label}</span>
            {labelBn && <span className="text-sand-500 font-bengali ml-2">({labelBn})</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-sand-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={clsx(
              'w-full px-4 py-3 border-2 rounded-xl text-sand-800 placeholder:text-sand-400',
              'focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 focus:outline-none',
              'transition-all duration-200',
              icon && 'pl-12',
              error ? 'border-danger-500' : 'border-sand-200',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-2 text-sm text-danger-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
