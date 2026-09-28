import React from 'react';
import { formatMessageTime } from '../../utils/formatDate';
import { Check, CheckCheck, Download, FileText, Reply } from 'lucide-react';
import { useChatContext } from '../../contexts/ChatContext';
import { getMessagePreview } from '../../utils/chatHelpers';
import Avatar from '../common/Avatar';

const MessageBubble = ({ message, isOwn, showSender, previousSameSender, isSeen }) => {
  const { setReplyingTo } = useChatContext();
  const isImage = message.attachmentType === 'image';

  return (
    <div className={`flex flex-col mb-1 ${isOwn ? 'items-end' : 'items-start'} ${!previousSameSender ? 'mt-4' : ''}`}>
      <div className="flex items-end gap-2 max-w-[80%]">
        {!isOwn && showSender && (
          <div className="w-8 shrink-0">
            {!previousSameSender && (
              <Avatar src={message.senderId?.avatarUrl} name={message.senderId?.name} size="sm" />
            )}
          </div>
        )}

        <div className="flex flex-col group min-w-0">
          {!isOwn && showSender && !previousSameSender && (
            <span className="text-xs text-secondary ml-1 mb-1">{message.senderId?.name}</span>
          )}

          <div className={`${isOwn ? 'bubble-sent' : 'bubble-received'} relative`}>

            {/* Reply Preview Box */}
            {message.replyTo && (
              <div className={`mb-2 p-2 rounded text-xs border-l-4 ${isOwn ? 'bg-white/15 border-white/60' : 'bg-[var(--bg-hover)] border-[var(--accent-solid)]'}`}>
                <div className="font-semibold mb-0.5 text-[10px] uppercase tracking-wider">{message.replyTo.senderId?.name || 'User'}</div>
                <div className="truncate max-w-[200px]">{getMessagePreview(message.replyTo)}</div>
              </div>
            )}

            {/* Reply button: always shown on phones (there's no hover on touch screens),
                shown on hover or keyboard focus on bigger screens */}
            <button
              onClick={() => setReplyingTo(message)}
              className={`absolute top-1/2 -translate-y-1/2 ${isOwn ? '-left-10' : '-right-10'} p-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-secondary shadow-sm hover:text-primary transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100`}
              aria-label="Reply to this message"
              title="Reply"
            >
              <Reply size={14} />
            </button>

            {message.attachmentUrl && (
              isImage ? (
                <a href={message.attachmentUrl} target="_blank" rel="noreferrer" className="block mb-2 max-w-sm rounded overflow-hidden">
                  <img
                    src={message.attachmentUrl}
                    alt={message.attachmentName || 'Image attachment'}
                    className="max-w-full h-auto object-cover rounded"
                    loading="lazy"
                  />
                </a>
              ) : (
                // Non-images (PDF, DOC, ZIP) get a file card instead of a broken <img>
                <a
                  href={message.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className={`mb-2 flex items-center gap-3 p-2 min-w-[14rem] rounded-md transition-colors ${isOwn ? 'bg-white/15 hover:bg-white/25' : 'bg-[var(--bg-hover)] hover:bg-[var(--border-color)]'}`}
                  title="Download file"
                >
                  <FileText size={28} className="shrink-0" />
                  <span className="text-sm font-medium truncate flex-1 min-w-0">{message.attachmentName || 'Attachment'}</span>
                  <Download size={18} className="shrink-0" />
                </a>
              )
            )}

            {message.text && <p className="text-sm whitespace-pre-wrap">{message.text}</p>}

            <div className={`block text-right mt-1.5 text-[10px] ${isOwn ? 'text-white/80' : 'text-muted'}`}>
              <span className="inline-flex items-center gap-1">
                {formatMessageTime(message.createdAt)}
                {isOwn && (
                  isSeen
                    ? <CheckCheck size={14} className="text-sky-300" aria-label="Seen" />
                    : <Check size={14} aria-label="Sent" />
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
