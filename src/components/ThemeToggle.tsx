import React, { useId } from 'react';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  onToggle: () => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onToggle }) => {
  const inputId = useId();
  const isDark = theme === 'dark';

  return (
    <div className="relative inline-flex h-[27px] w-[54px] shrink-0 items-center justify-center">
      <div className="origin-center scale-[0.45]">
        <input
          id={inputId}
          type="checkbox"
          className="theme-switch-checkbox"
          checked={isDark}
          onChange={onToggle}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        />
        <label
          htmlFor={inputId}
          className="theme-switch-label"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        />
      </div>
    </div>
  );
};
