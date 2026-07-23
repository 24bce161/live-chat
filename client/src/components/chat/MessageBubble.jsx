import React from 'react';
import { formatMessageTime } from '../../utils/formatDate';
import { Check, CheckCheck, Download, Reply } from 'lucide-react';
import { useChatContext } from '../../contexts/ChatContext';
import Avatar from '../common/Avatar';
import FilePreview from './FilePreview';

const MessageBubble = ({ message, isOwn, showAvatar, previousSameSender }) => {
  const { setReplyingTo } = useChatContext();

  return (
    <div className={`flex flex-col mb-1 ${isOwn ? 'items-end' : 'items-start'} ${!previousSameSender ? 'mt-4' : ''}`}>
      <div className="flex items-end gap-2 max-w-[80%]">
        {!isOwn && showAvatar && (
          <div className="w-8 shrink-0">
            {!previousSameSender && <Avatar name={message.senderId?.name} size="sm" />}
          </div>
        )}
        
        <div className="flex flex-col group">
          {!isOwn && showAvatar && !previousSameSender && (
            <span className="text-xs text-secondary ml-1 mb-1">{message.senderId?.name}</span>
          )}
          
          <div className={`${isOwn ? 'bubble-sent' : 'bubble-received'} relative`}>
            
            {/* Reply Preview Box */}
            {message.replyTo && (
              <div className={`mb-2 p-2 rounded text-xs border-l-4 opacity-90 ${isOwn ? 'bg-white/20 border-white/50 text-white' : 'bg-black/5 border-[var(--accent-solid)] text-gray-800'}`}>
                <div className="font-semibold mb-0.5 text-[10px] uppercase tracking-wider">{message.replyTo.senderId?.name || 'User'}</div>
                <div className="truncate max-w-[200px]">{message.replyTo.text || (message.replyTo.attachmentType === 'image' ? '📷 Photo' : '📎 Attachment')}</div>
              </div>
            )}

            {/* Reply Action Button */}
            <button
              onClick={() => setReplyingTo(message)}
              className={`absolute top-1/2 -translate-y-1/2 ${isOwn ? '-left-10' : '-right-10'} p-1.5 rounded-full bg-[var(--bg-glass)] border border-[var(--border-color)] text-secondary opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:text-primary hover:bg-[var(--bg-hover)]`}
              title="Reply"
            >
              <Reply size={14} />
            </button>

            {message.attachmentUrl && (
              <div className="mb-2 max-w-sm rounded overflow-hidden relative group/attach">
                 {/* In a real app we'd determine if it's an image based on the URL or metadata */}
                 <img src={message.attachmentUrl} alt="Attachment" className="max-w-full h-auto object-cover rounded" />
                 <a 
                   href={message.attachmentUrl} 
                   download 
                   target="_blank"
                   rel="noreferrer"
                   className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover/attach:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm"
                   title="Download attachment"
                 >
                   <Download size={16} />
                 </a>
              </div>
            )}
            
            {message.text && <p className="text-sm whitespace-pre-wrap">{message.text}</p>}
            
            <div className={`block text-right mt-1.5 text-[10px] ${isOwn ? 'text-blue-100' : 'text-muted'} opacity-70 group-hover:opacity-100 transition-opacity`}>
              <span className="inline-flex items-center gap-1">
                {formatMessageTime(message.createdAt)}
                {isOwn && (
                  message.readBy?.length > 1 ? <CheckCheck size={14} className="text-blue-300" /> : <Check size={14} />
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
