import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import api from '../../services/api';
import Avatar from '../common/Avatar';
import { useDebounce } from '../../hooks/useDebounce';
import { useChatContext } from '../../contexts/ChatContext';

const NewGroupModal = ({ onClose }) => {
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const debouncedQuery = useDebounce(query, 500);
  const { createConversation, setActiveConversation } = useChatContext();

  useEffect(() => {
    if (debouncedQuery.trim()) {
      api.get(`/users/search?q=${debouncedQuery}`).then(res => setUsers(res.data)).catch(console.error);
    } else {
      setUsers([]);
    }
  }, [debouncedQuery]);

  const toggleUser = (user) => {
    if (selectedUsers.find(u => u._id === user._id)) {
      setSelectedUsers(prev => prev.filter(u => u._id !== user._id));
    } else {
      setSelectedUsers(prev => [...prev, user]);
    }
  };

  const handleCreate = async () => {
    if (!name.trim() || selectedUsers.length === 0) return;
    try {
      const conv = await createConversation(selectedUsers.map(u => u._id), 'group', name);
      setActiveConversation(conv);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal flex flex-col h-[600px]">
        <div className="flex-between p-4 border-b border-[var(--border-color)]">
          <h3 className="font-semibold text-lg">Create Group</h3>
          <button onClick={onClose} className="btn-icon btn-ghost"><X size={20} /></button>
        </div>
        <div className="p-4 border-b border-[var(--border-color)] space-y-4">
          <input 
            type="text" 
            placeholder="Group Name" 
            className="input"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input 
              type="text" 
              placeholder="Search participants..." 
              className="input pl-10"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map(su => (
                <div key={su._id} className="flex items-center gap-1 bg-accent-light text-accent-solid px-2 py-1 rounded-full text-xs font-medium">
                  {su.name}
                  <button onClick={() => toggleUser(su)} className="hover:text-red-500"><X size={12} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {users.map(u => (
            <div 
              key={u._id} 
              className="flex items-center gap-3 p-3 hover:bg-[var(--bg-hover)] rounded-md cursor-pointer"
              onClick={() => toggleUser(u)}
            >
              <input 
                type="checkbox" 
                readOnly 
                checked={!!selectedUsers.find(su => su._id === u._id)} 
                className="w-4 h-4 rounded text-[var(--accent-solid)] focus:ring-[var(--accent-solid)]"
              />
              <Avatar name={u.name} />
              <div>
                <p className="font-medium text-sm text-primary">{u.name}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-[var(--border-color)] flex justify-end gap-2">
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button 
            onClick={handleCreate} 
            disabled={!name.trim() || selectedUsers.length === 0}
            className="btn btn-primary"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewGroupModal;
