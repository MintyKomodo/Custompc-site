/**
 * Visitor Dashboard for Admins
 * View active visitors and send them notifications
 */

class VisitorDashboard {
  constructor() {
    this.activeVisitors = [];
    this.selectedVisitor = null;
    this.init();
  }

  async init() {
    console.log('📊 Initializing Visitor Dashboard');
    
    // Wait for Firebase to be ready
    let attempts = 0;
    while (!window.firebaseChatManager?.isInitialized && attempts < 10) {
      await new Promise(r => setTimeout(r, 500));
      attempts++;
    }

    if (!window.firebaseChatManager?.isInitialized) {
      console.error('Firebase not initialized');
      return;
    }

    // Start listening for visitors
    this.startListeningForVisitors();
    
    // Refresh visitor count every 10 seconds
    setInterval(() => this.refreshVisitorCount(), 10000);
  }

  /**
   * Start listening for active visitors
   */
  startListeningForVisitors() {
    try {
      const database = window.firebaseChatManager.database;
      const visitorsRef = database.ref('visitors');
      
      visitorsRef.on('value', (snapshot) => {
        const visitors = snapshot.val();
        
        if (!visitors) {
          this.activeVisitors = [];
          this.updateDashboardUI();
          return;
        }

        // Filter active visitors (last 30 minutes)
        const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
        this.activeVisitors = Object.entries(visitors)
          .map(([id, data]) => ({
            visitorId: id,
            ...data
          }))
          .filter(v => {
            const lastUpdated = v.lastUpdated || 0;
            return lastUpdated > thirtyMinutesAgo;
          })
          .sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));

        this.updateDashboardUI();
        console.log(`📊 Active visitors: ${this.activeVisitors.length}`);
      });

      console.log('✅ Listening for visitors');
    } catch (error) {
      console.error('Failed to listen for visitors:', error);
    }
  }

  /**
   * Update dashboard UI
   */
  updateDashboardUI() {
    const container = document.getElementById('visitor-list');
    if (!container) return;

    if (this.activeVisitors.length === 0) {
      container.innerHTML = '<p style="color: var(--muted); text-align: center; padding: 20px;">No active visitors</p>';
      return;
    }

    container.innerHTML = this.activeVisitors.map(visitor => `
      <div class="visitor-card" data-visitor-id="${visitor.visitorId}">
        <div class="visitor-header">
          <div class="visitor-info">
            <div class="visitor-id">${visitor.visitorId.substring(0, 20)}...</div>
            <div class="visitor-page">${visitor.lastPage || visitor.pages?.[0] || '/'}</div>
          </div>
          <div class="visitor-time">${this.formatTime(visitor.lastUpdated)}</div>
        </div>
        <div class="visitor-details">
          <span class="detail-badge">${visitor.isReturning ? '🔄 Returning' : '🆕 New'}</span>
          <span class="detail-badge">${visitor.pages?.length || 1} pages</span>
          <span class="detail-badge">${visitor.language || 'Unknown'}</span>
        </div>
        <div class="visitor-actions">
          <button class="action-btn" onclick="window.visitorDashboard.selectVisitor('${visitor.visitorId}')">
            💬 Send Message
          </button>
          <button class="action-btn secondary" onclick="window.visitorDashboard.viewDetails('${visitor.visitorId}')">
            👁️ View Details
          </button>
        </div>
      </div>
    `).join('');
  }

  /**
   * Select a visitor to send message
   */
  selectVisitor(visitorId) {
    this.selectedVisitor = this.activeVisitors.find(v => v.visitorId === visitorId);
    this.showMessageModal();
  }

  /**
   * Show message modal
   */
  showMessageModal() {
    if (!this.selectedVisitor) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Send Message to Visitor</h3>
          <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <div class="modal-body">
          <div class="visitor-info-box">
            <p><strong>Visitor ID:</strong> ${this.selectedVisitor.visitorId}</p>
            <p><strong>Current Page:</strong> ${this.selectedVisitor.lastPage || '/'}</p>
            <p><strong>Pages Visited:</strong> ${this.selectedVisitor.pages?.length || 1}</p>
          </div>
          <div class="form-group">
            <label for="message-text">Message</label>
            <textarea id="message-text" placeholder="Type your message..." style="
              width: 100%;
              padding: 12px;
              border: 1px solid var(--border);
              border-radius: 8px;
              background: var(--panel);
              color: var(--ink);
              font-family: inherit;
              min-height: 100px;
              resize: vertical;
            "></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
          <button class="btn-send" onclick="window.visitorDashboard.sendMessage()">Send Message</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  /**
   * Send message to visitor
   */
  async sendMessage() {
    const messageText = document.getElementById('message-text')?.value;
    
    if (!messageText || !this.selectedVisitor) {
      alert('Please enter a message');
      return;
    }

    try {
      const database = window.firebaseChatManager.database;
      const messageRef = database.ref(`visitorMessages/${this.selectedVisitor.visitorId}/${Date.now()}`);
      
      await messageRef.set({
        message: messageText,
        from: 'admin',
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        read: false
      });

      console.log('✅ Message sent to visitor');
      
      // Close modal
      document.querySelector('.modal-overlay')?.remove();
      
      // Show success notification
      this.showNotification('Message sent successfully!', 'success');
    } catch (error) {
      console.error('Failed to send message:', error);
      this.showNotification('Failed to send message', 'error');
    }
  }

  /**
   * View visitor details
   */
  viewDetails(visitorId) {
    const visitor = this.activeVisitors.find(v => v.visitorId === visitorId);
    if (!visitor) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Visitor Details</h3>
          <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <div class="modal-body">
          <div class="details-grid">
            <div class="detail-item">
              <strong>Visitor ID</strong>
              <p>${visitor.visitorId}</p>
            </div>
            <div class="detail-item">
              <strong>Session Start</strong>
              <p>${new Date(visitor.sessionStart).toLocaleString()}</p>
            </div>
            <div class="detail-item">
              <strong>Last Activity</strong>
              <p>${new Date(visitor.lastUpdated).toLocaleString()}</p>
            </div>
            <div class="detail-item">
              <strong>Pages Visited</strong>
              <p>${visitor.pages?.length || 1}</p>
            </div>
            <div class="detail-item">
              <strong>Language</strong>
              <p>${visitor.language || 'Unknown'}</p>
            </div>
            <div class="detail-item">
              <strong>Timezone</strong>
              <p>${visitor.timezone || 'Unknown'}</p>
            </div>
            <div class="detail-item">
              <strong>Screen Resolution</strong>
              <p>${visitor.screenResolution || 'Unknown'}</p>
            </div>
            <div class="detail-item">
              <strong>Visitor Type</strong>
              <p>${visitor.isReturning ? '🔄 Returning' : '🆕 New'}</p>
            </div>
          </div>
          <div class="pages-visited">
            <strong>Pages Visited:</strong>
            <ul>
              ${(visitor.pages || []).map(page => `<li>${page}</li>`).join('')}
            </ul>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" onclick="this.closest('.modal-overlay').remove()">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  /**
   * Refresh visitor count
   */
  async refreshVisitorCount() {
    try {
      const count = await VisitorTracker.getVisitorCount();
      const countElement = document.getElementById('visitor-count');
      if (countElement) {
        countElement.textContent = count;
      }
    } catch (error) {
      console.error('Failed to refresh visitor count:', error);
    }
  }

  /**
   * Format time difference
   */
  formatTime(timestamp) {
    if (!timestamp) return 'Unknown';
    
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    
    return new Date(timestamp).toLocaleDateString();
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 20px;
      border-radius: 8px;
      background: ${type === 'success' ? '#10b981' : '#ef4444'};
      color: white;
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.visitorDashboard = new VisitorDashboard();
  });
} else {
  window.visitorDashboard = new VisitorDashboard();
}
