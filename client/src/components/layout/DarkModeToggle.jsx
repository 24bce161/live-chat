import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const DarkModeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button 
      onClick={toggleTheme} 
      className="btn-icon btn-ghost flex-center"
      aria-label="Toggle dark mode"
    >
      {theme === 'dark' ? (
        <Sun size={20} className="animate-spin-once" style={{ animationIterationCount: 1, animationDuration: '0.5s' }} />
      ) : (
        <Moon size={20} className="animate-spin-once" style={{ animationIterationCount: 1, animationDuration: '0.5s' }} />
      )}
    </button>
  );
};

export default DarkModeToggle;
