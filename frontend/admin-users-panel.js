/**
 * Admin Users Panel
 * Displays active users and allows admins to initiate chats
 */

class AdminUsersPanel {
  constructor() {
    this.activeUsers = [];
    this.selectedUser = null;
    this.init();
  }

  init() {
    console.log('🚀 Initializing Admin Users Panel');
    this.createPanel();
    this.setupEventListeners();
    window.adminPanel = this;
  }

  createPanel() {
    // Check if panel already exists
    if (document.getElementById('admin-users-panel')) {
      return;
    }

    const panel = document.createElement('div');
    panel.id = 'admin-users-panel';
    panel.className = 'admin-users-panel';
    panel.innerHTML = `
      <div class="admin-users-header">
        <div class="admin-users-title">
          <span class="users-icon">👥</span>
          <span>Active Users</span>
          <span class="users-count" id="users-count">0</span>
        </div>
        <button class="panel-toggle-btn" onclick="document.getElementById('admin-users-panel').classList.toggle('collapsed')">
          <span class="toggle-icon">−</span>
        </button>
      </div>
      
      <div class="admin-users-content">
        <div class="users-filter">
          <button class="filter-btn active" data-filter="all">All</button>
          <button class="filter-btn" data-filter="visitors">Visitors</button>
          <button class="filter-btn" data-filter="admins">Admins</button>
        </div>
        
        <div class="users-list" id="users-list">
          <div class="empty-users">
            <div class="empty-icon">👤</div>
            <div>No active users</div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(panel);
    this.addStyles();
  }

  addStyles() {
    if (document.getElementById('admin-users-panel-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'admin-users-panel-styles';
    style.textContent = `
      .admin-users-panel {
        position: fixed;
        bottom: 20px;
        left: 20px;
        width: 320px;
        background: var(--panel, #111729);
        border: 1px solid var(--border, rgba(255,255,255,.08));
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        max-height: 500px;
        font-family: system-ui, sans-serif;
        color: var(--ink, #e9eefc);
      }

      .admin-users-panel.collapsed .admin-users-content {
        display: none;
      }

      .admin-users-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border-bottom: 1px solid var(--border, rgba(255,255,255,.08));
        background: linear-gradient(135deg, rgba(125,178,255,.1), rgba(124,242,230,.1));
      }

      .admin-users-title {
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 600;
        font-size: 15px;
      }

      .users-icon {
        font-size: 18px;
      }

      .users-count {
        background: #7db2ff;
        color: #0b0f1a;
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 700;
        margin-left: 4px;
      }

      .panel-toggle-btn {
        background: none;
        border: none;
        color: var(--ink, #e9eefc);
        cursor: pointer;
        font-size: 20px;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .panel-toggle-btn:hover {
        transform: scale(1.2);
      }

      .admin-users-content {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
        overflow: hidden;
      }

      .users-filter {
        display: flex;
        gap: 6px;
        padding: 12px;
        border-bottom: 1px solid var(--border, rgba(255,255,255,.08));
        background: var(--panel2, #0d1426);
      }

      .filter-btn {
        flex: 1;
        padding: 6px 10px;
        background: transparent;
        border: 1px solid var(--border, rgba(255,255,255,.08));
        color: var(--muted, #aeb9d4);
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .filter-btn:hover {
        border-color: #7db2ff;
        color: #7db2ff;
      }

      .filter-btn.active {
        background: #7db2ff;
        border-color: #7db2ff;
        color: #0b0f1a;
        font-weight: 600;
      }

      .users-list {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
      }

      .user-item {
        padding: 12px;
        margin-bottom: 8px;
        background: var(--panel2, #0d1426);
        border: 1px solid var(--border, rgba(255,255,255,.08));
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .user-item:hover {
        background: rgba(125, 178, 255, 0.1);
        border-color: #7db2ff;
      }

      .user-item.selected {
        background: rgba(125, 178, 255, 0.15);
        border-color: #7db2ff;
        border-width: 2px;
      }

      .user-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: linear-gradient(135deg, #7db2ff, #7cf2e6);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 600;
        color: #0b0f1a;
        flex-shrink: 0;
      }

      .user-info {
        flex: 1;
        min-width: 0;
      }

      .user-name {
        font-weight: 600;
        font-size: 13px;
        margin-bottom: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .user-status {
        font-size: 11px;
        color: var(--muted, #aeb9d4);
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .status-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #00ff88;
        animation: pulse 2s infinite;
      }

      .user-actions {
        display: flex;
        gap: 6px;
      }

      .user-action-btn {
        padding: 6px 10px;
        background: #7db2ff;
        color: #0b0f1a;
        border: none;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
      }

      .user-action-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(125, 178, 255, 0.4);
      }

      .empty-users {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 30px 20px;
        color: var(--muted, #aeb9d4);
        text-align: center;
      }

      .empty-icon {
        font-size: 32px;
        margin-bottom: 10px;
        opacity: 0.5;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      @media (max-width: 768px) {
        .admin-users-panel {
          width: 280px;
          bottom: 10px;
          left: 10px;
        }

        .user-action-btn {
          padding: 4px 8px;
          font-size: 10px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  setupEventListeners() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.filterUsers(e.target.dataset.filter);
      });
    });
  }

  updateActiveUsers(users) {
    this.activeUsers = users;
    this.renderUsers('all');
  }

  filterUsers(filter) {
    this.renderUsers(filter);
  }

  renderUsers(filter = 'all') {
    const usersList = document.getElementById('users-list');
    const usersCount = document.getElementById('users-count');

    let filteredUsers = this.activeUsers;

    if (filter === 'visitors') {
      filteredUsers = this.activeUsers.filter(u => !u.isAdmin);
    } else if (filter === 'admins') {
      filteredUsers = this.activeUsers.filter(u => u.isAdmin);
    }

    usersCount.textContent = this.activeUsers.length;

    if (filteredUsers.length === 0) {
      usersList.innerHTML = `
        <div class="empty-users">
          <div class="empty-icon">👤</div>
          <div>No ${filter !== 'all' ? filter : 'active users'}</div>
        </div>
      `;
      return;
    }

    usersList.innerHTML = filteredUsers.map(user => {
      const initials = (user.username || 'U').substring(0, 2).toUpperCase();
      const isSelected = this.selectedUser?.sessionId === user.sessionId;
      
      return `
        <div class="user-item ${isSelected ? 'selected' : ''}" onclick="window.adminPanel.selectUser(event, '${user.sessionId}')">
          <div class="user-avatar">${initials}</div>
          <div class="user-info">
            <div class="user-name">${user.username || 'Anonymous'}</div>
            <div class="user-status">
              <span class="status-dot"></span>
              <span>${user.isAdmin ? '👨‍💼 Admin' : '👤 Visitor'}</span>
            </div>
          </div>
          <div class="user-actions">
            <button class="user-action-btn" onclick="window.adminPanel.startChatWithUser(event, '${user.sessionId}')">
              💬 Chat
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  selectUser(event, sessionId) {
    event.stopPropagation();
    this.selectedUser = this.activeUsers.find(u => u.sessionId === sessionId);
    this.renderUsers('all');
  }

  async startChatWithUser(event, sessionId) {
    event.stopPropagation();
    
    const user = this.activeUsers.find(u => u.sessionId === sessionId);
    if (!user) return;

    console.log('Starting chat with user:', user);

    try {
      // Create a new chat session
      if (!window.firebaseChatManager) {
        alert('Firebase not ready');
        return;
      }

      const chatData = {
        participantUsername: user.username || 'Anonymous',
        participantSessionId: sessionId,
        initiatedBy: 'admin',
        initiatedAt: new Date().toISOString(),
        status: 'active'
      };

      const chatId = await window.firebaseChatManager.createAdminChat(chatData);
      
      // Open admin chats page with this chat
      window.location.href = `admin-chats.html?chatId=${chatId}`;
    } catch (error) {
      console.error('Failed to start chat:', error);
      alert('Failed to start chat. Please try again.');
    }
  }
}

// Initialize when admin is logged in
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.sharedAuth?.isCurrentUserAdmin?.()) {
      window.adminUsersPanel = new AdminUsersPanel();
    }
  });
} else {
  if (window.sharedAuth?.isCurrentUserAdmin?.()) {
    window.adminUsersPanel = new AdminUsersPanel();
  }
}
