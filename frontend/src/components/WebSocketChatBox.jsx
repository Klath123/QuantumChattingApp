import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthStore } from "../context/useAuthStore";
import {
  encryptAndSignMessage,
  decryptAndVerifyMessage,
  encryptMessage, // Keep as fallback
  decryptMessage, // Keep as fallback
} from "../utils/crypto";
import { chatStorage } from "../utils/chatStorage";

export default function WebSocketChatBox({ peer }) {
  const { user } = useAuthStore();
  const peerId = peer?.user_id || peer?._id;
  
  // Create a consistent chatId that works regardless of who initiated the chat
  const chatId = [user._id, peerId].sort().join('_');
  
  console.log("🔍 Chat ID:", chatId);
  console.log("🔍 Current User ID:", user._id);
  console.log("🔍 Peer ID:", peerId);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("🔌 Connecting...");
  const [isConnecting, setIsConnecting] = useState(false);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [isUserOnline, setIsUserOnline] = useState(true); // New state for online status
  
  const socket = useRef(null);
  const scrollRef = useRef();
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Initialize IndexedDB
  useEffect(() => {
    const initDB = async () => {
      try {
        await chatStorage.init();
        setDbInitialized(true);
        console.log("✅ IndexedDB initialized");
      } catch (error) {
        console.error("❌ Failed to initialize IndexedDB:", error);
      }
    };
    initDB();
  }, []);

  // Load both Kyber and Dilithium keys
  const [kyberPrivateKey, setKyberPrivateKey] = useState(null);
  const [dilithiumPrivateKey, setDilithiumPrivateKey] = useState(null);
  
  useEffect(() => {
    const loadKeys = async () => {
      if (!dbInitialized || !user) return;
      
      try {
        // Try to get from IndexedDB first
        const keys = await chatStorage.getKeys(user._id);
        if (keys?.privateKey && keys?.dilithiumPrivateKey) {
          setKyberPrivateKey(keys.privateKey);
          setDilithiumPrivateKey(keys.dilithiumPrivateKey);
          return;
        }
        
        // Fallback to localStorage
        const kyberPrivateKeyBase64 = localStorage.getItem("kyberPrivate");
        const dilithiumPrivateKeyBase64 = localStorage.getItem("dilithiumPrivate");
        
        if (kyberPrivateKeyBase64 && dilithiumPrivateKeyBase64) {
          setKyberPrivateKey(kyberPrivateKeyBase64);
          setDilithiumPrivateKey(dilithiumPrivateKeyBase64);
          
          // Migrate to IndexedDB
          const kyberPublicKey = localStorage.getItem("kyberPublic");
          const dilithiumPublicKey = localStorage.getItem("dilithiumPublic");
          
          if (kyberPublicKey && dilithiumPublicKey) {
            await chatStorage.storeKeys(user._id, {
              publicKey: kyberPublicKey,
              privateKey: kyberPrivateKeyBase64,
              dilithiumPublicKey: dilithiumPublicKey,
              dilithiumPrivateKey: dilithiumPrivateKeyBase64
            });
          }
        }
      } catch (error) {
        console.error("❌ Error loading keys:", error);
      }
    };
    
    loadKeys();
  }, [dbInitialized, user]);

  // Check user online status
  const checkUserOnlineStatus = useCallback(async () => {
    try {
      const res = await fetch(`https://quantumchattingapp-backend.onrender.com/api/v1/user/status/${peerId}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setIsUserOnline(data.isOnline || false);
      } else {
        setIsUserOnline(false);
      }
    } catch (error) {
      console.error("❌ Error checking user status:", error);
      setIsUserOnline(false);
    }
  }, [peerId]);

  // Check online status periodically
  useEffect(() => {
    if (peerId) {
      checkUserOnlineStatus();
      const interval = setInterval(checkUserOnlineStatus, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [peerId, checkUserOnlineStatus]);

  // Updated function to fetch both Kyber and Dilithium public keys
  const fetchPeerPublicKeys = useCallback(async (peerId) => {
    try {
      const res = await fetch(`https://quantumchattingapp-backend.onrender.com/api/v1/user/keys/${peerId}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch peer public keys: ${res.status}`);
      }
      const data = await res.json();
      
      if (!data.kyber_public_key) {
        throw new Error("No kyberPublicKey found in response");
      }
      
      if (!data.dilithium_public_key) {
        throw new Error("No dilithiumPublicKey found in response");
      }
      
      // Validate Base64 strings
      try {
        atob(data.kyber_public_key);
        atob(data.dilithium_public_key);
      } catch (base64Error) {
        throw new Error(`Invalid Base64 public keys: ${base64Error.message}`);
      }
      
      return {
        kyberPublicKey: data.kyber_public_key,
        dilithiumPublicKey: data.dilithium_public_key
      };
    } catch (error) {
      console.error("❌ Error fetching peer public keys:", error);
      throw error;
    }
  }, []);

  // Load messages from IndexedDB first, then fetch from server
  // Updated to handle signature verification
  useEffect(() => {
    if (!user || !peerId || !kyberPrivateKey || !dilithiumPrivateKey || !dbInitialized) return;

    const loadMessages = async () => {
      try {
        console.log("📱 Loading messages for chat:", chatId);
        
        // Load from IndexedDB first
        const localMessages = await chatStorage.getMessages(chatId);
        console.log("📱 Local messages found:", localMessages.length);
        
        // Get peer's Dilithium public key for signature verification
        let peerDilithiumPublicKey = null;
        try {
          const peerKeys = await fetchPeerPublicKeys(peerId);
          peerDilithiumPublicKey = peerKeys.dilithiumPublicKey;
        } catch (error) {
          console.warn("⚠️ Could not fetch peer's Dilithium key, signatures will not be verified:", error);
        }
        
        // Process local messages and filter for this specific chat
        const processedLocal = await Promise.all(
          localMessages
            .filter(msg => {
              // Ensure message belongs to this specific chat
              const isMyMessage = msg.senderId === user._id && msg.receiverId === peerId;
              const isTheirMessage = msg.senderId === peerId && msg.receiverId === user._id;
              return isMyMessage || isTheirMessage;
            })
            .map(async (msg) => {
              if (msg.isDecrypted || msg.sender === 'me') {
                return {
                  sender: msg.senderId === user._id ? "me" : "them",
                  text: msg.message,
                  timestamp: msg.timestamp,
                  messageId: msg.id,
                  signatureVerified: msg.signatureVerified || null
                };
              } else {
                // Decrypt stored encrypted message with signature verification
                try {
                  let decryptedText;
                  let signatureVerified = null;
                  
                  // Check if message has signature for verification
                  if (msg.signature && peerDilithiumPublicKey) {
                    const result = await decryptAndVerifyMessage({
                      kyberPrivateKeyBase64: kyberPrivateKey,
                      kyberCiphertextBase64: msg.ciphertext,
                      encryptedMessageBase64: msg.encryptedMessage,
                      ivBase64: msg.iv,
                      signature: msg.signature,
                      dilithiumPublicKeyBase64: peerDilithiumPublicKey,
                    });
                    decryptedText = result.message;
                    signatureVerified = result.signatureValid;
                  } else {
                    // Fallback to regular decryption for messages without signatures
                    decryptedText = await decryptMessage({
                      kyberPrivateKeyBase64: kyberPrivateKey,
                      kyberCiphertextBase64: msg.ciphertext,
                      encryptedMessageBase64: msg.encryptedMessage,
                      ivBase64: msg.iv,
                    });
                  }
                  
                  return {
                    sender: msg.senderId === user._id ? "me" : "them",
                    text: decryptedText,
                    timestamp: msg.timestamp,
                    messageId: msg.id,
                    signatureVerified: signatureVerified
                  };
                } catch (error) {
                  console.error("❌ Failed to decrypt local message:", error);
                  return {
                    sender: msg.senderId === user._id ? "me" : "them",
                    text: "[Failed to decrypt message]",
                    timestamp: msg.timestamp,
                    messageId: msg.id,
                    signatureVerified: false
                  };
                }
              }
            })
        );

        // Sort by timestamp to ensure chronological order
        processedLocal.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setMessages(processedLocal);
        console.log("📱 Processed local messages:", processedLocal.length);

        // Fetch from server to sync any new messages
        const res = await fetch(
          `https://quantumchattingapp-backend.onrender.com/api/v1/messages/${peerId}`,
          {
            credentials: "include",
          }
        );

        if (!res.ok) {
          console.warn(`⚠️ Server fetch failed: ${res.status}`);
          return; // Use local messages if server fails
        }

        const serverData = await res.json();
        console.log("📜 Server messages found:", serverData.length);

        // Process server messages and store new ones locally
        const serverMessages = [];
        
        for (const msg of serverData) {
          try {
            const isMyMessage = msg.sender_id === user._id;
            const messageTimestamp = msg.timestamp;
            
            // Check if we already have this message locally
            const alreadyExists = await chatStorage.messageExists(
              chatId, 
              messageTimestamp, 
              msg.sender_id, 
              msg.message
            );
            
            if (alreadyExists) {
              console.log("⏭️ Message already exists locally, skipping");
              continue;
            }

            let messageText;
            let signatureVerified = null;

            if (msg.message_type === "encrypted" && msg.ciphertext && msg.encrypted_message && msg.iv) {
              if (isMyMessage) {
                // For your own messages from server, show as sent (you can't decrypt them)
                console.log("📤 Found your encrypted message on server");
                continue;
              } else {
                // Decrypt received messages with signature verification if available
                if (msg.signature && peerDilithiumPublicKey) {
                  try {
                    const result = await decryptAndVerifyMessage({
                      kyberPrivateKeyBase64: kyberPrivateKey,
                      kyberCiphertextBase64: msg.ciphertext,
                      encryptedMessageBase64: msg.encrypted_message,
                      ivBase64: msg.iv,
                      signature: msg.signature,
                      dilithiumPublicKeyBase64: peerDilithiumPublicKey,
                    });
                    messageText = result.message;
                    signatureVerified = result.signatureValid;
                  } catch (sigError) {
                    console.warn("⚠️ Signature verification failed, falling back to regular decryption:", sigError);
                    messageText = await decryptMessage({
                      kyberPrivateKeyBase64: kyberPrivateKey,
                      kyberCiphertextBase64: msg.ciphertext,
                      encryptedMessageBase64: msg.encrypted_message,
                      ivBase64: msg.iv,
                    });
                    signatureVerified = false;
                  }
                } else {
                  // Regular decryption for messages without signatures
                  messageText = await decryptMessage({
                    kyberPrivateKeyBase64: kyberPrivateKey,
                    kyberCiphertextBase64: msg.ciphertext,
                    encryptedMessageBase64: msg.encrypted_message,
                    ivBase64: msg.iv,
                  });
                }
                
                // Store decrypted message locally
                await chatStorage.storeReceivedMessage(
                  chatId,
                  {
                    message: messageText,
                    ciphertext: msg.ciphertext,
                    encryptedMessage: msg.encrypted_message,
                    iv: msg.iv,
                    signature: msg.signature,
                    signatureVerified: signatureVerified,
                  },
                  messageTimestamp,
                  msg.sender_id,
                  msg.receiver_id
                );
                console.log("📥 Stored new received message locally");
              }
            } else if (msg.message) {
              messageText = msg.message;
            } else {
              messageText = "[Unable to decrypt message]";
            }

            serverMessages.push({
              sender: isMyMessage ? "me" : "them",
              text: messageText,
              timestamp: messageTimestamp,
              serverId: msg._id,
              signatureVerified: signatureVerified
            });
          } catch (decryptError) {
            console.error("❌ Failed to process server message:", msg._id, decryptError);
            serverMessages.push({
              sender: msg.sender_id === user._id ? "me" : "them",
              text: "[Failed to decrypt message]",
              timestamp: msg.timestamp,
              serverId: msg._id,
              signatureVerified: false
            });
          }
        }

        // Merge local and server messages, remove duplicates, and sort by time
        const allMessages = [...processedLocal];
        
        for (const serverMsg of serverMessages) {
          // Check if this server message is already in local messages
          const isDuplicate = allMessages.some(localMsg => 
            Math.abs(new Date(localMsg.timestamp) - new Date(serverMsg.timestamp)) < 1000 &&
            localMsg.text === serverMsg.text &&
            localMsg.sender === serverMsg.sender
          );
          
          if (!isDuplicate) {
            allMessages.push(serverMsg);
          }
        }

        // Final sort by timestamp
        allMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        console.log("📜 Final merged messages:", allMessages.length);
        setMessages(allMessages);
        
      } catch (err) {
        console.error("❌ Error loading messages:", err);
        setStatus("❌ Failed to load messages");
      }
    };

    loadMessages();
  }, [peerId, user, kyberPrivateKey, dilithiumPrivateKey, dbInitialized, chatId, fetchPeerPublicKeys]);

  // WebSocket connection updated to handle signatures
  useEffect(() => {
    if (!user || !peer || !kyberPrivateKey || !dilithiumPrivateKey || !dbInitialized) {
      return;
    }

    let isMounted = true;
    
    const connectWebSocket = () => {
      if (socket.current?.readyState === WebSocket.OPEN || isConnecting) {
        return;
      }

      setIsConnecting(true);
      const ws = new WebSocket("wss://quantumchattingapp-backend.onrender.com/api/v1/ws/chat");
      socket.current = ws;

      ws.onopen = () => {
        if (!isMounted) return;
        setStatus("✅ Connected to server");
        setIsConnecting(false);
        reconnectAttempts.current = 0;
        
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = async (e) => {
        if (!isMounted) return;

        try {
          const rawData = e.data;

          if (typeof rawData === "string" && rawData.startsWith("STATUS:")) {
            const statusMessage = rawData.replace("STATUS:", "");
            setStatus(statusMessage);
            
            if (statusMessage.includes("Unauthorized")) {
              ws.close();
              return;
            }
            return;
          }

          const data = JSON.parse(rawData);

          if (data.type === "encrypted-message") {
            let decryptedText;
            let signatureVerified = null;
            
            // Try to get peer's Dilithium public key for signature verification
            let peerDilithiumPublicKey = null;
            try {
              const peerKeys = await fetchPeerPublicKeys(data.from);
              peerDilithiumPublicKey = peerKeys.dilithiumPublicKey;
            } catch (error) {
              console.warn("⚠️ Could not fetch peer's Dilithium key:", error);
            }
            
            // Decrypt and verify signature if available
            if (data.signature && peerDilithiumPublicKey) {
              try {
                const result = await decryptAndVerifyMessage({
                  kyberPrivateKeyBase64: kyberPrivateKey,
                  kyberCiphertextBase64: data.ciphertext,
                  encryptedMessageBase64: data.encryptedMessage,
                  ivBase64: data.iv,
                  signature: data.signature,
                  dilithiumPublicKeyBase64: peerDilithiumPublicKey,
                });
                decryptedText = result.message;
                signatureVerified = result.signatureValid;
              } catch (sigError) {
                console.warn("⚠️ Signature verification failed, falling back to regular decryption:", sigError);
                decryptedText = await decryptMessage({
                  kyberPrivateKeyBase64: kyberPrivateKey,
                  kyberCiphertextBase64: data.ciphertext,
                  encryptedMessageBase64: data.encryptedMessage,
                  ivBase64: data.iv,
                });
                signatureVerified = false;
              }
            } else {
              // Regular decryption for messages without signatures
              decryptedText = await decryptMessage({
                kyberPrivateKeyBase64: kyberPrivateKey,
                kyberCiphertextBase64: data.ciphertext,
                encryptedMessageBase64: data.encryptedMessage,
                ivBase64: data.iv,
              });
            }

            const newMessage = {
              sender: "them",
              text: decryptedText,
              timestamp: new Date().toISOString(),
              signatureVerified: signatureVerified,
            };

            // Store in IndexedDB
            await chatStorage.storeReceivedMessage(
              chatId,
              {
                message: decryptedText,
                ciphertext: data.ciphertext,
                encryptedMessage: data.encryptedMessage,
                iv: data.iv,
                signature: data.signature,
                signatureVerified: signatureVerified,
              },
              newMessage.timestamp,
              data.from, // sender ID
              user._id   // receiver ID (you)
            );

            setMessages((prev) => [...prev, newMessage]);
          }
        } catch (error) {
          console.error("❌ Message processing failed:", error);
        }
      };

      ws.onclose = (event) => {
        if (!isMounted) return;
        setIsConnecting(false);
        
        if (event.code !== 1000 && event.code !== 1001 && event.code !== 1008) {
          if (reconnectAttempts.current < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
            setStatus(`🔄 Reconnecting in ${delay/1000}s...`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              if (isMounted && !isConnecting) {
                reconnectAttempts.current++;
                connectWebSocket();
              }
            }, delay);
          } else {
            setStatus("❌ Connection failed - Max retries reached");
          }
        } else {
          setStatus("❌ Disconnected");
        }
      };

      ws.onerror = (error) => {
        if (!isMounted) return;
        setStatus("❌ Connection error");
        setIsConnecting(false);
      };
    };

    connectWebSocket();

    return () => {
      isMounted = false;
      setIsConnecting(false);
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      if (socket.current) {
        socket.current.close(1000, "Component unmounting");
        socket.current = null;
      }
    };
  }, [user, peerId, kyberPrivateKey, dilithiumPrivateKey, dbInitialized, chatId, fetchPeerPublicKeys]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Updated sendMessage to use encryption with signing
  const sendMessage = async () => {
    if (!input.trim()) return;

   

    if (!socket.current || socket.current.readyState !== WebSocket.OPEN) {
      setStatus("❌ WebSocket not connected");
      return;
    }

    try {
      const peerKeys = await fetchPeerPublicKeys(peerId);
      
      // Use the new encryptAndSignMessage function
      const encryptedPayload = await encryptAndSignMessage(
        peerKeys.kyberPublicKey, 
        input, 
        dilithiumPrivateKey
      );

      const payload = {
        type: "encrypted-message",
        ciphertext: encryptedPayload.kyberCiphertext,
        encryptedMessage: encryptedPayload.encryptedMessage,
        iv: encryptedPayload.iv,
        signature: encryptedPayload.signature, // Include signature
        to: peerId,
        from: user._id,
      };

      socket.current.send(JSON.stringify(payload));
      
      const newMessage = {
        sender: "me",
        text: input,
        timestamp: new Date().toISOString(),
        signatureVerified: true // Your own messages are always "verified"
      };

      // Store your own message in plaintext locally
      await chatStorage.storeMyMessage(
        chatId, 
        input, 
        newMessage.timestamp,
        user._id,  // sender ID (you)
        peerId     // receiver ID
      );
      
      setMessages((prev) => [...prev, newMessage]);
      setInput("");
    } catch (error) {
      console.error("❌ Encryption or send failed:", error);
      setStatus("❌ Failed to send message");
    }
  };

  if (!user || !peer || !kyberPrivateKey || !dilithiumPrivateKey || !dbInitialized) {
    return (
      <div className="flex items-center justify-center h-[500px] w-full max-w-md mx-auto bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl shadow-2xl border border-purple-500/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-purple-200 font-medium">Initializing secure chat...</p>
        </div>
      </div>
    );
  }

  return (
   <div className="flex flex-col h-[500px] w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl shadow-2xl border border-purple-500/20 backdrop-blur-sm overflow-hidden">

      {/* Professional Header with Gradient */}
      <header className="px-4 py-3 bg-gradient-to-r from-purple-800/80 via-blue-800/80 to-purple-800/80 backdrop-blur-md border-b border-purple-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center font-bold text-white text-lg shadow-lg">
                {peer.username?.charAt(0).toUpperCase()}
              </div>
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                 'bg-green-400'
              } shadow-sm`}></div>
            </div>
            <div>
              <h2 className="font-bold text-white text-base tracking-wide">
                {peer.username}
              </h2>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                   'bg-green-400 animate-pulse'
                }`}></div>
               
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-purple-200/80 font-medium">{status}</div>
            <div className="text-[10px] text-purple-300/60 mt-0.5">End-to-End Encrypted</div>
          </div>
        </div>
      </header>

      {/* Enhanced Chat Messages Area */}
      <main className="flex-grow p-4 overflow-y-auto bg-gradient-to-b from-slate-900/50 to-purple-900/30 backdrop-blur-sm">
        <div className="flex flex-col space-y-3">
          {messages.length === 0 && (
            <div className="text-center mt-16">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-purple-200/80 font-medium text-sm">Start your secure conversation</p>
              <p className="text-purple-300/60 text-xs mt-1">All messages are encrypted end-to-end</p>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-lg backdrop-blur-sm border ${
                  msg.sender === "me"
                    ? "bg-gradient-to-br from-blue-600 to-purple-600 text-white border-blue-500/30 rounded-br-md"
                    : "bg-gradient-to-br from-gray-800/80 to-gray-700/80 text-gray-100 border-gray-600/30 rounded-bl-md"
                }`}
                style={{
                  wordWrap: "break-word",
                  whiteSpace: "pre-wrap",
                }}
              >
                <div className="flex flex-col">
                  <span className="leading-relaxed font-medium text-sm">{msg.text}</span>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] opacity-60">
                      {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    {msg.sender === "them" && msg.signatureVerified !== null && (
                      <div className="text-xs flex items-center space-x-1">
                        {msg.signatureVerified ? (
                          <>
                            <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-green-400 text-[10px]">Verified</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span className="text-red-400 text-[10px]">Unverified</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </main>

      {/* Enhanced Input Footer */}
      <footer className="p-4 bg-gradient-to-r from-slate-800/80 via-purple-800/80 to-slate-800/80 backdrop-blur-md border-t border-purple-500/30">
        {/* {!isUserOnline && (
          <div className="mb-3 p-2 bg-red-500/20 border border-red-500/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-red-300 text-xs font-medium">User is currently offline</span>
            </div>
          </div>
        )} */}
        
        <div className="flex items-center space-x-3">
          <div className="flex-grow relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={"Type your message..."}
              onKeyDown={(e) => {
                if (e.key === "Enter" && input.trim() ) sendMessage();
              }}
              className="w-full px-4 py-3 text-sm rounded-2xl bg-gradient-to-r from-gray-800/80 to-gray-700/80 backdrop-blur-sm border border-gray-600/50 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 font-medium"
              spellCheck={false}
              disabled={ isConnecting || socket.current?.readyState !== WebSocket.OPEN}
            />
            {input.trim()  && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
          
          <button
            onClick={sendMessage}
            disabled={!input.trim()  || isConnecting || socket.current?.readyState !== WebSocket.OPEN}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg disabled:shadow-none transform hover:scale-105 disabled:transform-none flex items-center space-x-2"
          >
            {isConnecting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span className="text-sm">Send</span>
              </>
            )}
          </button>
        </div>
        
        <div className="flex items-center justify-between mt-2 text-[10px] text-purple-300/60">
          <span>🔒 Quantum-safe encryption active</span>
          <span>{messages.length} messages</span>
        </div>
      </footer>
    </div>
  );
}
