/**
 * Message Notifications System
 * Displays red notification bubbles on the messages tab when new messages arrive
 */

class MessageNotifications {
  constructor() {
    this.unreadCount = 0;
    this.unreadChats = new Map();
    this.init();
  }

  init() {
    console.log('🚀 Initializing Message Notifications');
    this.setupNotificationBadge();
    this.startListeningForMessages();
  }

  setupNotificationBadge() {
    // Find or create notification badge on messaging link
    this.updateBadgeInNavbar();
    
    // Also watch for navbar changes
    const observer = new MutationObserver(() => {
      this.updateBadgeInNavbar();
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  updateBadgeInNavbar() {
    // Look for messaging link in navbar
    const messagingLinks = document.querySelectorAll('a[href*="messaging"]');
    
    messagingLinks.forEach(link => {
      // Remove old badge if exists
      const oldBadge = link.querySelector('.message-notification-badge');
      if (oldBadge) {
        oldBadge.remove();
      }

      // Add new badge if there are unread messages
      if (this.unreadCount > 0) {
        const badge = document.createElement('span');
        badge.className = 'message-notification-badge';
        badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
        badge.style.cssText = `
          position: absolute;
          top: -8px;
          right: -8px;
          background: #ff4444;
          color: white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          border: 2px solid var(--panel, #111729);
          animation: badgePulse 2s infinite;
          z-index: 1000;
        `;
        
        link.style.position = 'relative';
        link.appendChild(badge);
      }
    });

    // Add badge styles if not already added
    if (!document.getElementById('message-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'message-notification-styles';
      style.textContent = `
        @keyframes badgePulse {
          0%, 100% { 
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(255, 68, 68, 0.7);
          }
          50% { 
            transform: scale(1.1);
            box-shadow: 0 0 0 8px rgba(255, 68, 68, 0);
          }
        }

        .message-notification-badge {
          animation: badgePulse 2s infinite !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  startListeningForMessages() {
    try {
      if (!window.firebaseChatManager) {
        console.warn('Firebase not ready yet');
        setTimeout(() => this.startListeningForMessages(), 1000);
        return;
      }

      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        console.log('No user logged in, skipping message listener');
        return;
      }

      // Listen for new messages for this user
      window.firebaseChatManager.listenForUserMessages(currentUser.username, (messages) => {
        this.updateUnreadCount(messages);
      });
    } catch (error) {
      console.error('Failed to listen for messages:', error);
    }
  }

  updateUnreadCount(messages) {
    // Count unread messages
    this.unreadCount = messages.filter(m => !m.read && m.type !== 'user').length;
    
    // Update badge
    this.updateBadgeInNavbar();

    // Show browser notification if enabled
    if (this.unreadCount > 0 && Notification.permission === 'granted') {
      this.showBrowserNotification();
    }
  }

  showBrowserNotification() {
    if (document.hidden) {
      new Notification('New Message', {
        body: `You have ${this.unreadCount} unread message${this.unreadCount > 1 ? 's' : ''}`,
        icon: 'images/logo.png',
        tag: 'message-notification',
        requireInteraction: false
      });
    }
  }

  markChatAsRead(chatId) {
    this.unreadChats.delete(chatId);
    this.unreadCount = Array.from(this.unreadChats.values()).reduce((sum, count) => sum + count, 0);
    this.updateBadgeInNavbar();
  }

  addUnreadMessage(chatId) {
    const current = this.unreadChats.get(chatId) || 0;
    this.unreadChats.set(chatId, current + 1);
    this.unreadCount = Array.from(this.unreadChats.values()).reduce((sum, count) => sum + count, 0);
    this.updateBadgeInNavbar();
  }

  getCurrentUser() {
    if (window.sharedAuth?.currentUser) {
      return window.sharedAuth.currentUser;
    }
    
    try {
      const stored = localStorage.getItem('currentUser');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.messageNotifications = new MessageNotifications();
    window.messageNotifications.requestNotificationPermission();
  });
} else {
  window.messageNotifications = new MessageNotifications();
  window.messageNotifications.requestNotificationPermission();
}
