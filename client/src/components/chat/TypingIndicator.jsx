import React from 'react';

const TypingIndicator = ({ typingUsers, conversationId }) => {
  const users = typingUsers[conversationId] || [];
  
  if (users.length === 0) return null;

  const names = users.map(u => u.userName || 'Someone').join(', ');
  const text = users.length > 1 ? `${names} are typing...` : `${names} is typing...`;

  return (
    <div className="flex items-center gap-2 p-2 px-4 animate-slide-up text-sm text-secondary">
      <span className="font-medium text-[var(--accent-solid)]">{text}</span>
      <div className="typing-dots">
        <span></span><span></span><span></span>
      </div>
    </div>
  );
};

export default TypingIndicator;
