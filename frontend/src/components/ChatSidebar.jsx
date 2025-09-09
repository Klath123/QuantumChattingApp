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
    <div className="w-80 bg-gray-50 border-r border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-center mb-3">
          <div className="flex items-center gap-2">
           
            <h2 className="text-lg font-semibold text-black">
              Chats
            </h2>
          </div>
        </div>       
      </div>

      {/* Connections Count */}
      <div className="px-4 py-2 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <span className="font-medium">{filteredConnections.length} connection{filteredConnections.length !== 1 ? 's' : ''}</span>
          {searchTerm && (
            <span className="text-gray-500">
              • filtering "{searchTerm}"
            </span>
          )}
        </div>
      </div>

      {/* Connections List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConnections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            {searchTerm ? (
              <>
                <Search className="w-8 h-8 text-gray-400 mb-3" />
                <p className="text-gray-600 text-sm mb-1 font-medium">No results found</p>
                <p className="text-gray-500 text-xs">
                  Try searching for a different username
                </p>
              </>
            ) : (
              <>
                
                <p className="text-gray-600 text-sm mb-1 font-medium">No connections yet</p>
                <p className="text-gray-500 text-xs">
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
                className={`cursor-pointer p-3 rounded-lg mb-2 ${
                  selectedUserId === user.user_id
                    ? 'bg-black text-white'
                    : 'bg-white hover:bg-gray-100 border border-gray-200'
                }`}
                onClick={() => handleSelectUser(user)}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-sm ${
                      selectedUserId === user.user_id
                        ? 'bg-gray-700'
                        : 'bg-gray-600'
                    }`}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    {/* Online Status Indicator */}
                 
                  </div>
                  
                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-semibold truncate text-sm ${
                        selectedUserId === user.user_id ? 'text-white' : 'text-black'
                      }`}>
                        {user.username}
                      </h3>
                      <span className={`text-xs ml-2 ${
                        selectedUserId === user.user_id ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        now
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Shield className="w-3 h-3 text-green-500" />
                      <p className={`text-xs truncate ${
                        selectedUserId === user.user_id ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                    
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
     
    </div>
  );
}