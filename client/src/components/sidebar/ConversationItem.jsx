import React from 'react';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
import { formatMessageTime, formatDateSeparator, isToday, isYesterday } from '../../utils/formatDate';
import { useAuth } from '../../contexts/AuthContext';
import { Users } from 'lucide-react';

const ConversationItem = ({ conversation, isActive, unreadCount, onlineUsers, onClick }) => {
  const { user } = useAuth();
  
  const isGroup = conversation.type === 'group';
  const userId = user?._id || user?.id;
  const otherParticipant = conversation.participants?.find(p => (p._id || p.id) !== userId);
  const name = isGroup ? conversation.name : otherParticipant?.name;
  const isOnline = isGroup ? false : onlineUsers[otherParticipant?._id || otherParticipant?.id];
  
  const lastMsg = conversation.lastMessage;
  const timeString = lastMsg ? (
    isToday(lastMsg.createdAt) ? formatMessageTime(lastMsg.createdAt) : 
    isYesterday(lastMsg.createdAt) ? 'Yesterday' : 
    new Date(lastMsg.createdAt).toLocaleDateString()
  ) : '';

  return (
    <div 
      className={`conversation-item ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      {isGroup ? (
        <div className="avatar avatar-md bg-gradient-to-br from-blue-500 to-indigo-600">
          <Users size={20} />
        </div>
      ) : (
        <Avatar 
          name={name} 
          isOnline={isOnline} 
          showStatus={true} 
        />
      )}
      
      <div className="flex-1 min-w-0">
        <div className="flex-between mb-1">
          <h4 className="font-semibold text-sm truncate pr-2 text-primary">{name}</h4>
          <span className="text-xs text-muted whitespace-nowrap">{timeString}</span>
        </div>
        
        <div className="flex-between">
          <p className="text-sm text-secondary truncate pr-4">
            {lastMsg?.text || (lastMsg?.attachmentUrl ? '📎 Attachment' : 'No messages yet')}
          </p>
          <Badge count={unreadCount} />
        </div>
      </div>
    </div>
  );
};

export default ConversationItem;
