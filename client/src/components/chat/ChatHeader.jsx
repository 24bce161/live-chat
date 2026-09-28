import React, { useState } from 'react';
import { ChevronLeft, Info, Users } from 'lucide-react';
import Avatar from '../common/Avatar';
import ConversationInfoModal from './ConversationInfoModal';
import { useAuth } from '../../contexts/AuthContext';
import { useSocketContext } from '../../contexts/SocketContext';
import { formatLastSeen } from '../../utils/formatDate';
import { getOtherParticipant, getConversationName } from '../../utils/chatHelpers';

const ChatHeader = ({ conversation, typingUsers, onBack }) => {
  const { user } = useAuth();
  const { onlineUsers, lastSeen } = useSocketContext();
  const [showInfo, setShowInfo] = useState(false);

  const isGroup = conversation.type === 'group';
  const otherParticipant = isGroup ? null : getOtherParticipant(conversation, user?._id);
  const name = getConversationName(conversation, user?._id);
  const isOnline = !!otherParticipant && !!onlineUsers[otherParticipant._id];

  const activeTyping = typingUsers[conversation._id] || [];

  let statusText = '';
  if (activeTyping.length > 0) {
    statusText = isGroup ? `${activeTyping[0].userName} is typing...` : 'typing...';
  } else if (isGroup) {
    statusText = `${conversation.participants.length} members`;
  } else if (isOnline) {
    statusText = 'Online';
  } else {
    // Live value if they went offline while we're here, otherwise the one saved on the server
    statusText = formatLastSeen(lastSeen[otherParticipant?._id] || otherParticipant?.lastSeen);
  }

  return (
    <div className="h-16 border-b border-[var(--glass-border)] bg-glass flex-between px-4 sticky top-0 z-20">
      <div className="flex items-center gap-3 min-w-0">
        <button className="md:hidden btn-icon btn-ghost" onClick={onBack} aria-label="Back to chats">
          <ChevronLeft size={24} />
        </button>

        {isGroup ? (
          <div className="avatar avatar-sm bg-gradient-to-br from-blue-500 to-indigo-600">
            <Users size={18} />
          </div>
        ) : (
          <Avatar src={otherParticipant?.avatarUrl} name={name} size="sm" isOnline={isOnline} showStatus={true} />
        )}

        <div className="min-w-0">
          <h2 className="font-semibold text-sm text-primary leading-tight truncate">{name}</h2>
          <p className={`text-xs truncate ${activeTyping.length > 0 ? 'text-[var(--accent-solid)] font-medium animate-pulse' : 'text-secondary'}`}>
            {statusText}
          </p>
        </div>
      </div>

      <button
        className="btn-icon btn-ghost text-secondary hover:text-primary transition-colors"
        onClick={() => setShowInfo(true)}
        aria-label={isGroup ? 'Group info' : 'Contact info'}
        title={isGroup ? 'Group info' : 'Contact info'}
      >
        <Info size={22} />
      </button>

      {showInfo && (
        <ConversationInfoModal conversation={conversation} onClose={() => setShowInfo(false)} />
      )}
    </div>
  );
};

export default ChatHeader;
