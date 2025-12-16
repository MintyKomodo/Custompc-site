/**
 * Active Users Management System
 * Tracks and displays users currently on the website
 * Allows admins to initiate chats with them
 */

class ActiveUsersManager {
  constructor() {
    this.activeUsers = new Map();
    this.sessionId = this.generateSessionId();
    this.updateInterval = null;
    this.init();
  }

  generateSessionId() {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async init() {
    console.log('🚀 Initializing Active Users Manager');
    
    // Register this user as active
    await this.registerUserAsActive();
    
    // Start listening for active users
    this.startListeningForActiveUsers();
    
    // Periodically update user presence
    this.updateInterval = setInterval(() => {
      this.updateUserPresence();
    }, 30000); // Update every 30 seconds
    
    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
      this.unregisterUser();
    });
  }

  async registerUserAsActive() {
    try {
      if (!window.firebaseChatManager) {
        console.warn('Firebase not ready yet');
        return;
      }

      const userData = {
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        page: window.location.pathname,
        userAgent: navigator.userAgent.substring(0, 100),
        isAdmin: window.sharedAuth?.isCurrentUserAdmin?.() || false,
        username: window.sharedAuth?.currentUser?.username || 'Anonymous'
      };

      await window.firebaseChatManager.registerActiveUser(this.sessionId, userData);
      console.log('✅ User registered as active');
    } catch (error) {
      console.error('Failed to register user as active:', error);
    }
  }

  async updateUserPresence() {
    try {
      if (!window.firebaseChatManager) return;

      const userData = {
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        page: window.location.pathname,
        isAdmin: window.sharedAuth?.isCurrentUserAdmin?.() || false,
        username: window.sharedAuth?.currentUser?.username || 'Anonymous'
      };

      await window.firebaseChatManager.updateUserPresence(this.sessionId, userData);
    } catch (error) {
      console.error('Failed to update user presence:', error);
    }
  }

  async unregisterUser() {
    try {
      if (!window.firebaseChatManager) return;
      await window.firebaseChatManager.removeActiveUser(this.sessionId);
      console.log('✅ User unregistered');
    } catch (error) {
      console.error('Failed to unregister user:', error);
    }
  }

  startListeningForActiveUsers() {
    try {
      if (!window.firebaseChatManager) {
        console.warn('Firebase not ready yet');
        setTimeout(() => this.startListeningForActiveUsers(), 1000);
        return;
      }

      window.firebaseChatManager.listenForActiveUsers((users) => {
        this.activeUsers = new Map(users);
        this.updateActiveUsersUI();
        
        // Notify admin panel if it exists
        if (window.adminPanel) {
          window.adminPanel.updateActiveUsers(users);
        }
      });
    } catch (error) {
      console.error('Failed to listen for active users:', error);
    }
  }

  updateActiveUsersUI() {
    // This will be called from admin panel
    console.log(`📊 Active users updated: ${this.activeUsers.size}`);
  }

  getActiveUsers() {
    return Array.from(this.activeUsers.values());
  }

  getActiveUserCount() {
    return this.activeUsers.size;
  }

  getAdminCount() {
    return Array.from(this.activeUsers.values()).filter(u => u.isAdmin).length;
  }

  getVisitorCount() {
    return this.getActiveUserCount() - this.getAdminCount();
  }
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.activeUsersManager = new ActiveUsersManager();
  });
} else {
  window.activeUsersManager = new ActiveUsersManager();
}
