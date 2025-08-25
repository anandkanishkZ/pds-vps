import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeToggleProps { className?: string; }

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  const base = 'p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 ring-1 ring-white/15 hover:ring-white/30 transition-colors duration-200 backdrop-blur';

  return (
    <button
      onClick={toggleTheme}
      className={`${base} ${className}`}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </button>
  );
};

export default ThemeToggle;
