import React from 'react';
import { clsx } from 'clsx';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  className
}: SwitchProps) {
  const sizeClasses = {
    sm: {
      track: 'h-4 w-7',
      thumb: 'h-3 w-3',
      translate: checked ? 'translate-x-3' : 'translate-x-0.5'
    },
    md: {
      track: 'h-6 w-11',
      thumb: 'h-4 w-4',
      translate: checked ? 'translate-x-6' : 'translate-x-1'
    },
    lg: {
      track: 'h-7 w-12',
      thumb: 'h-5 w-5',
      translate: checked ? 'translate-x-6' : 'translate-x-1'
    }
  };

  const currentSize = sizeClasses[size];

  const trackClasses = clsx(
    'relative inline-flex items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    currentSize.track,
    {
      'bg-blue-600': checked && !disabled,
      'bg-gray-200': !checked && !disabled,
      'bg-gray-100 cursor-not-allowed': disabled,
      'cursor-pointer': !disabled
    }
  );

  const thumbClasses = clsx(
    'inline-block rounded-full bg-white shadow transform transition-transform',
    currentSize.thumb,
    currentSize.translate
  );

  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleClick();
    }
  };

  if (label || description) {
    return (
      <div className={clsx('flex items-start space-x-3', className)}>
        <button
          type="button"
          className={trackClasses}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          role="switch"
          aria-checked={checked}
          aria-label={label}
        >
          <span className={thumbClasses} />
        </button>
        
        <div className="flex-1">
          {label && (
            <div className={clsx('font-medium', {
              'text-gray-900': !disabled,
              'text-gray-400': disabled
            })}>
              {label}
            </div>
          )}
          {description && (
            <div className={clsx('text-sm mt-1', {
              'text-gray-500': !disabled,
              'text-gray-400': disabled
            })}>
              {description}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={clsx(trackClasses, className)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      role="switch"
      aria-checked={checked}
    >
      <span className={thumbClasses} />
    </button>
  );
}