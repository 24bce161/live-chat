import React from 'react';

const Avatar = ({ src, name, size = 'md', isOnline, showStatus = false }) => {
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const sizeClass = size === 'sm' ? 'avatar-sm' : size === 'lg' ? 'avatar-lg' : '';

  return (
    <div className="relative inline-block">
      {src ? (
        <img src={src} alt={name} className={`avatar ${sizeClass}`} />
      ) : (
        <div className={`avatar ${sizeClass}`}>{getInitials(name)}</div>
      )}
      {showStatus && (
        <span className={`status-dot ${isOnline ? 'online' : 'offline'}`}></span>
      )}
    </div>
  );
};

export default Avatar;
