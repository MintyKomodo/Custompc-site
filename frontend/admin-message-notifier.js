/**
 * Admin Message Notifier
 * Tracks when admin sends messages and notifies users with badge + sound
 */

class AdminMessageNotifier {
  constructor() {
    this.notificationSound = null;
    this.init();
  }

  async init() {
    console.log('🔔 Initializing Admin Message Notifier...');
    
    // Wait for Firebase to be ready
    let attempts = 0;
    while (!window.firebaseChatManager?.isInitialized && attempts < 20) {
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }

    if (!window.firebaseChatManager?.isInitialized) {
      console.warn('⚠️ Firebase not available for message notifications');
      return;
    }

    // Create notification sound
    this.createNotificationSound();
    
    // Start listening for admin messages
    this.listenForAdminMessages();
    
    console.log('✅ Admin Message Notifier initialized');
  }

  createNotificationSound() {
    // Create audio element for notification sound
    this.notificationSound = new Audio();
    // Using a notification sound from a reliable CDN
    this.notificationSound.src = 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3';
    this.notificationSound.volume = 0.7;
    this.notificationSound.preload = 'auto';
  }

  listenForAdminMessages() {
    // Get current user
    const currentUser = this.getCurrentUser();
    if (!currentUser || !currentUser.username) {
      console.log('No user logged in, skipping message listener');
      return;
    }

    console.log('👂 Listening for admin messages for user:', currentUser.username);

    // Listen to all chats where this user is involved
    const chatsRef = window.firebaseChatManager.database.ref('chats');
    
    chatsRef.on('child_changed', (snapshot) => {
      const chatData = snapshot.val();
      const chatId = snapshot.key;
      
      // Check if this chat belongs to the current user
      if (chatData.info && chatData.info.username === currentUser.username) {
        this.checkForNewAdminMessages(chatId, chatData);
      }
    });
  }

  async checkForNewAdminMessages(chatId, chatData) {
    try {
      // Get the last message
      if (!chatData.messages) return;
      
      const messages = Object.values(chatData.messages);
      const lastMessage = messages[messages.length - 1];
      
      // Check if it's an admin message
      if (lastMessage && lastMessage.type === 'admin') {
        // Check if we've already notified about this message
        const lastNotifiedKey = `last_notified_${chatId}`;
        const lastNotifiedTimestamp = localStorage.getItem(lastNotifiedKey);
        
        if (!lastNotifiedTimestamp || lastMessage.timestamp > parseInt(lastNotifiedTimestamp)) {
          // New admin message!
          console.log('🆕 New admin message detected!');
          
          // Increment unread count
          this.incrementUnreadCount();
          
          // Play notification sound
          this.playNotificationSound();
          
          // Show browser notification
          this.showBrowserNotification(lastMessage.text || 'New message from admin');
          
          // Save this timestamp
          localStorage.setItem(lastNotifiedKey, lastMessage.timestamp.toString());
        }
      }
    } catch (error) {
      console.error('Error checking for new admin messages:', error);
    }
  }

  incrementUnreadCount() {
    const currentUser = this.getCurrentUser();
    if (!currentUser || !currentUser.username) return;

    const unreadKey = `unread_messages_${currentUser.username}`;
    const currentCount = parseInt(localStorage.getItem(unreadKey) || '0');
    const newCount = currentCount + 1;
    
    localStorage.setItem(unreadKey, newCount.toString());
    console.log('📬 Unread count incremented to:', newCount);
    
    // Update navbar badge if it exists
    if (window.navigationBar) {
      window.navigationBar.updateUnreadBadge();
    }
  }

  playNotificationSound() {
    if (this.notificationSound) {
      this.notificationSound.play().catch(error => {
        console.warn('Could not play notification sound:', error);
      });
    }
  }

  showBrowserNotification(messageText) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('💬 New Message from CustomPC.tech', {
        body: messageText.substring(0, 100),
        icon: 'images/logo.png',
        badge: 'images/logo.png',
        tag: 'admin-message',
        requireInteraction: false
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.showBrowserNotification(messageText);
        }
      });
    }
  }

  getCurrentUser() {
    if (window.sharedAuth && window.sharedAuth.currentUser) {
      return window.sharedAuth.currentUser;
    }
    
    try {
      const userData = localStorage.getItem('custompc_user');
      if (userData) {
        return JSON.parse(userData);
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
    
    return null;
  }

  // Method to clear unread count (call when user opens messages)
  static clearUnreadCount() {
    const currentUser = window.sharedAuth?.getCurrentUser();
    if (!currentUser || !currentUser.username) return;

    const unreadKey = `unread_messages_${currentUser.username}`;
    localStorage.setItem(unreadKey, '0');
    
    // Update navbar badge
    if (window.navigationBar) {
      window.navigationBar.updateUnreadBadge();
    }
    
    console.log('✅ Unread count cleared');
  }
}

// Initialize globally
window.adminMessageNotifier = new AdminMessageNotifier();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdminMessageNotifier;
}
