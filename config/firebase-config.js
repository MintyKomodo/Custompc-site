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
      // Note: databaseURL is required for Realtime Database and follows the pattern:
      // https://{projectId}-default-rtdb.firebaseio.com
      const firebaseConfig = {
        apiKey: "AIzaSyANB6z6rM3lb2GZc3wTO5767fO1jB-PUjM",
        authDomain: "custompc-website.firebaseapp.com",
        projectId: "custompc-website",
        storageBucket: "custompc-website.firebasestorage.app",
        messagingSenderId: "1043646914253",
        appId: "1:1043646914253:web:eadb153333f3465ce65384",
        measurementId: "G-BF6PT2M7RX",
        // Realtime Database URL (required for messaging)
        databaseURL: "https://custompc-website-default-rtdb.firebaseio.com"
      };

      // Initialize Firebase
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }

      this.database = firebase.database();
      
      // Test connection
      try {
        await this.testConnection();
        this.isInitialized = true;
        console.log('✅ Firebase initialized and connected successfully');
        
        // Initialize global chat room
        this.initializeGlobalChat();
        
        return true;
      } catch (connectionError) {
        console.error('❌ Firebase connection test failed:', connectionError.message);
        console.log('⚠️ Firebase Realtime Database may not be enabled or rules may be blocking access');
        console.log('💡 Please check:');
        console.log('   1. Firebase Realtime Database is enabled in Firebase Console');
        console.log('   2. Database URL: https://custompc-website-default-rtdb.firebaseio.com');
        console.log('   3. Database rules allow read/write access');
        console.log('📦 Falling back to localStorage for messaging');
        return false;
      }

    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
      console.log('📦 Falling back to localStorage for messaging');
      return false;
    }
  }
  
  async testConnection() {
    return new Promise((resolve, reject) => {
      let resolved = false;
      let listener = null;
      const connectedRef = this.database.ref('.info/connected');
      
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          if (listener) {
            connectedRef.off('value', listener);
          }
          reject(new Error('Firebase connection timeout - Check your Firebase Realtime Database rules and ensure the database is enabled. The database URL should be: https://custompc-website-default-rtdb.firebaseio.com'));
        }
      }, 10000); // Increased timeout to 10 seconds
      
      listener = connectedRef.on('value', (snapshot) => {
        if (resolved) return;
        
        const isConnected = snapshot.val() === true;
        if (isConnected) {
          resolved = true;
          clearTimeout(timeout);
          connectedRef.off('value', listener);
          console.log('✅ Firebase connection confirmed');
          resolve();
        } else {
          console.log('⚠️ Waiting for Firebase connection...');
        }
      });
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
        userName: chatData.userName || currentUser?.username || 'Anonymous User',
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        lastActivity: firebase.database.ServerValue.TIMESTAMP,
        status: 'active',
        messages: {}
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
        // Handle Firebase server timestamps (they can be objects or numbers)
        let lastActivity = chat.lastActivity || chat.createdAt || 0;
        
        // If it's a Firebase server timestamp object, convert to number
        if (typeof lastActivity === 'object' && lastActivity !== null) {
          lastActivity = lastActivity.val ? lastActivity.val() : Date.now();
        }
        
        // Convert to number if it's a string
        if (typeof lastActivity === 'string') {
          lastActivity = parseInt(lastActivity) || Date.now();
        }
        
        // Check if chat is active (either status is 'active' or no status specified)
        const isActive = !chat.status || chat.status === 'active';
        
        // Include chats from last 24 hours OR if they have messages
        const hasRecentActivity = lastActivity > oneDayAgo;
        const hasMessages = chat.messages && Object.keys(chat.messages).length > 0;
        
        return isActive && (hasRecentActivity || hasMessages);
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

  // ===== ACTIVE USERS MANAGEMENT =====
  
  // Register user as active
  async registerActiveUser(sessionId, userData) {
    if (!this.isInitialized) {
      return this.registerLocalActiveUser(sessionId, userData);
    }

    try {
      const userRef = this.database.ref(`activeUsers/${sessionId}`);
      await userRef.set({
        ...userData,
        lastSeen: firebase.database.ServerValue.TIMESTAMP
      });
      console.log('✅ User registered as active:', sessionId);
    } catch (error) {
      console.error('Failed to register active user:', error);
      this.registerLocalActiveUser(sessionId, userData);
    }
  }

  // Update user presence
  async updateUserPresence(sessionId, userData) {
    if (!this.isInitialized) return;

    try {
      const userRef = this.database.ref(`activeUsers/${sessionId}`);
      await userRef.update({
        ...userData,
        lastSeen: firebase.database.ServerValue.TIMESTAMP
      });
    } catch (error) {
      console.error('Failed to update user presence:', error);
    }
  }

  // Remove user from active list
  async removeActiveUser(sessionId) {
    if (!this.isInitialized) {
      return this.removeLocalActiveUser(sessionId);
    }

    try {
      await this.database.ref(`activeUsers/${sessionId}`).remove();
      console.log('✅ User removed from active list:', sessionId);
    } catch (error) {
      console.error('Failed to remove active user:', error);
    }
  }

  // Listen for active users
  listenForActiveUsers(callback) {
    if (!this.isInitialized) {
      return this.listenForLocalActiveUsers(callback);
    }

    try {
      const activeUsersRef = this.database.ref('activeUsers');
      
      // Remove stale users (older than 5 minutes)
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      
      activeUsersRef.on('value', (snapshot) => {
        const users = snapshot.val();
        
        if (!users) {
          callback([]);
          return;
        }

        // Convert to array and filter out stale users
        const activeUsersList = Object.entries(users)
          .map(([key, value]) => ({
            sessionId: key,
            ...value
          }))
          .filter(user => {
            const lastSeen = user.lastSeen || 0;
            return lastSeen > fiveMinutesAgo;
          });

        callback(activeUsersList);
      });

      console.log('✅ Listening for active users');
    } catch (error) {
      console.error('Failed to listen for active users:', error);
      this.listenForLocalActiveUsers(callback);
    }
  }

  // Create admin-initiated chat
  async createAdminChat(chatData) {
    if (!this.isInitialized) {
      return this.createLocalAdminChat(chatData);
    }

    try {
      const chatRef = this.database.ref('adminChats').push();
      const chatId = chatRef.key;

      const adminChat = {
        ...chatData,
        id: chatId,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        lastActivity: firebase.database.ServerValue.TIMESTAMP,
        messages: {}
      };

      await chatRef.set(adminChat);
      console.log('✅ Admin chat created:', chatId);
      return chatId;
    } catch (error) {
      console.error('Failed to create admin chat:', error);
      return this.createLocalAdminChat(chatData);
    }
  }

  // Listen for user messages (for notification system)
  listenForUserMessages(username, callback) {
    if (!this.isInitialized) {
      return this.listenForLocalUserMessages(username, callback);
    }

    try {
      const userChatsRef = this.database.ref(`userChats/${username}`);
      
      userChatsRef.on('value', (snapshot) => {
        const userChats = snapshot.val();
        
        if (!userChats) {
          callback([]);
          return;
        }

        // Get all messages from all user chats
        const allMessages = [];
        
        Object.keys(userChats).forEach(chatId => {
          const messagesRef = this.database.ref(`chats/${chatId}/messages`);
          messagesRef.once('value', (msgSnapshot) => {
            const messages = msgSnapshot.val();
            if (messages) {
              Object.values(messages).forEach(msg => {
                allMessages.push({
                  ...msg,
                  chatId: chatId,
                  read: false
                });
              });
            }
            callback(allMessages);
          });
        });
      });

      console.log('✅ Listening for user messages:', username);
    } catch (error) {
      console.error('Failed to listen for user messages:', error);
      this.listenForLocalUserMessages(username, callback);
    }
  }

  // ===== LOCAL STORAGE FALLBACKS =====

  registerLocalActiveUser(sessionId, userData) {
    try {
      const activeUsers = this.getLocalActiveUsers();
      const index = activeUsers.findIndex(u => u.sessionId === sessionId);
      
      if (index >= 0) {
        activeUsers[index] = { sessionId, ...userData, lastSeen: Date.now() };
      } else {
        activeUsers.push({ sessionId, ...userData, lastSeen: Date.now() });
      }
      
      localStorage.setItem('custompc_active_users', JSON.stringify(activeUsers));
    } catch (error) {
      console.error('Failed to register local active user:', error);
    }
  }

  removeLocalActiveUser(sessionId) {
    try {
      const activeUsers = this.getLocalActiveUsers();
      const filtered = activeUsers.filter(u => u.sessionId !== sessionId);
      localStorage.setItem('custompc_active_users', JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to remove local active user:', error);
    }
  }

  getLocalActiveUsers() {
    try {
      const stored = localStorage.getItem('custompc_active_users');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  }

  listenForLocalActiveUsers(callback) {
    const pollInterval = setInterval(() => {
      const activeUsers = this.getLocalActiveUsers();
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      
      const filtered = activeUsers.filter(u => (u.lastSeen || 0) > fiveMinutesAgo);
      callback(filtered);
    }, 3000);

    return () => clearInterval(pollInterval);
  }

  createLocalAdminChat(chatData) {
    const chatId = 'admin_chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const adminChat = {
      ...chatData,
      id: chatId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      messages: {}
    };

    const adminChats = this.getLocalAdminChats();
    adminChats.push(adminChat);
    localStorage.setItem('custompc_admin_chats', JSON.stringify(adminChats));
    
    return chatId;
  }

  getLocalAdminChats() {
    try {
      const stored = localStorage.getItem('custompc_admin_chats');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  }

  listenForLocalUserMessages(username, callback) {
    const pollInterval = setInterval(() => {
      const userChats = this.getLocalUserChatHistory(username);
      const allMessages = [];
      
      userChats.forEach(chat => {
        if (chat.messages) {
          chat.messages.forEach(msg => {
            allMessages.push({
              ...msg,
              chatId: chat.chatId,
              read: false
            });
          });
        }
      });
      
      callback(allMessages);
    }, 2000);

    return () => clearInterval(pollInterval);
  }
}

// Global instance
window.firebaseChatManager = new FirebaseChatManager();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FirebaseChatManager;
}