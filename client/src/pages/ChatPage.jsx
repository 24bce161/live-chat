import React from 'react';
import AppLayout from '../components/layout/AppLayout';
import ChatHeader from '../components/chat/ChatHeader';
import ChatWindow from '../components/chat/ChatWindow';
import MessageInput from '../components/chat/MessageInput';
import TypingIndicator from '../components/chat/TypingIndicator';
import EmptyState from '../components/common/EmptyState';
import { MessageCircle } from 'lucide-react';
import { useChatContext } from '../contexts/ChatContext';
import { useSocketContext } from '../contexts/SocketContext';
import { useChat } from '../hooks/useChat';

const ChatPage = () => {
  const { activeConversation, setActiveConversation, typingUsers } = useChatContext();
  const { onlineUsers } = useSocketContext();
  
  // Custom hook to manage active chat state
  const { messages, loading, hasMore, loadMore, sendMessage } = useChat(activeConversation?._id);

  return (
    <AppLayout>
      {activeConversation ? (
        <>
          <ChatHeader 
            conversation={activeConversation}
            onlineUsers={onlineUsers}
            typingUsers={typingUsers}
            onBack={() => setActiveConversation(null)}
          />
          
          <ChatWindow 
            messages={messages}
            loading={loading}
            hasMore={hasMore}
            loadMore={loadMore}
            isGroup={activeConversation.type === 'group'}
          />
          
          <div className="bg-transparent border-t border-[var(--glass-border)]">
             <TypingIndicator 
               typingUsers={typingUsers} 
               conversationId={activeConversation._id} 
             />
             <MessageInput 
               conversationId={activeConversation._id}
               onSend={sendMessage}
             />
          </div>
        </>
      ) : (
        <EmptyState 
          icon={MessageCircle}
          title="Welcome to LiveChat"
          description="Select a conversation from the sidebar or start a new chat to begin messaging."
        />
      )}
    </AppLayout>
  );
};

export default ChatPage;
