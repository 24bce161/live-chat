import React from 'react';
import { ChevronLeft, Info, Users } from 'lucide-react';
import Avatar from '../common/Avatar';
import { useAuth } from '../../contexts/AuthContext';
import { formatLastSeen } from '../../utils/formatDate';

const ChatHeader = ({ conversation, onlineUsers, typingUsers, onBack }) => {
  const { user } = useAuth();
  
  const isGroup = conversation.type === 'group';
  const userId = user?._id || user?.id;
  const otherParticipant = conversation.participants?.find(p => (p._id || p.id) !== userId);
  const name = isGroup ? conversation.name : otherParticipant?.name;
  const isOnline = isGroup ? false : onlineUsers[otherParticipant?._id || otherParticipant?.id];
  
  const activeTyping = typingUsers[conversation._id] || [];
  
  let statusText = '';
  if (activeTyping.length > 0) {
    statusText = 'typing...';
  } else if (isGroup) {
    statusText = `${conversation.participants.length} participants`;
  } else if (isOnline) {
    statusText = 'Online';
  } else {
    // Note: Would need lastSeen from user object in a real app
    statusText = 'Offline'; 
  }

  return (
    <div className="h-16 border-b border-[var(--glass-border)] bg-glass flex-between px-4 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button className="md:hidden btn-icon btn-ghost" onClick={onBack}>
          <ChevronLeft size={24} />
        </button>
        
        {isGroup ? (
          <div className="avatar avatar-sm bg-gradient-to-br from-blue-500 to-indigo-600">
            <Users size={18} />
          </div>
        ) : (
          <Avatar name={name} size="sm" isOnline={isOnline} showStatus={true} />
        )}
        
        <div>
          <h2 className="font-semibold text-sm text-primary leading-tight">{name}</h2>
          <p className={`text-xs ${activeTyping.length > 0 ? 'text-[var(--accent-solid)] font-medium animate-pulse' : 'text-secondary'}`}>
            {statusText}
          </p>
        </div>
      </div>
      
      <button 
        className="btn-icon btn-ghost text-secondary hover:text-primary transition-colors"
        onClick={() => {
          if (isGroup) {
            alert(`Group Name: ${name}\nParticipants: ${conversation.participants.length}`);
          } else {
            alert(`Contact Info\n\nName: ${name}\nEmail: ${otherParticipant?.email || 'N/A'}\nStatus: ${statusText}`);
          }
        }}
      >
        <Info size={22} />
      </button>
    </div>
  );
};

export default ChatHeader;
