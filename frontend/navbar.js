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
        <a class="pill ${this.isActive(['index', ''])}" href="index.html">Custom PC</a>
        <a class="pill ${this.isActive('messaging')}" href="messaging.html">Messages</a>
        <a class="pill ${this.isActive('payments')}" href="payments.html">Payments</a>
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