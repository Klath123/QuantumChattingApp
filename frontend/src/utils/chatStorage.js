class ChatStorage {
  constructor() {
    this.dbName = 'ChatApp';
    this.version = 2; // Increment version to handle schema changes
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Store for messages with plaintext for your own messages
        if (!db.objectStoreNames.contains('messages')) {
          const messageStore = db.createObjectStore('messages', { keyPath: 'id', autoIncrement: true });
          messageStore.createIndex('chatId', 'chatId', { unique: false });
          messageStore.createIndex('timestamp', 'timestamp', { unique: false });
          messageStore.createIndex('senderId', 'senderId', { unique: false });
          messageStore.createIndex('receiverId', 'receiverId', { unique: false });
        }
        
        // Store for encryption keys - updated to handle both Kyber and Dilithium keys
        if (!db.objectStoreNames.contains('keys')) {
          const keyStore = db.createObjectStore('keys', { keyPath: 'userId' });
        }
      };
    });
  }

  // Store your own message (plaintext) locally
  async storeMyMessage(chatId, message, timestamp, senderId, receiverId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['messages'], 'readwrite');
      const store = transaction.objectStore('messages');
      
      const request = store.add({
        chatId,
        message,
        sender: 'me',
        senderId,
        receiverId,
        timestamp,
        isDecrypted: true,
        signatureVerified: true // Your own messages are always verified
      });

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Store received message (encrypted, will be decrypted) - updated to handle signatures
  async storeReceivedMessage(chatId, encryptedData, timestamp, senderId, receiverId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['messages'], 'readwrite');
      const store = transaction.objectStore('messages');
      
      const request = store.add({
        chatId,
        message: encryptedData.message, // decrypted message text
        encryptedMessage: encryptedData.encryptedMessage, // original encrypted data
        ciphertext: encryptedData.ciphertext,
        iv: encryptedData.iv,
        signature: encryptedData.signature, // digital signature
        signatureVerified: encryptedData.signatureVerified, // verification result
        sender: 'them',
        senderId,
        receiverId,
        timestamp,
        isDecrypted: true // We're storing the decrypted version
      });

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Get messages for a specific chat, filtered and sorted by time
  async getMessages(chatId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['messages'], 'readonly');
      const store = transaction.objectStore('messages');
      const index = store.index('chatId');
      
      const request = index.getAll(chatId);
      
      request.onsuccess = () => {
        // Sort messages by timestamp to ensure chronological order
        const messages = request.result.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        resolve(messages);
      };
      
      request.onerror = () => reject(request.error);
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Check if a message already exists (to prevent duplicates) - updated for better duplicate detection
  async messageExists(chatId, timestamp, senderId, messageContent) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['messages'], 'readonly');
      const store = transaction.objectStore('messages');
      const index = store.index('chatId');
      
      const request = index.getAll(chatId);
      
      request.onsuccess = () => {
        const exists = request.result.some(msg => {
          // Check by timestamp and sender ID first
          const timeMatch = Math.abs(new Date(msg.timestamp) - new Date(timestamp)) < 1000; // 1 second tolerance
          const senderMatch = msg.senderId === senderId;
          
          // Check content match (either plaintext message or encrypted message)
          const contentMatch = msg.message === messageContent || 
                              msg.encryptedMessage === messageContent ||
                              (msg.ciphertext && msg.ciphertext === messageContent);
          
          return timeMatch && senderMatch && contentMatch;
        });
        resolve(exists);
      };
      
      request.onerror = () => reject(request.error);
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Clear messages for a chat
  async clearMessages(chatId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['messages'], 'readwrite');
      const store = transaction.objectStore('messages');
      const index = store.index('chatId');
      
      const request = index.openCursor(chatId);
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve(); // All messages deleted
        }
      };
      
      request.onerror = () => reject(request.error);
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Store keys - updated to handle both Kyber and Dilithium keys
  async storeKeys(userId, keyData) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['keys'], 'readwrite');
      const store = transaction.objectStore('keys');
      
      // Handle different key data formats for backward compatibility
      let keysToStore;
      if (keyData.publicKey && keyData.dilithiumPublicKey) {
        // New format with both key types
        keysToStore = {
          userId,
          publicKey: keyData.publicKey, // Kyber public key
          privateKey: keyData.privateKey, // Kyber private key
          dilithiumPublicKey: keyData.dilithiumPublicKey,
          dilithiumPrivateKey: keyData.dilithiumPrivateKey
        };
      } else {
        // Legacy format - assume Kyber keys
        keysToStore = {
          userId,
          publicKey: keyData.publicKey || keyData,
          privateKey: keyData.privateKey,
          dilithiumPublicKey: keyData.dilithiumPublicKey,
          dilithiumPrivateKey: keyData.dilithiumPrivateKey
        };
      }
      
      const request = store.put(keysToStore);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Get keys
  async getKeys(userId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['keys'], 'readonly');
      const store = transaction.objectStore('keys');
      
      const request = store.get(userId);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Helper method to migrate existing data if needed
  async migrateData() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['messages'], 'readwrite');
      const store = transaction.objectStore('messages');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const messages = request.result;
        let migrationPromises = [];
        
        messages.forEach(msg => {
          // Add signatureVerified field to existing messages that don't have it
          if (msg.signatureVerified === undefined) {
            msg.signatureVerified = msg.sender === 'me' ? true : null;
            migrationPromises.push(
              new Promise((resolve, reject) => {
                const updateRequest = store.put(msg);
                updateRequest.onsuccess = () => resolve();
                updateRequest.onerror = () => reject(updateRequest.error);
              })
            );
          }
        });
        
        Promise.all(migrationPromises)
          .then(() => resolve())
          .catch(reject);
      };
      
      request.onerror = () => reject(request.error);
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

export const chatStorage = new ChatStorage();