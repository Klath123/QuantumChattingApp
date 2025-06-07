import { useState, useEffect } from 'react';
import ChatSidebar from '../components/ChatSidebar';
import WebSocketChatBox from '../components/WebSocketChatBox';
import { useAuthStore } from '../context/useAuthStore';
import { useChatStore } from '../context/useChatStore';
import { MessageCircle, Sparkles, Users } from 'lucide-react';

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
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg font-medium">Loading user...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/20"></div>

      {/* Main content */}
      <div className="relative z-10 flex h-screen">
        {/* Sidebar with glass effect */}
        <div className="h-full bg-white/5 backdrop-blur-xl border-r border-white/10">
          <ChatSidebar onSelectUser={setSelectedUser} selectedUser={selectedUser} />
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col h-full">
          {selectedUser ? (
            <div className="h-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-tl-2xl m-4 overflow-hidden">
              <WebSocketChatBox peer={selectedUser} />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md mx-auto">
                {/* Floating icons animation */}
                <div className="relative mb-8">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <MessageCircle className="w-16 h-16 text-white/30 animate-bounce" />
                  </div>
                  <div className="absolute top-0 left-8 animate-float">
                    <Sparkles className="w-6 h-6 text-purple-300/60" />
                  </div>
                  <div className="absolute bottom-0 right-8 animate-float-delayed">
                    <Users className="w-6 h-6 text-blue-300/60" />
                  </div>
                </div>

                {/* Welcome message */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
                  <h2 className="text-3xl font-bold text-white mb-4 bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
                    Welcome to Overcloak
                  </h2>
                  <p className="text-white/80 text-lg mb-6 leading-relaxed">
                    Your secure, encrypted messaging platform. Select a user from the sidebar to start a conversation.
                  </p>
                  
                  {/* Feature highlights */}
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div className="flex items-center text-white/70 bg-white/5 rounded-lg p-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-3 animate-pulse"></div>
                      End-to-end encrypted
                    </div>
                    <div className="flex items-center text-white/70 bg-white/5 rounded-lg p-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-3 animate-pulse delay-200"></div>
                      Real-time messaging
                    </div>
                    <div className="flex items-center text-white/70 bg-white/5 rounded-lg p-3">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mr-3 animate-pulse delay-400"></div>
                      Secure connections
                    </div>
                  </div>
                </div>

                {/* Decorative elements */}
                <div className="mt-8 flex justify-center space-x-2">
                  <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse delay-200"></div>
                  <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse delay-400"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes float-delayed {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 3s ease-in-out infinite 1.5s;
        }

        /* Glassmorphism scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
}