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
        appId: "1:1043646914253:web:eadb153333f3465ce65384",
        measurementId: "G-BF6PT2M7RX"
      };

      // Initialize Firebase
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }

      this.database = firebase.database();
      
      // Test connection
      await this.testConnection();
      
      this.isInitialized = true;
      console.log('✅ Firebase initialized and connected successfully');
      
      // Initialize global chat room
      this.initializeGlobalChat();
      
      return true;

    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
      console.log('Falling back to localStorage');
      return false;
    }
  }
  
  async testConnection() {
    return new Promise((resolve, reject) => {
      const connectedRef = this.database.ref('.info/connected');
      connectedRef.on('value', (snapshot) => {
        if (snapshot.val() === true) {
          console.log('✅ Firebase connection confirmed');
          resolve();
        } else {
          console.log('⚠️ Firebase connection lost');
        }
      });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        reject(new Error('Firebase connection timeout'));
      }, 5000);
    });
  }
  
  initializeGlobalChat() {
    // Create a global chat room for the messaging page
    this.globalChatRef = this.database.ref('globalChat');
    
    // Listen for new messages
    this.globalChatRef.limitToLast(50).on('child_added', (snapshot) => {
      const message = snapshot.val();
      if (message && typeof window.addMessageToChat === 'function') {
        // Only display messages from other users to avoid duplicates
        const currentUser = window.sharedAuth ? window.sharedAuth.getCurrentUser() : null;
        const currentUsername = currentUser && currentUser.username ? currentUser.username : 'Anonymous User';
        
        if (message.username !== currentUsername || message.timestamp < Date.now() - 1000) {
          window.addMessageToChat(message.text, message.type, message.username);
        }
      }
    });
  }
  
  async sendMessageToChat(messageData) {
    if (!this.isInitialized || !this.globalChatRef) {
      throw new Error('Firebase not initialized');
    }
    
    const messageWithTimestamp = {
      ...messageData,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    };
    
    return await this.globalChatRef.push(messageWithTimestamp);
  }

  // Create a new chat session with user authentication
  async createChatSession(chatData) {
    if (!this.isInitialized) {
      return this.createLocalChatSession(chatData);
    }

    try {
      // Get current user info
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        console.warn('No user logged in, creating anonymous chat');
      }

      const chatRef = this.database.ref('chats').push();
      const chatId = chatRef.key;
      
      const chatSession = {
        ...chatData,
        id: chatId,
        userId: currentUser?.username || 'anonymous',
        userEmail: currentUser?.email || null,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        lastActivity: firebase.database.ServerValue.TIMESTAMP,
        status: 'active'
      };

      await chatRef.set(chatSession);
      
      // Also save to user's chat history if logged in
      if (currentUser) {
        await this.addChatToUserHistory(currentUser.username, chatId, chatSession);
      }
      
      console.log('Chat session created in Firebase:', chatId);
      return chatId;

    } catch (error) {
      console.error('Failed to create Firebase chat session:', error);
      return this.createLocalChatSession(chatData);
    }
  }

  // Add chat to user's personal history
  async addChatToUserHistory(username, chatId, chatData) {
    if (!this.isInitialized) return;

    try {
      const userChatRef = this.database.ref(`userChats/${username}/${chatId}`);
      await userChatRef.set({
        chatId: chatId,
        title: chatData.customerName || 'Chat Session',
        createdAt: chatData.createdAt,
        lastActivity: chatData.lastActivity,
        status: chatData.status
      });
      
      console.log('Chat added to user history:', username, chatId);
    } catch (error) {
      console.error('Failed to add chat to user history:', error);
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

  // Get current logged-in user
  getCurrentUser() {
    try {
      // Check if shared auth is available
      if (window.sharedAuth && window.sharedAuth.currentUser) {
        return window.sharedAuth.currentUser;
      }
      
      // Fallback to localStorage
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        return JSON.parse(storedUser);
      }
      
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Get user's chat history
  async getUserChatHistory(username) {
    if (!this.isInitialized) {
      return this.getLocalUserChatHistory(username);
    }

    try {
      const userChatsRef = this.database.ref(`userChats/${username}`);
      const snapshot = await userChatsRef.orderByChild('lastActivity').once('value');
      const userChats = snapshot.val();

      if (!userChats) return [];

      // Convert to array and sort by last activity (newest first)
      const chatList = Object.values(userChats).sort((a, b) => 
        (b.lastActivity || 0) - (a.lastActivity || 0)
      );

      console.log('Retrieved user chat history:', username, chatList.length, 'chats');
      return chatList;

    } catch (error) {
      console.error('Failed to get user chat history:', error);
      return this.getLocalUserChatHistory(username);
    }
  }

  // Get user's chat messages for a specific chat
  async getUserChatMessages(username, chatId) {
    if (!this.isInitialized) {
      return this.getLocalChatMessages(chatId);
    }

    try {
      // First verify the chat belongs to the user
      const userChatRef = this.database.ref(`userChats/${username}/${chatId}`);
      const userChatSnapshot = await userChatRef.once('value');
      
      if (!userChatSnapshot.exists()) {
        console.warn('Chat does not belong to user:', username, chatId);
        return [];
      }

      // Get the actual chat messages
      const messagesRef = this.database.ref(`chats/${chatId}/messages`);
      const snapshot = await messagesRef.orderByChild('timestamp').once('value');
      const messages = snapshot.val();

      if (!messages) return [];

      // Convert to array and sort by timestamp
      const messageList = Object.values(messages).sort((a, b) => 
        (a.timestamp || 0) - (b.timestamp || 0)
      );

      console.log('Retrieved user chat messages:', username, chatId, messageList.length, 'messages');
      return messageList;

    } catch (error) {
      console.error('Failed to get user chat messages:', error);
      return [];
    }
  }

  // Update chat last activity when user sends message
  async updateChatActivity(chatId, username) {
    if (!this.isInitialized) return;

    try {
      const timestamp = firebase.database.ServerValue.TIMESTAMP;
      
      // Update main chat
      await this.database.ref(`chats/${chatId}/lastActivity`).set(timestamp);
      
      // Update user's chat history
      if (username) {
        await this.database.ref(`userChats/${username}/${chatId}/lastActivity`).set(timestamp);
      }
      
    } catch (error) {
      console.error('Failed to update chat activity:', error);
    }
  }

  // Local storage fallbacks for when Firebase is not available
  getLocalUserChatHistory(username) {
    try {
      const key = `userChats_${username}`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting local user chat history:', error);
      return [];
    }
  }

  saveLocalUserChatHistory(username, chatHistory) {
    try {
      const key = `userChats_${username}`;
      localStorage.setItem(key, JSON.stringify(chatHistory));
    } catch (error) {
      console.error('Error saving local user chat history:', error);
    }
  }

  // Refresh all listeners (useful for refresh functionality)
  refreshListeners() {
    console.log('🔄 Refreshing Firebase listeners...');
    
    if (!this.isInitialized) {
      console.log('Firebase not initialized, skipping listener refresh');
      return;
    }

    try {
      // Get all current chat IDs that have listeners
      const activeChatIds = Array.from(this.messageListeners.keys());
      
      // Remove all existing listeners
      this.messageListeners.forEach((listener, chatId) => {
        if (this.database) {
          this.database.ref(`chats/${chatId}/messages`).off('child_added', listener);
        }
      });
      this.messageListeners.clear();
      
      console.log(`✅ Refreshed ${activeChatIds.length} Firebase listeners`);
      
      // Note: The listeners will be re-established when the UI calls listenForMessages again
      // This is intentional to avoid duplicate listeners
      
    } catch (error) {
      console.error('❌ Error refreshing Firebase listeners:', error);
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