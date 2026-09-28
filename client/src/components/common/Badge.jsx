import React from 'react';

const Badge = ({ count }) => {
  if (!count || count <= 0) return null;
  const displayCount = count > 99 ? '99+' : count;
  
  return (
    <span className="badge">
      {displayCount}
    </span>
  );
};

export default Badge;
