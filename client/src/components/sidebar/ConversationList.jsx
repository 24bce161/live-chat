import React, { useState } from 'react';
import { Search, Plus, Users } from 'lucide-react';
import ConversationItem from './ConversationItem';
import { useAuth } from '../../contexts/AuthContext';
import { useChatContext } from '../../contexts/ChatContext';
import { useSocketContext } from '../../contexts/SocketContext';
import { getConversationName } from '../../utils/chatHelpers';
import ConnectionCode from '../common/ConnectionCode';
import UserSearch from './UserSearch';
import NewGroupModal from './NewGroupModal';

const ConversationList = () => {
  const { user } = useAuth();
  const { conversations, activeConversation, openConversation } = useChatContext();
  const { onlineUsers } = useSocketContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);

  // Search by the name shown in the list (the OTHER person for direct chats, not me)
  const filteredConversations = conversations.filter(c => {
    if (!searchTerm) return true;
    return getConversationName(c, user?._id).toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="p-4 border-b border-[var(--border-light)]">
        <div className="flex gap-2 mb-4">
          <button
            className="flex-1 btn btn-secondary text-sm"
            onClick={() => setShowUserSearch(true)}
          >
            <Plus size={16} /> New Chat
          </button>
          <button
            className="flex-1 btn btn-secondary text-sm"
            onClick={() => setShowGroupModal(true)}
          >
            <Users size={16} /> New Group
          </button>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations..."
            aria-label="Search conversations"
            className="input pr-10 pl-4"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          // First-time user: explain how to get started
          <div className="p-6 text-center text-sm space-y-4">
            <p className="text-secondary">
              No chats yet. Tap <strong>New Chat</strong> and enter a friend's code, or share yours so they can add you.
            </p>
            <ConnectionCode code={user?.connectionCode} />
          </div>
        ) : filteredConversations.length > 0 ? (
          filteredConversations.map(conv => (
            <ConversationItem
              key={conv._id}
              conversation={conv}
              isActive={activeConversation?._id === conv._id}
              onlineUsers={onlineUsers}
              onClick={() => openConversation(conv._id)}
            />
          ))
        ) : (
          <div className="p-6 text-center text-secondary text-sm">
            No conversations match "{searchTerm}".
          </div>
        )}
      </div>

      {showUserSearch && <UserSearch onClose={() => setShowUserSearch(false)} />}
      {showGroupModal && <NewGroupModal onClose={() => setShowGroupModal(false)} />}
    </div>
  );
};

export default ConversationList;
