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
    
    // Update payments navigation display
    this.updatePaymentsNavDisplay();
  }

  // Add authentication elements to a navigation container
  addAuthToNav(nav) {
    // Check if auth elements already exist
    if (nav.querySelector('#login-btn') || nav.querySelector('#logout-btn')) return;

    // Login button as a navigation pill
    const loginBtn = document.createElement('a');
    loginBtn.id = 'login-btn';
    loginBtn.textContent = 'Login';
    loginBtn.className = 'pill';
    loginBtn.href = '#';
    loginBtn.style.cssText = `
      cursor: pointer;
    `;

    // Logout button as a navigation pill
    const logoutBtn = document.createElement('a');
    logoutBtn.id = 'logout-btn';
    logoutBtn.textContent = 'Logout';
    logoutBtn.className = 'pill';
    logoutBtn.href = '#';
    logoutBtn.style.cssText = `
      display: none;
      cursor: pointer;
    `;

    // Add Payments navigation item for admin users
    this.addPaymentsNavItem(nav);

    // Update display based on current user
    this.updateAuthDisplay(null, loginBtn, logoutBtn);
    
    // Add buttons directly to nav as pills
    nav.appendChild(loginBtn);
    nav.appendChild(logoutBtn);
  }

  // Add Payments navigation item for admin users
  addPaymentsNavItem(nav) {
    // Check if payments nav already exists
    if (nav.querySelector('#payments-nav')) return;

    // Create payments navigation item
    const paymentsNav = document.createElement('a');
    paymentsNav.id = 'payments-nav';
    paymentsNav.textContent = 'Payments';
    paymentsNav.className = 'pill';
    paymentsNav.href = 'payments.html';
    paymentsNav.style.cssText = `
      display: none;
      cursor: pointer;
    `;

    // Insert payments nav before auth buttons (find the right position)
    const existingNavItems = nav.querySelectorAll('.pill:not(#login-btn):not(#logout-btn)');
    if (existingNavItems.length > 0) {
      // Insert after the last existing nav item
      const lastNavItem = existingNavItems[existingNavItems.length - 1];
      lastNavItem.insertAdjacentElement('afterend', paymentsNav);
    } else {
      // Insert at the beginning of nav
      nav.insertBefore(paymentsNav, nav.firstChild);
    }
  }

  // Update authentication display
  updateAuthDisplay(userDisplay, loginBtn, logoutBtn) {
    if (this.currentUser) {
      loginBtn.style.display = 'none';
      logoutBtn.style.display = 'inline-block';
    } else {
      loginBtn.style.display = 'inline-block';
      logoutBtn.style.display = 'none';
    }
    
    // Update payments navigation visibility
    this.updatePaymentsNavDisplay();
  }

  // Check if current user is admin
  isCurrentUserAdmin() {
    if (!this.currentUser) return false;
    
    // Admin credentials for validation
    const adminCredentials = {
      username: "Minty-Komodo",
      email: "griffin@crowhurst.ws"
    };
    
    // Check if current user matches admin credentials
    return this.currentUser.username === adminCredentials.username &&
           this.currentUser.email === adminCredentials.email;
  }

  // Update payments navigation display based on admin status
  updatePaymentsNavDisplay() {
    const paymentsNavItems = document.querySelectorAll('#payments-nav');
    const isAdmin = this.isCurrentUserAdmin();
    
    paymentsNavItems.forEach(nav => {
      nav.style.display = isAdmin ? 'inline-block' : 'none';
      
      // Add visual indicator for admin status
      if (isAdmin) {
        nav.setAttribute('title', 'Admin Payment Processing');
        nav.style.background = 'linear-gradient(120deg,rgba(125,178,255,.15),rgba(124,242,230,.15))';
        nav.style.borderColor = 'rgba(125,178,255,.3)';
      }
    });
    
    // Log navigation update for debugging
    console.log('Navigation updated:', {
      isAdmin: isAdmin,
      paymentsNavCount: paymentsNavItems.length,
      currentUser: this.currentUser
    });
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
        e.preventDefault();
        // Check if we're in a builds subdirectory
        const isInBuilds = window.location.pathname.includes('/builds/');
        window.location.href = isInBuilds ? '../login.html' : 'login.html';
      }
    });

    // Logout button clicks
    document.addEventListener('click', (e) => {
      if (e.target.id === 'logout-btn') {
        e.preventDefault();
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
    // Update all auth buttons
    const loginBtns = document.querySelectorAll('#login-btn');
    const logoutBtns = document.querySelectorAll('#logout-btn');

    for (let i = 0; i < loginBtns.length; i++) {
      this.updateAuthDisplay(null, loginBtns[i], logoutBtns[i]);
    }

    // Update brand text
    this.updateBrandText();
    
    // Update payments navigation
    this.updatePaymentsNavDisplay();
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