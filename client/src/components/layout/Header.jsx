import React, { useState, useRef, useEffect } from 'react';
import { LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import DarkModeToggle from './DarkModeToggle';
import Avatar from '../common/Avatar';
import ConnectionCode from '../common/ConnectionCode';
import SettingsModal from './SettingsModal';

const Header = () => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const menuRef = useRef(null);

  // Close the menu when clicking anywhere outside it
  useEffect(() => {
    if (!showDropdown) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  return (
    <header className="glass h-16 flex-between px-4 sticky top-0 z-40 border-b border-[var(--glass-border)]">
      <h1 className="text-xl font-bold text-white drop-shadow-md">
        LiveChat
      </h1>

      <div className="flex items-center gap-3 relative" ref={menuRef}>
        <DarkModeToggle />

        <button
          className="flex items-center gap-2 btn-ghost rounded-full p-1 pl-2"
          onClick={() => setShowDropdown(!showDropdown)}
          aria-label="Account menu"
          aria-expanded={showDropdown}
        >
          <span className="text-sm font-medium hidden sm:block">{user?.name}</span>
          <Avatar src={user?.avatarUrl} name={user?.name} size="sm" isOnline={true} showStatus={true} />
        </button>

        {showDropdown && (
          <div className="absolute right-0 top-12 w-56 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-lg py-2 animate-slide-up z-50">
            <div className="px-4 py-3 border-b border-[var(--border-color)]">
              <p className="font-semibold text-sm truncate">{user?.name}</p>
              <p className="text-xs text-muted truncate">{user?.email}</p>
              <div className="mt-3 pt-3 border-t border-[var(--border-light)]">
                <ConnectionCode code={user?.connectionCode} />
              </div>
            </div>
            <button
              className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--bg-hover)] flex items-center gap-2"
              onClick={() => {
                setShowDropdown(false);
                setShowSettings(true);
              }}
            >
              <Settings size={16} />
              Settings
            </button>
            <button
              className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-[var(--bg-hover)] flex items-center gap-2"
              onClick={() => {
                setShowDropdown(false);
                logout();
              }}
            >
              <LogOut size={16} />
              Log out
            </button>
          </div>
        )}
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </header>
  );
};

export default Header;
