import React from 'react';
import Header from './Header';
import ConversationList from '../sidebar/ConversationList';
import { useChatContext } from '../../contexts/ChatContext';

const AppLayout = ({ children }) => {
  const { activeConversation } = useChatContext();

  return (
    <>
      <div className="animated-bg" />
      {/* h-dvh (not h-screen) so the message box isn't hidden behind the phone browser's toolbar */}
      <div className="h-dvh w-full flex flex-col bg-transparent overflow-hidden">
      <Header />

      <div className="flex-1 flex overflow-hidden relative">
        {/* On phones only one of these is shown: the chat list when no chat is open,
            otherwise the open chat (its back button returns to the list).
            On bigger screens both are always shown. */}
        <aside className={`sidebar z-30 ${activeConversation ? 'mobile-hidden' : ''}`}>
          <ConversationList />
        </aside>

        <main className={`flex-1 flex flex-col relative z-20 min-w-0 ${activeConversation ? '' : 'mobile-hidden'}`}>
          {children}
        </main>
      </div>
      </div>
    </>
  );
};

export default AppLayout;
