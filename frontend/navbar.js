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
    
    // Check if user is admin
    const isAdmin = this.checkIfAdmin();
    
    // Build Custom PC dropdown menu
    const customPCDropdown = this.buildCustomPCDropdown(isAdmin);
    
    header.innerHTML = `
      <div class="brand">
        <a href="index.html">
          <img src="images/logo.png" alt="CustomPC.tech logo"
            style="height:100px;width:100px;display:inline-block;vertical-align:middle;object-fit:contain;border-radius:50%;" />
          <span style="margin-left:8px;vertical-align:middle;">CustomPC.tech</span>
        </a>
      </div>
      <nav style="display: flex; align-items: center; gap: var(--space);">
        <a class="pill ${this.isActive('builds')}" href="builds.html">Builds</a>
        ${customPCDropdown}
        <a class="pill ${this.isActive('about')}" href="about.html">About</a>
        <a class="pill ${this.isActive('contact')}" href="contact.html">Contact</a>
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

  buildCustomPCDropdown(isAdmin) {
    const isCustomPCActive = this.isActive(['index', '']);
    const isMessagingActive = this.isActive('messaging');
    const isPaymentsActive = this.isActive('payments');
    
    const activeClass = isCustomPCActive || isMessagingActive || isPaymentsActive ? 'active' : '';
    
    // Build dropdown items
    let dropdownItems = `
      <a href="messaging.html" class="dropdown-item">
        <div class="dropdown-item-icon">💬</div>
        <div class="dropdown-item-content">
          <div class="dropdown-item-title">Messages</div>
          <div class="dropdown-item-desc">Live chat support</div>
        </div>
      </a>
    `;
    
    // Add Payments for admin users
    if (isAdmin) {
      dropdownItems += `
        <a href="payments.html" class="dropdown-item">
          <div class="dropdown-item-icon">💳</div>
          <div class="dropdown-item-content">
            <div class="dropdown-item-title">Payments</div>
            <div class="dropdown-item-desc">Admin payment processing</div>
          </div>
        </a>
      `;
    }
    
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
}

// Initialize navbar when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  window.navigationBar = new NavigationBar();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NavigationBar;
}