import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Avatar from '../common/Avatar';
import Modal from '../common/Modal';
import { useDebounce } from '../../hooks/useDebounce';
import { useChatContext } from '../../contexts/ChatContext';
import { getErrorMessage } from '../../utils/chatHelpers';

const UserSearch = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const debouncedQuery = useDebounce(query, 500);
  const { createConversation, openConversation } = useChatContext();

  useEffect(() => {
    if (debouncedQuery.length === 6) {
      api.get('/users/search', { params: { q: debouncedQuery } })
        .then(res => setUsers(res.data))
        .catch(() => setUsers([]));
    } else {
      setUsers([]);
    }
  }, [debouncedQuery]);

  const handleSelectUser = async (user) => {
    try {
      const conv = await createConversation([user._id], 'direct');
      openConversation(conv._id);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not start the chat'));
    }
  };

  return (
    <Modal title="New Chat" onClose={onClose} className="max-h-[80vh]">
      <div className="p-4 border-b border-[var(--border-color)] relative">
        <input
          type="text"
          placeholder="Enter 6-character connection code..."
          aria-label="Connection code"
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
          <button
            type="button"
            key={u._id}
            className="w-full text-left flex items-center gap-3 p-3 hover:bg-[var(--bg-hover)] rounded-md cursor-pointer"
            onClick={() => handleSelectUser(u)}
          >
            <Avatar src={u.avatarUrl} name={u.name} />
            <div>
              <p className="font-medium text-sm text-primary">{u.name}</p>
              <p className="text-xs text-secondary">Start a chat</p>
            </div>
          </button>
        ))}
        {query.length === 6 && debouncedQuery === query && users.length === 0 && (
          <p className="text-center text-muted my-4 text-sm">No user found with this code</p>
        )}
        {query.length < 6 && (
          <p className="text-center text-muted my-4 text-sm">Ask your friend for their code (it's in their profile menu)</p>
        )}
      </div>
    </Modal>
  );
};

export default UserSearch;
