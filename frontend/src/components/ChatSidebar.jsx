import { useChatStore } from "../context/useChatStore";
import { useState, useEffect } from "react";
import axios from "axios";
import { Users, MessageCircle, Shield, Search, X, LogOut } from "lucide-react";

export default function ChatSidebar({ onSelectUser }) {
  const setPeer = useChatStore((state) => state.setPeer);
  const [connections, setConnections] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);

  function base64ToUint8Array(base64) {
    return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  }

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const res = await axios.get("/api/v1/user/connections", { withCredentials: true });
        setConnections(res.data); // expects [{ user_id, username }]
      } catch (err) {
        console.error("Failed to fetch connections", err);
      }
    };
    fetchConnections();
  }, []);

  const handleSelectUser = async (user) => {
    try {
      const userWithKeys = {
        ...user,
      };
      
      setSelectedUserId(user.user_id);
      setPeer(userWithKeys);
      onSelectUser(userWithKeys);
    } catch (err) {
      console.error("Failed to fetch user's keys", err);
    }
  };

  const filteredConnections = connections.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const clearSearch = () => {
    setSearchTerm("");
  };

  return (
    <div className="w-80 bg-white/5 backdrop-blur-xl border-r border-white/10 h-full flex flex-col relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 p-4 border-b border-white/10 bg-white/5 backdrop-blur-lg">
        <div className="flex items-center justify-center mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center shadow-lg">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
              Chats
            </h2>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-purple-300" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search connections..."
            className="w-full pl-9 pr-9 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 transition-all duration-200"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/60 hover:text-purple-300 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Connections Count */}
      <div className="relative z-10 px-4 py-2 border-b border-white/10 bg-white/5 backdrop-blur-lg">
        <div className="flex items-center gap-2 text-sm text-purple-300">
          <Users className="w-4 h-4" />
          <span className="font-medium">{filteredConnections.length} connection{filteredConnections.length !== 1 ? 's' : ''}</span>
          {searchTerm && (
            <span className="text-blue-300">
              • filtering "{searchTerm}"
            </span>
          )}
        </div>
      </div>

      {/* Connections List */}
      <div className="relative z-10 flex-1 overflow-y-auto">
        {filteredConnections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            {searchTerm ? (
              <>
                <Search className="w-8 h-8 text-purple-400 mb-3" />
                <p className="text-purple-300 text-sm mb-1 font-medium">No results found</p>
                <p className="text-white/60 text-xs">
                  Try searching for a different username
                </p>
              </>
            ) : (
              <>
                <MessageCircle className="w-8 h-8 text-purple-400 mb-3" />
                <p className="text-purple-300 text-sm mb-1 font-medium">No connections yet</p>
                <p className="text-white/60 text-xs">
                  Connect with friends to start chatting
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="p-2">
            {filteredConnections.map((user, index) => (
              <div
                key={user.user_id}
                className={`group cursor-pointer p-3 rounded-lg transition-all duration-300 mb-2 backdrop-blur-md ${
                  selectedUserId === user.user_id
                    ? 'bg-gradient-to-r from-purple-500/30 to-blue-500/30 border border-purple-400/50 shadow-lg'
                    : 'bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30'
                }`}
                onClick={() => handleSelectUser(user)}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-sm transition-all duration-300 shadow-lg ${
                      selectedUserId === user.user_id
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500'
                        : 'bg-gradient-to-r from-purple-600/70 to-blue-600/70 group-hover:from-purple-500/90 group-hover:to-blue-500/90'
                    }`}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    {/* Online Status Indicator */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white/20 rounded-full shadow-lg"></div>
                  </div>
                  
                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-semibold truncate text-sm transition-colors duration-300 ${
                        selectedUserId === user.user_id ? 'text-white' : 'text-white/90 group-hover:text-white'
                      }`}>
                        {user.username}
                      </h3>
                      <span className="text-xs text-purple-300 ml-2">
                        now
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Shield className="w-3 h-3 text-green-400" />
                      <p className="text-xs text-white/60 truncate">
                        End-to-end encrypted
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative z-10 p-3 border-t border-white/10 bg-white/5 backdrop-blur-lg">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-purple-300">
            <Shield className="w-3 h-3 text-green-400" />
            <span className="font-medium">Encrypted</span>
          </div>
          <button className="flex items-center gap-1 text-white/60 hover:text-purple-300 transition-colors duration-200 hover:bg-white/10 px-2 py-1 rounded-md">
            <LogOut className="w-3 h-3" />
            <span>Sign out</span>
          </button>
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        /* Glassmorphism scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(147, 51, 234, 0.4);
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(147, 51, 234, 0.6);
        }
      `}</style>
    </div>
  );
}