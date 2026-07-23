import React, { useState } from 'react';
import { Search, Plus, Users } from 'lucide-react';
import ConversationItem from './ConversationItem';
import { useChatContext } from '../../contexts/ChatContext';
import { useSocketContext } from '../../contexts/SocketContext';
import UserSearch from './UserSearch';
import NewGroupModal from './NewGroupModal';

const ConversationList = () => {
  const { conversations, activeConversation, setActiveConversation, unreadCounts } = useChatContext();
  const { onlineUsers } = useSocketContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);

  const filteredConversations = conversations.filter(c => {
    if (!searchTerm) return true;
    const displayName = c.type === 'group' ? c.name : c.participants?.find(p => true)?.name || '';
    return displayName.toLowerCase().includes(searchTerm.toLowerCase());
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
            className="input pr-10 pl-4"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length > 0 ? (
          filteredConversations.map(conv => (
            <ConversationItem 
              key={conv._id}
              conversation={conv}
              isActive={activeConversation?._id === conv._id}
              unreadCount={unreadCounts[conv._id] || 0}
              onlineUsers={onlineUsers}
              onClick={() => setActiveConversation(conv)}
            />
          ))
        ) : (
          <div className="p-6 text-center text-secondary text-sm">
            No conversations found.
          </div>
        )}
      </div>

      {showUserSearch && <UserSearch onClose={() => setShowUserSearch(false)} />}
      {showGroupModal && <NewGroupModal onClose={() => setShowGroupModal(false)} />}
    </div>
  );
};

export default ConversationList;
