import React, { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import ConnectionCode from '../common/ConnectionCode';
import { useAuth } from '../../contexts/AuthContext';
import { MAX_FILE_SIZE } from '../../utils/constants';
import { getErrorMessage } from '../../utils/chatHelpers';

/**
 * Edit your profile: username and profile photo.
 * Uses PUT /api/users/profile and the existing /api/upload endpoint.
 */
const SettingsModal = ({ onClose }) => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Image must be under 10MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload', formData);
      setAvatarUrl(res.data.url);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Upload failed'));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Only send the name if it changed (older accounts may have names the new rules don't allow)
      const body = { avatarUrl };
      if (name.trim() !== user.name) body.name = name.trim();

      const res = await api.put('/users/profile', body);
      updateUser(res.data.user);
      toast.success('Profile saved');
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save your profile'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Settings" onClose={onClose}>
      <form onSubmit={handleSave} className="p-6 space-y-5">
        <div className="flex items-center gap-4">
          <Avatar src={avatarUrl} name={name} size="lg" />
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-secondary text-sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Camera size={16} /> {uploading ? 'Uploading...' : 'Change photo'}
            </button>
            {avatarUrl && (
              <button type="button" className="btn btn-ghost text-sm" onClick={() => setAvatarUrl('')}>
                Remove
              </button>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleAvatarChange}
          />
        </div>

        <div>
          <label htmlFor="settings-username" className="block text-sm font-medium mb-1 ml-1">Username</label>
          <input
            id="settings-username"
            type="text"
            required
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <p className="text-xs text-muted mt-1 ml-1">Other people see this name, and you use it to log in.</p>
        </div>

        <div>
          <p className="block text-sm font-medium mb-1 ml-1">Email</p>
          <p className="text-sm text-secondary ml-1">{user.email}</p>
        </div>

        <ConnectionCode code={user.connectionCode} />

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving || uploading || !name.trim()}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default SettingsModal;
