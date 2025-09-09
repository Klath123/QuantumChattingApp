import { useState, useEffect } from 'react';
import ChatSidebar from '../components/ChatSidebar';
import WebSocketChatBox from '../components/WebSocketChatBox';
import { useAuthStore } from '../context/useAuthStore';
import { useChatStore } from '../context/useChatStore';
import { MessageCircle, Shield, Users } from 'lucide-react';
import Navbar from '../components/navbar';

export default function ChatPage() {
  const { user } = useAuthStore();
  const { peer } = useChatStore(); // default peer from invite code connection
  const [selectedUser, setSelectedUser] = useState(null);

  // Pre-select the user connected via invite code if present
  useEffect(() => {
    if (peer && !selectedUser) {
      setSelectedUser(peer);
    }
  }, [peer, selectedUser]);

  console.log("Current peer from store:", peer);

  if (!user) {
    return (
      <div className="min-h-screen bg-blue-700 flex items-center justify-center">
        <div className="bg-gray-50 rounded-lg p-8 border border-gray-200">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-black mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading user...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-700">
      <Navbar />
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="h-full">
          <ChatSidebar onSelectUser={setSelectedUser} selectedUser={selectedUser} />
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col h-full">
          {selectedUser ? (
            <div className="h-full bg-blue-700 border-l border-gray-200">
              <WebSocketChatBox peer={selectedUser} />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 bg-blue-900 border-l border-gray-200">
              <div className="text-center max-w-md mx-auto">
                {/* Icon */}
                

                {/* Welcome message */}
                <div className="bg-gray-50 rounded-lg p-8 border border-gray-200">
                  <h2 className="text-2xl font-semibold text-black mb-4">
                    Welcome to Overcloak
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Your secure, encrypted messaging platform. Select a user from the sidebar to start a conversation.
                  </p>
                  
                
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}