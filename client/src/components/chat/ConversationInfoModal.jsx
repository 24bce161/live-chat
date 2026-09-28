import React, { useState } from 'react';
import { Users, UserMinus, UserPlus, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useSocketContext } from '../../contexts/SocketContext';
import { useChatContext } from '../../contexts/ChatContext';
import { formatLastSeen } from '../../utils/formatDate';
import { getOtherParticipant, getConversationName, getErrorMessage } from '../../utils/chatHelpers';

/**
 * "Info" panel for the open chat.
 * Direct chat: the other person's details.
 * Group: member list; the admin can add (by connection code) and remove members,
 * everyone else can leave the group.
 */
const ConversationInfoModal = ({ conversation, onClose }) => {
  const { user } = useAuth();
  const { onlineUsers, lastSeen } = useSocketContext();
  const { replaceConversation, removeConversation } = useChatContext();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const myId = user?._id;
  const isGroup = conversation.type === 'group';
  const amAdmin = isGroup && conversation.admin === myId;
  const name = getConversationName(conversation, myId);

  const statusFor = (person) => {
    if (onlineUsers[person._id]) return 'Online';
    return formatLastSeen(lastSeen[person._id] || person.lastSeen);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (code.length !== 6) return;
    setBusy(true);
    try {
      const search = await api.get('/users/search', { params: { q: code } });
      const person = search.data[0];
      if (!person) {
        toast.error('No user found with this code');
        return;
      }
      const res = await api.put(`/conversations/${conversation._id}/participants`, { userId: person._id });
      replaceConversation(res.data);
      setCode('');
      toast.success(`${person.name} was added`);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not add member'));
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (person) => {
    if (!window.confirm(`Remove ${person.name} from the group?`)) return;
    try {
      const res = await api.delete(`/conversations/${conversation._id}/participants/${person._id}`);
      replaceConversation(res.data);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not remove member'));
    }
  };

  const handleLeave = async () => {
    if (!window.confirm(`Leave "${name}"?`)) return;
    try {
      await api.delete(`/conversations/${conversation._id}/participants/${myId}`);
      onClose();
      removeConversation(conversation._id);
      toast.success('You left the group');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not leave the group'));
    }
  };

  // ----- Direct chat -----
  if (!isGroup) {
    const other = getOtherParticipant(conversation, myId);
    return (
      <Modal title="Contact info" onClose={onClose}>
        <div className="p-6 flex flex-col items-center text-center gap-2">
          <Avatar src={other?.avatarUrl} name={name} size="lg" isOnline={!!onlineUsers[other?._id]} showStatus={true} />
          <p className="font-semibold text-lg text-primary">{name}</p>
          <p className="text-sm text-secondary">{other ? statusFor(other) : ''}</p>
        </div>
      </Modal>
    );
  }

  // ----- Group -----
  return (
    <Modal title="Group info" onClose={onClose} className="max-h-[85vh]">
      <div className="p-4 flex items-center gap-3 border-b border-[var(--border-color)]">
        <div className="avatar avatar-lg bg-gradient-to-br from-blue-500 to-indigo-600">
          <Users size={22} />
        </div>
        <div>
          <p className="font-semibold text-primary">{name}</p>
          <p className="text-sm text-secondary">{conversation.participants.length} members</p>
        </div>
      </div>

      {amAdmin && (
        <form onSubmit={handleAdd} className="p-4 border-b border-[var(--border-color)] flex gap-2">
          <input
            type="text"
            className="input uppercase font-mono tracking-widest"
            placeholder="Connection code"
            aria-label="Connection code of the person to add"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
          <button type="submit" className="btn btn-primary shrink-0" disabled={code.length !== 6 || busy}>
            <UserPlus size={16} /> Add
          </button>
        </form>
      )}

      <ul className="flex-1 overflow-y-auto p-2">
        {conversation.participants.map(person => {
          const isMe = person._id === myId;
          const isGroupAdmin = person._id === conversation.admin;
          return (
            <li key={person._id} className="flex items-center gap-3 p-2 rounded-md">
              <Avatar src={person.avatarUrl} name={person.name} isOnline={!!onlineUsers[person._id]} showStatus={true} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-primary truncate">
                  {person.name}{isMe && ' (you)'}
                  {isGroupAdmin && (
                    <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--accent-light)] text-[var(--accent-solid)]">Admin</span>
                  )}
                </p>
                <p className="text-xs text-secondary truncate">{statusFor(person)}</p>
              </div>
              {amAdmin && !isGroupAdmin && (
                <button
                  type="button"
                  onClick={() => handleRemove(person)}
                  className="btn-icon btn-ghost hover:text-red-500"
                  aria-label={`Remove ${person.name}`}
                  title="Remove from group"
                >
                  <UserMinus size={18} />
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {!amAdmin && (
        <div className="p-4 border-t border-[var(--border-color)]">
          <button type="button" onClick={handleLeave} className="btn btn-secondary w-full text-red-500">
            <LogOut size={16} /> Leave group
          </button>
        </div>
      )}
    </Modal>
  );
};

export default ConversationInfoModal;
