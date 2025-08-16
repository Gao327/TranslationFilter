import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse';
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

export default function Loading({
  size = 'md',
  variant = 'spinner',
  text,
  className,
  fullScreen = false
}: LoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const renderSpinner = () => (
    <Loader2 className={clsx('animate-spin text-blue-600', sizeClasses[size])} />
  );

  const renderDots = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={clsx(
            'bg-blue-600 rounded-full animate-pulse',
            {
              'w-1 h-1': size === 'sm',
              'w-1.5 h-1.5': size === 'md',
              'w-2 h-2': size === 'lg',
              'w-3 h-3': size === 'xl'
            }
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  );

  const renderPulse = () => (
    <div className={clsx('bg-blue-600 rounded-full animate-pulse', sizeClasses[size])} />
  );

  const renderVariant = () => {
    switch (variant) {
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      default:
        return renderSpinner();
    }
  };

  const content = (
    <div className={clsx('flex flex-col items-center justify-center space-y-2', className)}>
      {renderVariant()}
      {text && (
        <p className={clsx('text-gray-600 font-medium', textSizeClasses[size])}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
}

// Skeleton Loading Component
interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
}

export function Skeleton({ className, width, height, rounded = false }: SkeletonProps) {
  return (
    <div
      className={clsx(
        'bg-gray-200 animate-pulse',
        {
          'rounded': rounded,
          'rounded-md': !rounded
        },
        className
      )}
      style={{ width, height }}
    />
  );
}

// Loading Overlay Component
interface LoadingOverlayProps {
  loading: boolean;
  children: React.ReactNode;
  text?: string;
  className?: string;
}

export function LoadingOverlay({ loading, children, text, className }: LoadingOverlayProps) {
  return (
    <div className={clsx('relative', className)}>
      {children}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center rounded-lg">
          <Loading text={text} />
        </div>
      )}
    </div>
  );
}