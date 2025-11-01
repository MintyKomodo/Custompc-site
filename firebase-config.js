// Firebase Configuration and Real-time Chat Integration
// This enables cross-device real-time messaging

class FirebaseChatManager {
  constructor() {
    this.database = null;
    this.isInitialized = false;
    this.currentChatId = null;
    this.messageListeners = new Map();
    this.init();
  }

  async init() {
    try {
      // Initialize Firebase (using CDN version for simplicity)
      if (typeof firebase === 'undefined') {
        console.log('Firebase not loaded, falling back to localStorage');
        return false;
      }

      // Firebase configuration
      const firebaseConfig = {
        apiKey: "AIzaSyANB6z6rM3lb2GZc3wTO5767fO1jB-PUjM",
        authDomain: "custompc-website.firebaseapp.com",
        databaseURL: "https://custompc-website-default-rtdb.firebaseio.com",
        projectId: "custompc-website",
        storageBucket: "custompc-website.firebasestorage.app",
        messagingSenderId: "1043646914253",
        appId: "1:1043646914253:web:eadb153333f3465ce65384"
      };

      // Initialize Firebase
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }

      this.database = firebase.database();
      this.isInitialized = true;
      console.log('Firebase initialized successfully');
      return true;

    } catch (error) {
      console.error('Firebase initialization failed:', error);
      console.log('Falling back to localStorage');
      return false;
    }
  }

  // Create a new chat session
  async createChatSession(chatData) {
    if (!this.isInitialized) {
      return this.createLocalChatSession(chatData);
    }

    try {
      const chatRef = this.database.ref('chats').push();
      const chatId = chatRef.key;
      
      const chatSession = {
        ...chatData,
        id: chatId,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        lastActivity: firebase.database.ServerValue.TIMESTAMP,
        status: 'active'
      };

      await chatRef.set(chatSession);
      console.log('Chat session created in Firebase:', chatId);
      return chatId;

    } catch (error) {
      console.error('Failed to create Firebase chat session:', error);
      return this.createLocalChatSession(chatData);
    }
  }

  // Send a message to a chat
  async sendMessage(chatId, messageData) {
    if (!this.isInitialized) {
      return this.sendLocalMessage(chatId, messageData);
    }

    try {
      const messagesRef = this.database.ref(`chats/${chatId}/messages`);
      const messageRef = messagesRef.push();
      
      const message = {
        ...messageData,
        id: messageRef.key,
        timestamp: firebase.database.ServerValue.TIMESTAMP
      };

      await messageRef.set(message);

      // Update chat last activity
      await this.database.ref(`chats/${chatId}/lastActivity`).set(firebase.database.ServerValue.TIMESTAMP);

      console.log('Message sent to Firebase');
      return message;

    } catch (error) {
      console.error('Failed to send Firebase message:', error);
      return this.sendLocalMessage(chatId, messageData);
    }
  }

  // Listen for new messages in a chat
  listenForMessages(chatId, callback) {
    if (!this.isInitialized) {
      return this.listenForLocalMessages(chatId, callback);
    }

    try {
      const messagesRef = this.database.ref(`chats/${chatId}/messages`);
      
      // Remove existing listener if any
      if (this.messageListeners.has(chatId)) {
        messagesRef.off('child_added', this.messageListeners.get(chatId));
      }

      // Add new message listener
      const listener = messagesRef.on('child_added', (snapshot) => {
        const message = snapshot.val();
        if (message) {
          callback(message);
        }
      });

      this.messageListeners.set(chatId, listener);
      console.log('Listening for Firebase messages on chat:', chatId);

    } catch (error) {
      console.error('Failed to listen for Firebase messages:', error);
      this.listenForLocalMessages(chatId, callback);
    }
  }

  // Get all active chats (for admin)
  async getActiveChats() {
    if (!this.isInitialized) {
      return this.getLocalActiveChats();
    }

    try {
      const chatsRef = this.database.ref('chats');
      const snapshot = await chatsRef.once('value');
      const chats = snapshot.val();

      if (!chats) return [];

      // Convert to array and filter active chats from last 24 hours
      const chatArray = Object.keys(chats).map(key => ({
        ...chats[key],
        id: key
      }));

      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      const activeChats = chatArray.filter(chat => {
        const lastActivity = chat.lastActivity || chat.createdAt || 0;
        return lastActivity > oneDayAgo && chat.status === 'active';
      });

      // Sort by last activity (most recent first)
      activeChats.sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0));

      console.log('Retrieved active chats from Firebase:', activeChats.length);
      return activeChats;

    } catch (error) {
      console.error('Failed to get Firebase active chats:', error);
      return this.getLocalActiveChats();
    }
  }

  // Listen for new chats (for admin)
  listenForNewChats(callback) {
    if (!this.isInitialized) {
      return this.listenForLocalNewChats(callback);
    }

    try {
      const chatsRef = this.database.ref('chats');
      
      chatsRef.on('child_added', (snapshot) => {
        const chat = snapshot.val();
        if (chat) {
          callback({
            ...chat,
            id: snapshot.key
          });
        }
      });

      chatsRef.on('child_changed', (snapshot) => {
        const chat = snapshot.val();
        if (chat) {
          callback({
            ...chat,
            id: snapshot.key
          });
        }
      });

      console.log('Listening for new Firebase chats');

    } catch (error) {
      console.error('Failed to listen for Firebase new chats:', error);
      this.listenForLocalNewChats(callback);
    }
  }

  // Get chat messages
  async getChatMessages(chatId) {
    if (!this.isInitialized) {
      return this.getLocalChatMessages(chatId);
    }

    try {
      const messagesRef = this.database.ref(`chats/${chatId}/messages`);
      const snapshot = await messagesRef.once('value');
      const messages = snapshot.val();

      if (!messages) return [];

      // Convert to array and sort by timestamp
      const messageArray = Object.keys(messages).map(key => ({
        ...messages[key],
        id: key
      }));

      messageArray.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

      return messageArray;

    } catch (error) {
      console.error('Failed to get Firebase chat messages:', error);
      return this.getLocalChatMessages(chatId);
    }
  }

  // Mark chat as read
  async markChatAsRead(chatId, userId) {
    if (!this.isInitialized) {
      return this.markLocalChatAsRead(chatId, userId);
    }

    try {
      await this.database.ref(`chats/${chatId}/readBy/${userId}`).set(firebase.database.ServerValue.TIMESTAMP);
      console.log('Chat marked as read in Firebase');

    } catch (error) {
      console.error('Failed to mark Firebase chat as read:', error);
      this.markLocalChatAsRead(chatId, userId);
    }
  }

  // Fallback methods for localStorage (when Firebase fails)
  createLocalChatSession(chatData) {
    const chatId = 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const chatSession = {
      ...chatData,
      id: chatId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      status: 'active'
    };

    const chats = this.getStoredChats();
    chats.push(chatSession);
    localStorage.setItem('custompc_chat_sessions', JSON.stringify(chats));
    
    return chatId;
  }

  sendLocalMessage(chatId, messageData) {
    const chats = this.getStoredChats();
    const chat = chats.find(c => c.id === chatId);
    
    if (chat) {
      if (!chat.messages) chat.messages = [];
      
      const message = {
        ...messageData,
        id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        timestamp: Date.now()
      };
      
      chat.messages.push(message);
      chat.lastActivity = Date.now();
      
      localStorage.setItem('custompc_chat_sessions', JSON.stringify(chats));
      return message;
    }
    
    return null;
  }

  listenForLocalMessages(chatId, callback) {
    // For localStorage, we'll poll for changes
    const pollInterval = setInterval(() => {
      const chats = this.getStoredChats();
      const chat = chats.find(c => c.id === chatId);
      
      if (chat && chat.messages) {
        chat.messages.forEach(message => {
          callback(message);
        });
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }

  getLocalActiveChats() {
    const chats = this.getStoredChats();
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    return chats.filter(chat => {
      const lastActivity = chat.lastActivity || chat.createdAt || 0;
      return lastActivity > oneDayAgo && chat.status === 'active';
    }).sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0));
  }

  listenForLocalNewChats(callback) {
    // For localStorage, we'll poll for new chats
    let lastChatCount = 0;
    
    const pollInterval = setInterval(() => {
      const chats = this.getLocalActiveChats();
      
      if (chats.length > lastChatCount) {
        // New chat detected
        const newChats = chats.slice(lastChatCount);
        newChats.forEach(chat => callback(chat));
      }
      
      lastChatCount = chats.length;
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }

  getLocalChatMessages(chatId) {
    const chats = this.getStoredChats();
    const chat = chats.find(c => c.id === chatId);
    return chat ? (chat.messages || []) : [];
  }

  markLocalChatAsRead(chatId, userId) {
    const chats = this.getStoredChats();
    const chat = chats.find(c => c.id === chatId);
    
    if (chat) {
      if (!chat.readBy) chat.readBy = {};
      chat.readBy[userId] = Date.now();
      localStorage.setItem('custompc_chat_sessions', JSON.stringify(chats));
    }
  }

  getStoredChats() {
    try {
      const stored = localStorage.getItem('custompc_chat_sessions');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to retrieve stored chats:', error);
      return [];
    }
  }

  // Cleanup method
  cleanup() {
    // Remove all Firebase listeners
    this.messageListeners.forEach((listener, chatId) => {
      if (this.database) {
        this.database.ref(`chats/${chatId}/messages`).off('child_added', listener);
      }
    });
    this.messageListeners.clear();
  }
}

// Global instance
window.firebaseChatManager = new FirebaseChatManager();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FirebaseChatManager;
}