import React, { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import { formatDateSeparator } from '../../utils/formatDate';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

const ChatWindow = ({ messages, loading, hasMore, loadMore, isGroup }) => {
  const { user } = useAuth();
  const endRef = useRef(null);
  const containerRef = useRef(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle scroll to load more
  const handleScroll = (e) => {
    if (e.target.scrollTop === 0 && hasMore && !loading) {
      // Store current scroll height to restore position after loading
      const oldScrollHeight = e.target.scrollHeight;
      loadMore();
    }
  };

  if (messages.length === 0 && !loading) {
    return (
      <div className="flex-1 flex-center flex-col text-secondary">
        <p>No messages yet.</p>
        <p className="text-sm">Send a message to start chatting!</p>
      </div>
    );
  }

  let lastDateStr = null;

  return (
    <div 
      className="flex-1 overflow-y-auto p-4 bg-transparent" 
      ref={containerRef}
      onScroll={handleScroll}
    >
      {loading && hasMore && (
        <div className="py-4 flex-center">
          <LoadingSpinner size={20} />
        </div>
      )}

      {messages.map((msg, idx) => {
        const senderId = msg.senderId?._id || msg.senderId;
        const isOwn = senderId === user?._id || senderId === user?.id;
        const prevMsg = idx > 0 ? messages[idx - 1] : null;
        const prevSenderId = prevMsg?.senderId?._id || prevMsg?.senderId;
        const previousSameSender = prevMsg && prevSenderId === senderId;
        
        // Date separator logic
        const currentDateStr = formatDateSeparator(msg.createdAt);
        const showDateSeparator = lastDateStr !== currentDateStr;
        lastDateStr = currentDateStr;

        return (
          <React.Fragment key={msg._id}>
            {showDateSeparator && (
              <div className="flex-center my-4">
                <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-[var(--bg-hover)] text-secondary">
                  {currentDateStr}
                </span>
              </div>
            )}
            
            <MessageBubble 
              message={msg}
              isOwn={isOwn}
              showAvatar={isGroup}
              previousSameSender={previousSameSender && !showDateSeparator}
            />
          </React.Fragment>
        );
      })}
      
      <div ref={endRef} />
    </div>
  );
};

export default ChatWindow;
