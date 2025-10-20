// Shared authentication system for all pages

class SharedAuth {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  init() {
    this.currentUser = this.getCurrentUser();
    this.setupAuthUI();
    this.setupEventListeners();
  }

  // Get current user from storage (check both formats)
  getCurrentUser() {
    // Check new format first
    const userData = localStorage.getItem('custompc_user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return {
          username: user.username,
          email: user.email || null,
          loginTime: user.loginTime || user.signupTime || null
        };
      } catch (e) {
        console.warn('Invalid user data format, clearing...');
        localStorage.removeItem('custompc_user');
      }
    }
    
    // Check legacy format
    const legacyUser = localStorage.getItem('custompc_username');
    if (legacyUser) {
      return {
        username: legacyUser,
        email: null,
        loginTime: null
      };
    }
    
    return null;
  }

  // Set up authentication UI elements
  setupAuthUI() {
    // Find all navigation containers
    const navContainers = document.querySelectorAll('nav, .topnav, header nav');
    
    navContainers.forEach(nav => {
      this.addAuthToNav(nav);
    });

    // Update brand text if user is logged in
    this.updateBrandText();
  }

  // Add authentication elements to a navigation container
  addAuthToNav(nav) {
    // Check if auth elements already exist
    if (nav.querySelector('.auth-section')) return;

    // Create auth section
    const authSection = document.createElement('div');
    authSection.className = 'auth-section';
    authSection.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: auto;
    `;

    // User display span
    const userDisplay = document.createElement('span');
    userDisplay.id = 'user-display';
    userDisplay.style.cssText = `
      display: none;
      color: #7db2ff;
      font-weight: 600;
      font-size: 0.9rem;
    `;

    // Login button
    const loginBtn = document.createElement('button');
    loginBtn.id = 'login-btn';
    loginBtn.textContent = 'Login';
    loginBtn.className = 'pill';
    loginBtn.style.cssText = `
      background: #7db2ff;
      color: #0b0f1a;
      border: 0;
      cursor: pointer;
      padding: 8px 14px;
      border-radius: 999px;
      font-weight: 600;
      transition: all 0.2s ease;
    `;

    // Logout button
    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'logout-btn';
    logoutBtn.textContent = 'Logout';
    logoutBtn.className = 'pill';
    logoutBtn.style.cssText = `
      display: none;
      background: #111729;
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #e9eefc;
      cursor: pointer;
      padding: 8px 14px;
      border-radius: 999px;
      font-weight: 600;
      transition: all 0.2s ease;
    `;

    // Add hover effects
    loginBtn.addEventListener('mouseenter', () => {
      loginBtn.style.background = '#6ba3ff';
    });
    loginBtn.addEventListener('mouseleave', () => {
      loginBtn.style.background = '#7db2ff';
    });

    logoutBtn.addEventListener('mouseenter', () => {
      logoutBtn.style.background = '#1a2332';
    });
    logoutBtn.addEventListener('mouseleave', () => {
      logoutBtn.style.background = '#111729';
    });

    // Append elements
    authSection.appendChild(userDisplay);
    authSection.appendChild(loginBtn);
    authSection.appendChild(logoutBtn);
    // Update display based on current user
    this.updateAuthDisplay(userDisplay, loginBtn, logoutBtn);
    
    // Ensure the auth section is actually added to the navigation
    // so the Login/Logout controls are visible site-wide
    nav.appendChild(authSection);
  }

  // Update authentication display
  updateAuthDisplay(userDisplay, loginBtn, logoutBtn) {
    // Do not show 'Welcome, username'
    userDisplay.style.display = 'none';

    if (this.currentUser) {
      loginBtn.style.display = 'none';
      logoutBtn.style.display = 'inline-block';
    } else {
      loginBtn.style.display = 'inline-block';
      logoutBtn.style.display = 'none';
    }
  }

  // Update brand text to show user name
  updateBrandText() {
    const brandElements = document.querySelectorAll('.brand a span, .brand span');
    brandElements.forEach(brandSpan => {
      // Store original text if not already stored
      if (!brandSpan.dataset.originalText) {
        brandSpan.dataset.originalText = brandSpan.textContent;
      }
      
      // Show user name if logged in, otherwise show original brand text
      if (this.currentUser && this.currentUser.username) {
        brandSpan.textContent = this.currentUser.username;
        brandSpan.style.color = '#7db2ff';
      } else {
        brandSpan.textContent = brandSpan.dataset.originalText;
        brandSpan.style.color = '';
      }
    });
  }

  // Set up event listeners
  setupEventListeners() {
    // Login button clicks
    document.addEventListener('click', (e) => {
      if (e.target.id === 'login-btn') {
        window.location.href = 'login.html';
      }
    });

    // Logout button clicks
    document.addEventListener('click', (e) => {
      if (e.target.id === 'logout-btn') {
        this.logout();
      }
    });

    // Listen for storage changes (when user logs in from another tab)
    window.addEventListener('storage', (e) => {
      if (e.key === 'custompc_user' || e.key === 'custompc_username') {
        this.currentUser = this.getCurrentUser();
        this.refreshAuthUI();
      }
    });

    // Listen for custom auth events
    window.addEventListener('authStateChanged', () => {
      this.currentUser = this.getCurrentUser();
      this.refreshAuthUI();
    });
  }

  // Logout function
  logout() {
    if (confirm('Are you sure you want to logout?')) {
      // Clear all auth-related storage
      localStorage.removeItem('custompc_username');
      localStorage.removeItem('custompc_user_hash');
      localStorage.removeItem('custompc_user');
      
      this.currentUser = null;
      this.refreshAuthUI();
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('authStateChanged'));
      
      // Redirect to home page
      window.location.href = 'index.html';
    }
  }

  // Refresh all auth UI elements
  refreshAuthUI() {
    // Update all user displays
    const userDisplays = document.querySelectorAll('#user-display');
    const loginBtns = document.querySelectorAll('#login-btn');
    const logoutBtns = document.querySelectorAll('#logout-btn');

    for (let i = 0; i < userDisplays.length; i++) {
      this.updateAuthDisplay(userDisplays[i], loginBtns[i], logoutBtns[i]);
    }

    // Update brand text
    this.updateBrandText();
  }

  // Static method to trigger auth state change
  static triggerAuthStateChange() {
    window.dispatchEvent(new CustomEvent('authStateChanged'));
  }
}

// Initialize shared auth when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.sharedAuth = new SharedAuth();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SharedAuth;
} else {
  window.SharedAuth = SharedAuth;
}