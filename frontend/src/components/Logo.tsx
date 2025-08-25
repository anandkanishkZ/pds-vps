import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
// Using public root paths instead of importing from public folder (Vite recommendation)
const logoDefault = '/images/logo.png';
const logoWhite = '/images/logo-white.png';
const logoBlack = '/images/logo-black.png';

interface LogoProps {
  className?: string;
  withTagline?: boolean; // controls tagline visibility (only if showText true)
  showText?: boolean; // new: show/hide the brand name + tagline block entirely
  size?: 'sm' | 'md' | 'lg';
  /**
   * variant:
   *  - auto (default): chooses white in dark mode, black in light mode (fallback to default)
   *  - color: always use the colorful primary logo (logo.png)
   *  - white: force white logo
   *  - black: force black logo
   */
  variant?: 'auto' | 'color' | 'white' | 'black';
  /** Provide a solid text color (e.g. '#fec216') to replace the gradient */
  plainColor?: string;
  /** Override color of the tagline text */
  taglineColor?: string;
}

const sizeMap = {
  sm: { img: 'h-8 w-auto', text: 'text-base' },
  md: { img: 'h-12 w-auto', text: 'text-lg' },
  lg: { img: 'h-12 w-auto', text: 'text-xl' },
};

const Logo: React.FC<LogoProps> = ({ className = '', withTagline = true, showText = true, size = 'md', variant = 'auto', plainColor, taglineColor }) => {
  const { theme } = useTheme();
  const sizeCfg = sizeMap[size];

  // Determine selected logo based on variant & theme
  let selected: string;
  if (variant === 'color') {
    selected = logoDefault;
  } else if (variant === 'white') {
    selected = logoWhite;
  } else if (variant === 'black') {
    selected = logoBlack;
  } else {
    // auto
    selected = theme === 'dark' ? logoWhite : (logoBlack || logoDefault);
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>      
      <img
        src={selected}
        alt="Power Drive Solution Logo"
        className={`${sizeCfg.img} object-contain drop-shadow-sm`}
        loading="lazy"
      />
      {showText && (
        <div className="flex flex-col">
          <span
            className={`font-bold tracking-tight ${plainColor ? '' : 'bg-clip-text text-transparent bg-brand-gradient'} ${sizeCfg.text}`}
            style={plainColor ? { color: plainColor } : undefined}
          >
            Power Drive Solution
          </span>
          {withTagline && (
            <span
              className={`text-[10px] md:text-xs font-medium -mt-0.5 ${taglineColor ? '' : 'text-gray-500 dark:text-gray-400'}`}
              style={taglineColor ? { color: taglineColor } : undefined}
            >
              Your Drive, Our Support
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
