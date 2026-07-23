import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X } from 'lucide-react';
import { useChatContext } from '../../contexts/ChatContext';
import { useTyping } from '../../hooks/useTyping';
import { useSocketContext } from '../../contexts/SocketContext';
import FilePreview from './FilePreview';
import api from '../../services/api';
import toast from 'react-hot-toast';

/**
 * Message input with auto-growing textarea, file attachment, and typing indicators.
 * Enter sends, Shift+Enter for newline.
 */
const MessageInput = ({ conversationId, onSend }) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const { socket } = useSocketContext();
  const { replyingTo, setReplyingTo } = useChatContext();
  const { handleTyping } = useTyping(conversationId, socket);

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [text]);

  const handleChange = (e) => {
    setText(e.target.value);
    handleTyping();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.size > 10 * 1024 * 1024) {
        toast.error('File size exceeds 10MB limit.');
        return;
      }
      setFile(selected);
    }
    // Reset input so same file can be reselected
    e.target.value = '';
  };

  const handleSend = async () => {
    if ((!text.trim() && !file) || uploading) return;

    let attachmentUrl = null;
    let attachmentType = null;

    // Upload file to server if attached
    if (file) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        attachmentUrl = res.data.url;
        attachmentType = file.type.startsWith('image/') ? 'image' : 'file';
      } catch (error) {
        toast.error('Failed to upload file');
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    onSend(text.trim(), attachmentUrl, attachmentType, replyingTo?._id);
    setText('');
    setFile(null);
    setReplyingTo(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="p-4 glass sticky bottom-0 border-t border-[var(--glass-border)] z-10 flex flex-col">
      {replyingTo && (
        <div className="mb-3 mx-1 p-2 bg-[var(--bg-hover)] border-l-4 border-[var(--accent-solid)] rounded-md flex items-start justify-between shadow-sm relative overflow-hidden">
          <div className="flex-1 overflow-hidden pr-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-solid)] mb-0.5">Replying to {replyingTo.senderId?.name || 'User'}</p>
            <p className="text-xs text-secondary truncate">{replyingTo.text || (replyingTo.attachmentType === 'image' ? '📷 Photo' : '📎 Attachment')}</p>
          </div>
          <button onClick={() => setReplyingTo(null)} className="absolute top-2 right-2 text-muted hover:text-primary transition-colors p-1" title="Cancel Reply">
            <X size={16} />
          </button>
        </div>
      )}
      
      {file && (
        <div className="mb-3">
          <FilePreview file={file} onRemove={() => setFile(null)} />
        </div>
      )}
      
      <div 
        className="flex items-center gap-3 px-4 py-3 glass-card border-[var(--glass-border)]"
        style={{
          transition: 'all var(--transition-fast)'
        }}
      >
        <button 
          className="btn-ghost btn-icon shrink-0"
          onClick={() => fileInputRef.current?.click()}
          title="Attach file"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Paperclip size={24} />
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileChange}
          accept="image/*,.pdf,.doc,.docx,.zip"
        />
        
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 max-h-[120px] bg-transparent border-none outline-none resize-none py-2 px-1 text-sm"
          style={{ color: 'var(--text-primary)' }}
          rows={1}
        />
        
        <button 
          onClick={handleSend}
          disabled={(!text.trim() && !file) || uploading}
          className="shrink-0 w-12 h-12 flex items-center justify-center rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, var(--accent-start), var(--accent-end))',
            transition: 'all var(--transition-fast)',
            transform: uploading ? 'none' : undefined,
            boxShadow: 'var(--shadow-md)'
          }}
          title="Send message"
        >
          {uploading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send size={22} className="ml-1" />
          )}
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
