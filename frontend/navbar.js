/**
 * Shared Navigation Bar Component
 * Consistent navbar across all pages with dynamic active states
 */

class NavigationBar {
  constructor() {
    this.currentPage = this.getCurrentPage();
    this.init();
  }

  getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    return page.replace('.html', '');
  }

  init() {
    this.createAnnouncementBar();
    this.createNavbar();
    this.setupScrollEffects();
  }

  createAnnouncementBar() {
    const announcementBar = document.createElement('div');
    announcementBar.className = 'announcement-bar';
    announcementBar.id = 'announcement-bar';
    announcementBar.innerHTML = `
      <span>🎉 <strong>New!</strong> User chat history now saves across devices! <a href="messaging.html">Try it now →</a></span>
      <button onclick="window.navigationBar.closeAnnouncementBar()" style="
        position: absolute;
        right: 20px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        opacity: 0.8;
        padding: 0;
        line-height: 1;
      ">×</button>
    `;

    // Check if previously closed
    const wasClosed = localStorage.getItem('announcementBarClosed');
    if (wasClosed === 'true') {
      announcementBar.style.display = 'none';
    }

    document.body.insertBefore(announcementBar, document.body.firstChild);
  }

  createNavbar() {
    const header = document.createElement('header');
    header.id = 'main-header';
    
    // Check if user is logged in
    const currentUser = this.getCurrentUser();
    const isLoggedIn = currentUser && currentUser.username;
    
    // Build Custom PC dropdown menu
    const customPCDropdown = this.buildCustomPCDropdown();
    
    // Build auth buttons
    const authButtons = this.buildAuthButtons(isLoggedIn, currentUser);
    
    header.innerHTML = `
      <div class="brand">
        <a href="index.html">
          <img src="images/logo.png" alt="CustomPC.tech logo"
            style="height:60px;width:60px;display:inline-block;vertical-align:middle;object-fit:contain;border-radius:50%;" />
        </a>
      </div>

      <nav style="display: flex; align-items: center; gap: var(--space);">
        <a class="pill ${this.isActive('builds')}" href="builds.html">Builds</a>
        ${customPCDropdown}
        <a class="pill ${this.isActive('about')}" href="about.html">About</a>
        <a class="pill ${this.isActive('contact')}" href="contact.html">Contact</a>
        ${authButtons}
      </nav>
    `;

    // Insert after announcement bar
    const announcementBar = document.getElementById('announcement-bar');
    if (announcementBar) {
      announcementBar.insertAdjacentElement('afterend', header);
    } else {
      document.body.insertBefore(header, document.body.firstChild);
    }
  }

  buildAuthButtons(isLoggedIn, currentUser) {
    if (isLoggedIn) {
      // Show username and logout button
      return `
        <div class="auth-section">
          <span class="username-display">👤 ${currentUser.username}</span>
          <button onclick="window.navigationBar.logout()" class="btn-logout">Logout</button>
        </div>
      `;
    } else {
      // Show login/signup buttons
      return `
        <div class="auth-section">
          <a href="login.html" class="btn-login">Login</a>
          <a href="signup.html" class="btn-signup">Sign Up</a>
        </div>
      `;
    }
  }

  getCurrentUser() {
    // Check if shared auth is available
    if (window.sharedAuth && window.sharedAuth.currentUser) {
      return window.sharedAuth.currentUser;
    }
    
    // Fallback to localStorage - use same keys as shared auth system
    try {
      // Check new format first (same as shared auth)
      const userData = localStorage.getItem('custompc_user');
      if (userData) {
        const user = JSON.parse(userData);
        return {
          username: user.username,
          email: user.email || null,
          loginTime: user.loginTime || user.signupTime || null
        };
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
      
      // Check old currentUser format for backward compatibility
      const oldUser = localStorage.getItem('currentUser');
      if (oldUser) {
        return JSON.parse(oldUser);
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
    
    return null;
  }

  logout() {
    // Clear user data - use same keys as shared auth system
    localStorage.removeItem('custompc_user');
    localStorage.removeItem('custompc_username');
    localStorage.removeItem('currentUser'); // backward compatibility
    
    // Clear shared auth if available
    if (window.sharedAuth && typeof window.sharedAuth.logout === 'function') {
      window.sharedAuth.logout();
    } else {
      // If shared auth not available, manually trigger auth state change
      window.dispatchEvent(new CustomEvent('authStateChanged'));
    }
    
    // Show notification
    if (window.showKiroNotification) {
      showKiroNotification('👋 Logged out successfully!');
    }
  }

  buildCustomPCDropdown(isAdmin) {
    const isCustomPCActive = this.isActive(['index', '']);
    const isMessagingActive = this.isActive('messaging');
    
    const activeClass = isCustomPCActive || isMessagingActive ? 'active' : '';
    
    // Build dropdown items - Messages only
    let dropdownItems = `
      <a href="messaging.html" class="dropdown-item">
        <div class="dropdown-item-icon">💬</div>
        <div class="dropdown-item-content">
          <div class="dropdown-item-title">Messages</div>
          <div class="dropdown-item-desc">Live chat support</div>
        </div>
      </a>
    `;
    
    return `
      <div class="custom-pc-nav">
        <a class="pill ${activeClass}" href="index.html">Custom PC</a>
        <div class="custom-pc-dropdown">
          ${dropdownItems}
        </div>
      </div>
    `;
  }

  checkIfAdmin() {
    // Check if shared auth is available
    if (window.sharedAuth && typeof window.sharedAuth.isCurrentUserAdmin === 'function') {
      return window.sharedAuth.isCurrentUserAdmin();
    }
    
    // Fallback: check localStorage
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        const user = JSON.parse(currentUser);
        return user.role === 'admin' || user.isAdmin === true;
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
    
    return false;
  }

  isActive(pages) {
    if (Array.isArray(pages)) {
      return pages.includes(this.currentPage) ? 'active' : '';
    }
    return this.currentPage === pages ? 'active' : '';
  }

  closeAnnouncementBar() {
    const bar = document.getElementById('announcement-bar');
    bar.style.animation = 'slideUp 0.3s ease-out';
    setTimeout(() => {
      bar.style.display = 'none';
      localStorage.setItem('announcementBarClosed', 'true');
    }, 300);
  }

  setupScrollEffects() {
    let lastScroll = 0;
    window.addEventListener('scroll', function() {
      const header = document.getElementById('main-header');
      if (!header) return;
      
      const currentScroll = window.pageYOffset;
      
      if (currentScroll > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
      
      lastScroll = currentScroll;
    });
  }



  // Method to refresh navbar when auth state changes
  refreshNavbar() {
    const oldHeader = document.getElementById('main-header');
    if (oldHeader) {
      oldHeader.remove();
    }
    this.createNavbar();
  }
}

// Initialize navbar when DOM is ready (but not on auth pages)
document.addEventListener('DOMContentLoaded', function() {
  // Don't add navbar to login/signup pages - they have their own design
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const authPages = ['login.html', 'signup.html', 'login', 'signup'];
  
  if (!authPages.includes(currentPage.replace('.html', ''))) {
    window.navigationBar = new NavigationBar();
    
    // Listen for auth state changes to refresh navbar
    window.addEventListener('authStateChanged', function() {
      if (window.navigationBar) {
        window.navigationBar.refreshNavbar();
      }
    });
  }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NavigationBar;
}