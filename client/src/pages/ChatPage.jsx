import React from 'react';
import AppLayout from '../components/layout/AppLayout';
import ChatHeader from '../components/chat/ChatHeader';
import ChatWindow from '../components/chat/ChatWindow';
import MessageInput from '../components/chat/MessageInput';
import TypingIndicator from '../components/chat/TypingIndicator';
import EmptyState from '../components/common/EmptyState';
import ConnectionCode from '../components/common/ConnectionCode';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useChatContext } from '../contexts/ChatContext';
import { useChat } from '../hooks/useChat';

const ChatPage = () => {
  const { user } = useAuth();
  const { activeConversation, closeConversation, typingUsers } = useChatContext();

  // Custom hook to manage active chat state
  const { messages, loading, loaded, hasMore, loadMore, sendMessage } = useChat(activeConversation?._id);

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col min-h-0 chat-doodle-bg relative overflow-hidden">
        {activeConversation ? (
          <>
            <ChatHeader
              conversation={activeConversation}
              typingUsers={typingUsers}
              onBack={closeConversation}
            />

            {/* key = conversation id, so switching chats starts fresh (scroll position, draft text) */}
            <ChatWindow
              key={activeConversation._id}
              conversation={activeConversation}
              messages={messages}
              loading={loading}
              loaded={loaded}
              hasMore={hasMore}
              loadMore={loadMore}
            />

            <div className="bg-transparent border-t border-[var(--glass-border)] z-10">
               <TypingIndicator
                 typingUsers={typingUsers}
                 conversationId={activeConversation._id}
               />
               <MessageInput
                 key={activeConversation._id}
                 conversationId={activeConversation._id}
                 onSend={sendMessage}
               />
            </div>
          </>
        ) : (
          <EmptyState
            icon={MessageCircle}
            title="Welcome to LiveChat"
            description="Select a conversation or start a new chat. Share your connection code so people can add you."
            action={
              <div className="w-64 mx-auto">
                <ConnectionCode code={user?.connectionCode} />
              </div>
            }
          />
        )}
      </div>
    </AppLayout>
  );
};

export default ChatPage;
