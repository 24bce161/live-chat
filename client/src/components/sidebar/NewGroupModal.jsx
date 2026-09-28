import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Avatar from '../common/Avatar';
import Modal from '../common/Modal';
import { useDebounce } from '../../hooks/useDebounce';
import { useAuth } from '../../contexts/AuthContext';
import { useChatContext } from '../../contexts/ChatContext';
import { getOtherParticipant, getErrorMessage } from '../../utils/chatHelpers';

const NewGroupModal = ({ onClose }) => {
  const { user } = useAuth();
  const { conversations, createConversation, openConversation } = useChatContext();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [codeResult, setCodeResult] = useState(null); // person found by connection code
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [creating, setCreating] = useState(false);
  const debouncedCode = useDebounce(code, 400);

  // People you already have a direct chat with can be picked straight away
  const contacts = conversations
    .filter(c => c.type === 'direct')
    .map(c => getOtherParticipant(c, user?._id))
    .filter(Boolean);

  // Anyone else can be added by their connection code
  useEffect(() => {
    if (debouncedCode.length !== 6) {
      setCodeResult(null);
      return;
    }
    api.get('/users/search', { params: { q: debouncedCode } })
      .then(res => setCodeResult(res.data[0] || null))
      .catch(() => setCodeResult(null));
  }, [debouncedCode]);

  const people = codeResult && !contacts.some(c => c._id === codeResult._id)
    ? [codeResult, ...contacts]
    : contacts;

  const isSelected = (person) => selectedUsers.some(u => u._id === person._id);

  const toggleUser = (person) => {
    if (isSelected(person)) {
      setSelectedUsers(prev => prev.filter(u => u._id !== person._id));
    } else {
      setSelectedUsers(prev => [...prev, person]);
    }
  };

  const handleCreate = async () => {
    if (!name.trim() || selectedUsers.length === 0) return;
    setCreating(true);
    try {
      const conv = await createConversation(selectedUsers.map(u => u._id), 'group', name.trim());
      openConversation(conv._id);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not create the group'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal
      title="Create Group"
      onClose={onClose}
      className="h-[600px]"
      footer={
        <>
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || selectedUsers.length === 0 || creating}
            className="btn btn-primary"
          >
            Create
          </button>
        </>
      }
    >
      <div className="p-4 border-b border-[var(--border-color)] space-y-4">
        <input
          type="text"
          placeholder="Group Name"
          aria-label="Group name"
          maxLength={50}
          className="input"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Add someone by connection code"
          aria-label="Connection code"
          maxLength={6}
          className="input uppercase font-mono tracking-widest"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
        />
        {selectedUsers.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map(su => (
              <div key={su._id} className="flex items-center gap-1 bg-[var(--accent-light)] text-[var(--accent-solid)] px-2 py-1 rounded-full text-xs font-medium">
                {su.name}
                <button onClick={() => toggleUser(su)} className="hover:text-red-500" aria-label={`Remove ${su.name}`}><X size={12} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {code.length === 6 && debouncedCode === code && !codeResult && (
          <p className="text-center text-muted my-2 text-sm">No user found with this code</p>
        )}
        {people.length === 0 ? (
          <p className="text-center text-muted my-4 text-sm">
            Enter a friend's connection code to add them.
          </p>
        ) : (
          <>
            <p className="px-3 pt-1 pb-2 text-[10px] text-secondary uppercase tracking-wider font-semibold">Pick members</p>
            {people.map(u => (
              <label
                key={u._id}
                className="flex items-center gap-3 p-3 hover:bg-[var(--bg-hover)] rounded-md cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={isSelected(u)}
                  onChange={() => toggleUser(u)}
                  className="w-4 h-4 rounded accent-[var(--accent-solid)]"
                />
                <Avatar src={u.avatarUrl} name={u.name} />
                <p className="font-medium text-sm text-primary">{u.name}</p>
              </label>
            ))}
          </>
        )}
      </div>
    </Modal>
  );
};

export default NewGroupModal;
