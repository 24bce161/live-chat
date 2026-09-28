import React, { useRef, useEffect, useLayoutEffect } from 'react';
import MessageBubble from './MessageBubble';
import { formatDateSeparator } from '../../utils/formatDate';
import { useAuth } from '../../contexts/AuthContext';
import { getSenderId, isSeenByEveryone } from '../../utils/chatHelpers';
import LoadingSpinner from '../common/LoadingSpinner';

const ChatWindow = ({ conversation, messages, loading, loaded, hasMore, loadMore }) => {
  const { user } = useAuth();
  const containerRef = useRef(null);
  // Scroll height just before older messages were requested (null = not loading older)
  const prevScrollHeightRef = useRef(null);

  const isGroup = conversation.type === 'group';
  const lastMessageId = messages[messages.length - 1]?._id;

  // Scroll to the bottom when the chat opens or a NEW message arrives.
  // Loading older messages doesn't change the last message, so it won't jump.
  useEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lastMessageId]);

  // After older messages are added at the top, keep the same messages in view
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (el && prevScrollHeightRef.current !== null) {
      el.scrollTop = el.scrollHeight - prevScrollHeightRef.current;
      prevScrollHeightRef.current = null;
    }
  }, [messages.length]);

  const loadOlder = () => {
    if (!hasMore || loading) return;
    prevScrollHeightRef.current = containerRef.current?.scrollHeight ?? null;
    loadMore();
  };

  // Reaching the top loads older messages
  const handleScroll = (e) => {
    if (e.target.scrollTop === 0) {
      loadOlder();
    }
  };

  if (!loaded && messages.length === 0) {
    return (
      <div className="flex-1 flex-center">
        <LoadingSpinner size={28} />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex-center flex-col text-center">
        <div className="px-4 py-3 rounded-xl bg-[var(--bg-card)] shadow-sm">
          <p className="text-primary font-medium">No messages yet.</p>
          <p className="text-sm text-secondary">Send a message to start chatting!</p>
        </div>
      </div>
    );
  }

  let lastDateStr = null;

  return (
    <div
      className="flex-1 overflow-y-auto p-4 bg-transparent relative z-10"
      ref={containerRef}
      onScroll={handleScroll}
    >
      {/* A button as well as scrolling, in case the first page doesn't fill the screen */}
      {hasMore && (
        <div className="py-2 flex-center">
          {loading ? (
            <LoadingSpinner size={20} />
          ) : (
            <button
              type="button"
              onClick={loadOlder}
              className="text-xs font-medium px-3 py-1 rounded-full bg-[var(--bg-card)] text-secondary hover:text-primary shadow-sm"
            >
              Load older messages
            </button>
          )}
        </div>
      )}

      {messages.map((msg, idx) => {
        const senderId = getSenderId(msg);
        const isOwn = senderId === user?._id;
        const prevMsg = idx > 0 ? messages[idx - 1] : null;
        const previousSameSender = !!prevMsg && getSenderId(prevMsg) === senderId;

        // Date separator logic
        const currentDateStr = formatDateSeparator(msg.createdAt);
        const showDateSeparator = lastDateStr !== currentDateStr;
        lastDateStr = currentDateStr;

        return (
          <React.Fragment key={msg._id}>
            {showDateSeparator && (
              <div className="flex-center my-4">
                <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-[var(--bg-card)] text-secondary shadow-sm">
                  {currentDateStr}
                </span>
              </div>
            )}

            <MessageBubble
              message={msg}
              isOwn={isOwn}
              showSender={isGroup}
              previousSameSender={previousSameSender && !showDateSeparator}
              isSeen={isOwn && isSeenByEveryone(msg, conversation)}
            />
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default ChatWindow;
