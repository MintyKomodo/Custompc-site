/**
 * Visitor Tracking System
 * Tracks website visitors using cookies and Firebase
 * Enables admin notifications and visitor analytics
 */

class VisitorTracker {
  constructor() {
    this.visitorId = null;
    this.sessionData = null;
    this.trackingEnabled = true;
    this.init();
  }

  async init() {
    console.log('🔍 Initializing Visitor Tracker');
    
    // Get or create visitor ID
    this.visitorId = this.getOrCreateVisitorId();
    
    // Create session data
    this.sessionData = {
      visitorId: this.visitorId,
      sessionStart: Date.now(),
      pages: [window.location.pathname],
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${window.innerWidth}x${window.innerHeight}`,
      isReturning: this.isReturningVisitor()
    };

    // Track page views
    this.trackPageView();
    
    // Listen for page changes
    window.addEventListener('popstate', () => this.trackPageView());
    
    // Track on unload
    window.addEventListener('beforeunload', () => this.saveSessionData());
    
    // Send to Firebase
    await this.sendToFirebase();
    
    console.log('✅ Visitor tracking initialized:', this.visitorId);
  }

  /**
   * Get or create a unique visitor ID stored in cookies
   */
  getOrCreateVisitorId() {
    let visitorId = this.getCookie('custompc_visitor_id');
    
    if (!visitorId) {
      // Create new visitor ID
      visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store in cookie (expires in 1 year)
      this.setCookie('custompc_visitor_id', visitorId, 365);
      
      console.log('📝 New visitor ID created:', visitorId);
    } else {
      console.log('👤 Returning visitor:', visitorId);
    }
    
    return visitorId;
  }

  /**
   * Check if this is a returning visitor
   */
  isReturningVisitor() {
    const lastVisit = this.getCookie('custompc_last_visit');
    return lastVisit !== null;
  }

  /**
   * Track page view
   */
  trackPageView() {
    const currentPage = window.location.pathname;
    
    if (!this.sessionData.pages.includes(currentPage)) {
      this.sessionData.pages.push(currentPage);
    }
    
    this.sessionData.lastPage = currentPage;
    this.sessionData.lastPageTime = Date.now();
    
    console.log('📄 Page tracked:', currentPage);
  }

  /**
   * Send visitor data to Firebase
   */
  async sendToFirebase() {
    if (!window.firebaseChatManager || !window.firebaseChatManager.isInitialized) {
      console.log('⏳ Firebase not ready, will retry...');
      setTimeout(() => this.sendToFirebase(), 2000);
      return;
    }

    try {
      const database = window.firebaseChatManager.database;
      
      const visitorRef = database.ref(`visitors/${this.visitorId}`);
      
      await visitorRef.set({
        ...this.sessionData,
        lastUpdated: firebase.database.ServerValue.TIMESTAMP,
        isActive: true
      });
      
      // Update last visit cookie
      this.setCookie('custompc_last_visit', new Date().toISOString(), 365);
      
      console.log('✅ Visitor data sent to Firebase');
    } catch (error) {
      console.error('❌ Failed to send visitor data to Firebase:', error);
    }
  }

  /**
   * Save session data to localStorage as backup
   */
  saveSessionData() {
    try {
      localStorage.setItem(`session_${this.visitorId}`, JSON.stringify(this.sessionData));
      console.log('💾 Session data saved to localStorage');
    } catch (error) {
      console.error('Failed to save session data:', error);
    }
  }

  /**
   * Cookie management utilities
   */
  setCookie(name, value, days = 7) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax`;
  }

  getCookie(name) {
    const nameEQ = `${name}=`;
    const cookies = document.cookie.split(';');
    
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.indexOf(nameEQ) === 0) {
        return cookie.substring(nameEQ.length);
      }
    }
    
    return null;
  }

  /**
   * Get all visitor cookies
   */
  getAllVisitorCookies() {
    return {
      visitorId: this.getCookie('custompc_visitor_id'),
      lastVisit: this.getCookie('custompc_last_visit'),
      preferences: this.getCookie('custompc_preferences')
    };
  }

  /**
   * Store user preferences in cookie
   */
  setPreferences(preferences) {
    this.setCookie('custompc_preferences', JSON.stringify(preferences), 365);
    console.log('✅ Preferences saved');
  }

  /**
   * Get user preferences from cookie
   */
  getPreferences() {
    const prefs = this.getCookie('custompc_preferences');
    return prefs ? JSON.parse(prefs) : {};
  }

  /**
   * Track custom events
   */
  async trackEvent(eventName, eventData = {}) {
    try {
      if (!window.firebaseChatManager || !window.firebaseChatManager.isInitialized) {
        console.log('Firebase not ready for event tracking');
        return;
      }

      const database = window.firebaseChatManager.database;
      const eventRef = database.ref(`events/${this.visitorId}/${Date.now()}`);
      
      await eventRef.set({
        eventName,
        eventData,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        page: window.location.pathname
      });
      
      console.log('📊 Event tracked:', eventName);
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  /**
   * Track form submissions
   */
  async trackFormSubmission(formName, formData = {}) {
    await this.trackEvent('form_submission', {
      formName,
      formData,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track button clicks
   */
  async trackButtonClick(buttonName, buttonData = {}) {
    await this.trackEvent('button_click', {
      buttonName,
      buttonData,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get visitor count (for admin)
   */
  static async getVisitorCount() {
    if (!window.firebaseChatManager || !window.firebaseChatManager.isInitialized) {
      return 0;
    }

    try {
      const database = window.firebaseChatManager.database;
      const visitorsRef = database.ref('visitors');
      const snapshot = await visitorsRef.once('value');
      const visitors = snapshot.val();
      
      if (!visitors) return 0;
      
      // Count active visitors (last 30 minutes)
      const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
      const activeVisitors = Object.values(visitors).filter(v => {
        const lastUpdated = v.lastUpdated || 0;
        return lastUpdated > thirtyMinutesAgo;
      });
      
      return activeVisitors.length;
    } catch (error) {
      console.error('Failed to get visitor count:', error);
      return 0;
    }
  }

  /**
   * Get all visitors (for admin)
   */
  static async getAllVisitors() {
    if (!window.firebaseChatManager || !window.firebaseChatManager.isInitialized) {
      return [];
    }

    try {
      const database = window.firebaseChatManager.database;
      const visitorsRef = database.ref('visitors');
      const snapshot = await visitorsRef.once('value');
      const visitors = snapshot.val();
      
      if (!visitors) return [];
      
      return Object.entries(visitors).map(([id, data]) => ({
        visitorId: id,
        ...data
      }));
    } catch (error) {
      console.error('Failed to get all visitors:', error);
      return [];
    }
  }

  /**
   * Listen for new visitors (for admin notifications)
   */
  static listenForNewVisitors(callback) {
    if (!window.firebaseChatManager || !window.firebaseChatManager.isInitialized) {
      console.log('Firebase not ready for visitor listening');
      return;
    }

    try {
      const database = window.firebaseChatManager.database;
      const visitorsRef = database.ref('visitors');
      
      visitorsRef.on('child_added', (snapshot) => {
        const visitor = snapshot.val();
        if (visitor) {
          callback({
            visitorId: snapshot.key,
            ...visitor
          });
        }
      });
      
      console.log('✅ Listening for new visitors');
    } catch (error) {
      console.error('Failed to listen for new visitors:', error);
    }
  }

  /**
   * Send notification to admin about new visitor
   */
  static async notifyAdminNewVisitor(visitorData) {
    if (!window.firebaseChatManager || !window.firebaseChatManager.isInitialized) {
      return;
    }

    try {
      const database = window.firebaseChatManager.database;
      const notificationRef = database.ref(`adminNotifications/${Date.now()}`);
      
      await notificationRef.set({
        type: 'new_visitor',
        visitorId: visitorData.visitorId,
        visitorData,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        read: false
      });
      
      console.log('🔔 Admin notification sent for new visitor');
    } catch (error) {
      console.error('Failed to send admin notification:', error);
    }
  }

  /**
   * Clear all visitor cookies (for testing)
   */
  clearAllCookies() {
    document.cookie = 'custompc_visitor_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'custompc_last_visit=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'custompc_preferences=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    console.log('🗑️ All visitor cookies cleared');
  }
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.visitorTracker = new VisitorTracker();
  });
} else {
  window.visitorTracker = new VisitorTracker();
}
