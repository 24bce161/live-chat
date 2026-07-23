import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import api from '../../services/api';
import Avatar from '../common/Avatar';
import { useDebounce } from '../../hooks/useDebounce';
import { useChatContext } from '../../contexts/ChatContext';

const UserSearch = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const debouncedQuery = useDebounce(query, 500);
  const { createConversation, setActiveConversation } = useChatContext();

  useEffect(() => {
    if (debouncedQuery.trim()) {
      api.get(`/users/search?q=${debouncedQuery}`).then(res => setUsers(res.data)).catch(console.error);
    } else {
      setUsers([]);
    }
  }, [debouncedQuery]);

  const handleSelectUser = async (user) => {
    try {
      const conv = await createConversation([user._id], 'direct');
      setActiveConversation(conv);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal flex flex-col h-auto max-h-[80vh]">
        <div className="flex items-center justify-center p-4 border-b border-[var(--border-color)] relative">
          <h3 className="font-semibold text-lg">New Chat</h3>
          <button onClick={onClose} className="btn-icon btn-ghost absolute right-4"><X size={20} /></button>
        </div>
        <div className="p-4 border-b border-[var(--border-color)] relative">
          <input 
            type="text" 
            placeholder="Enter 6-character connection code..." 
            className="input pr-10 pl-4 uppercase font-mono font-bold tracking-widest text-center"
            value={query}
            maxLength={6}
            onChange={e => setQuery(e.target.value.toUpperCase())}
            autoFocus
          />
          <Search size={18} className="absolute right-7 top-1/2 -translate-y-1/2 text-muted" />
        </div>
        <div className="overflow-y-auto p-2 pb-10">
          {users.map(u => (
            <div 
              key={u._id} 
              className="flex items-center gap-3 p-3 hover:bg-[var(--bg-hover)] rounded-md cursor-pointer"
              onClick={() => handleSelectUser(u)}
            >
              <Avatar name={u.name} />
              <div>
                <p className="font-medium text-sm text-primary">{u.name}</p>
                <p className="text-xs text-secondary">{u.email}</p>
              </div>
            </div>
          ))}
          {query.length === 6 && users.length === 0 && (
            <p className="text-center text-muted my-4 text-sm">No user found with this code</p>
          )}
          {query.length < 6 && (
            <p className="text-center text-muted my-4 text-sm">Enter exactly 6 characters to search</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSearch;
