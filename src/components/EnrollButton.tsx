import React from 'react';
import { ArrowRight } from 'lucide-react';
import './EnrollButton.css';

interface EnrollButtonProps {
  label?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  fullWidth?: boolean;
  compact?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const EnrollButton: React.FC<EnrollButtonProps> = ({
  label = 'Enroll Now',
  onClick,
  fullWidth = false,
  compact = false,
  className = '',
  type = 'button',
}) => {
  const sizingClasses = compact
    ? 'text-xs sm:text-sm font-semibold !py-2 !px-4 w-auto'
    : `text-sm sm:text-base font-semibold !py-2.5 !px-5 ${
        fullWidth ? 'w-full sm:w-full' : 'w-full sm:w-auto'
      }`;

  return (
    <button
      type={type}
      onClick={onClick}
      className={`enroll-neon-btn active:scale-95 transition-transform duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${sizingClasses} ${className}`}
    >
      <span>
        {label}
        <ArrowRight className="h-4 w-4 shrink-0" />
      </span>
    </button>
  );
};
