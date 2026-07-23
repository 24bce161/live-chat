import React, { useState } from 'react';
import { Menu, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import DarkModeToggle from './DarkModeToggle';
import Avatar from '../common/Avatar';

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="glass h-16 flex-between px-4 sticky top-0 z-30 border-b border-[var(--glass-border)]">
      <div className="flex items-center gap-3">
        <button className="btn-icon btn-ghost md:hidden" onClick={onMenuClick}>
          <Menu size={24} />
        </button>
        <h1 className="text-xl font-bold text-white drop-shadow-md">
          LiveChat
        </h1>
      </div>

      <div className="flex items-center gap-3 relative">
        <DarkModeToggle />
        
        <button 
          className="flex items-center gap-2 btn-ghost rounded-full p-1 pl-2"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <span className="text-sm font-medium hidden sm:block">{user?.name}</span>
          <Avatar name={user?.name} size="sm" isOnline={true} showStatus={true} />
        </button>

        {showDropdown && (
          <div className="absolute right-0 top-12 w-48 glass-card py-2 animate-slide-up z-50">
            <div className="px-4 py-3 border-b border-[var(--border-color)]">
              <p className="font-semibold text-sm truncate">{user?.name}</p>
              <p className="text-xs text-muted truncate">{user?.email}</p>
              {user?.connectionCode && (
                <div className="mt-3 pt-3 border-t border-[var(--border-light)] flex flex-col gap-1">
                  <span className="text-[10px] text-secondary uppercase tracking-wider font-semibold">Connection Code</span>
                  <div className="flex items-center justify-between bg-[var(--bg-hover)] px-2 py-1.5 rounded border border-[var(--border-color)]">
                    <span className="font-mono text-sm font-bold tracking-widest text-[var(--accent-solid)]">{user.connectionCode}</span>
                  </div>
                </div>
              )}
            </div>
            <button 
              className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--bg-hover)] flex items-center gap-2"
              onClick={() => {
                setShowDropdown(false);
                alert('Settings configuration is coming in the next update!');
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
    </header>
  );
};

export default Header;
