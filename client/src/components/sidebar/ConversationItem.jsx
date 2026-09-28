import React from 'react';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
import { formatMessageTime, isToday, isYesterday } from '../../utils/formatDate';
import { useAuth } from '../../contexts/AuthContext';
import { getOtherParticipant, getConversationName } from '../../utils/chatHelpers';
import { Users } from 'lucide-react';

const ConversationItem = ({ conversation, isActive, onlineUsers, onClick }) => {
  const { user } = useAuth();

  const isGroup = conversation.type === 'group';
  const otherParticipant = isGroup ? null : getOtherParticipant(conversation, user?._id);
  const name = getConversationName(conversation, user?._id);
  const isOnline = !!otherParticipant && !!onlineUsers[otherParticipant._id];

  const lastMsg = conversation.lastMessage;
  const timeString = lastMsg ? (
    isToday(lastMsg.createdAt) ? formatMessageTime(lastMsg.createdAt) :
    isYesterday(lastMsg.createdAt) ? 'Yesterday' :
    new Date(lastMsg.createdAt).toLocaleDateString()
  ) : '';

  return (
    <button
      type="button"
      className={`conversation-item w-full text-left ${isActive ? 'active' : ''}`}
      onClick={onClick}
      aria-current={isActive ? 'true' : undefined}
    >
      {isGroup ? (
        <div className="avatar avatar-md bg-gradient-to-br from-blue-500 to-indigo-600">
          <Users size={20} />
        </div>
      ) : (
        <Avatar
          src={otherParticipant?.avatarUrl}
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
            {lastMsg?.text || 'No messages yet'}
          </p>
          <Badge count={conversation.unreadCount} />
        </div>
      </div>
    </button>
  );
};

export default ConversationItem;
