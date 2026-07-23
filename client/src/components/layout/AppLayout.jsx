import React, { useState } from 'react';
import Header from './Header';
import ConversationList from '../sidebar/ConversationList';
import { useChatContext } from '../../contexts/ChatContext';

const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { activeConversation } = useChatContext();

  // Close sidebar on mobile when a conversation is selected
  React.useEffect(() => {
    if (activeConversation && window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  }, [activeConversation]);

  return (
    <>
      <div className="animated-bg" />
      <div className="h-screen w-full flex flex-col bg-transparent overflow-hidden">
      <Header onMenuClick={() => setSidebarOpen(true)} />
      
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div 
            className="md:hidden absolute inset-0 bg-black/50 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`sidebar z-40 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <ConversationList />
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col relative z-20 min-w-0">
          {children}
        </main>
      </div>
      </div>
    </>
  );
};

export default AppLayout;
