/**
 * Shared site chrome: global nav + footer.
 * Nav is inserted at the top of <body>. The footer fills any element
 * marked [data-site-footer]. Links resolve from the site root, so the
 * same script works from /builds/*.html.
 */

const SITE_ROOT = (function () {
  const src = document.currentScript && document.currentScript.src;
  return src ? new URL('../', src).href : new URL('./', location.href).href;
})();

const SITE_BUILDS = [
  ['esports-1080p-1440p', 'Esports 1080p/1440p'],
  ['creator-4k', 'Creator 4K'],
  ['cad-ai-workstation', 'CAD / AI Workstation'],
  ['small-form-factor', 'Small Form Factor'],
  ['silence-optimized', 'Silence-Optimized'],
  ['streaming-gaming', 'Streaming + Gaming'],
  ['rgb-showcase', 'RGB Showcase'],
  ['photo-pro', 'Photo Pro']
];

class NavigationBar {
  constructor() {
    this.currentPage = this.getCurrentPage();
    this.createNavbar();
    this.createFooter();
    this.setupScrollEffects();
  }

  url(path) {
    return SITE_ROOT + path;
  }

  getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('/builds/')) return 'builds';
    const page = path.split('/').pop() || 'index';
    return page.replace('.html', '') || 'index';
  }

  isActive(page) {
    return this.currentPage === page ? ' is-active' : '';
  }

  getCurrentUser() {
    if (window.sharedAuth && window.sharedAuth.currentUser) {
      return window.sharedAuth.currentUser;
    }
    try {
      const userData = localStorage.getItem('custompc_user');
      if (userData) {
        const user = JSON.parse(userData);
        return { username: user.username, email: user.email || null };
      }
      const legacyUser = localStorage.getItem('custompc_username');
      if (legacyUser) return { username: legacyUser, email: null };
    } catch (error) {
      console.error('Error getting current user:', error);
    }
    return null;
  }

  escape(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  buildAuth() {
    const user = this.getCurrentUser();
    if (user && user.username) {
      return `
        <a class="gnav-link${this.isActive('account')}" href="${this.url('account.html')}" title="Signed in as ${this.escape(user.username)}">My builds</a>
        <button type="button" class="gnav-link gnav-btnlink" data-logout>Sign out</button>`;
    }
    return `<a class="gnav-link${this.isActive('login')}" href="${this.url('login.html')}">Sign in</a>`;
  }

  createNavbar() {
    const header = document.createElement('header');
    header.id = 'main-header';
    header.className = 'gnav';
    header.innerHTML = `
      <div class="gnav-inner">
        <a class="gnav-brand" href="${this.url('index.html')}" aria-label="CustomPC home">
          <img src="${this.url('images/logo-mark.png')}" alt="" width="28" height="28" />
          <span>CustomPC</span>
        </a>
        <button class="gnav-toggle" type="button" aria-expanded="false" aria-controls="gnav-menu" aria-label="Menu">
          <span></span><span></span>
        </button>
        <nav class="gnav-menu" id="gnav-menu" aria-label="Primary">
          <a class="gnav-link${this.isActive('builds')}" href="${this.url('builds.html')}">Builds</a>
          <a class="gnav-link" href="${this.url('index.html#how')}">How it works</a>
          <a class="gnav-link${this.isActive('about')}" href="${this.url('about.html')}">About</a>
          <a class="gnav-link${this.isActive('contact')}" href="${this.url('contact.html')}">Contact</a>
          <span class="gnav-sep" aria-hidden="true"></span>
          ${this.buildAuth()}
          <a class="gnav-cta" href="${this.url('index.html#request')}">Get a build plan</a>
        </nav>
      </div>`;

    document.body.insertBefore(header, document.body.firstChild);

    const toggle = header.querySelector('.gnav-toggle');
    toggle.addEventListener('click', () => {
      const open = header.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    header.querySelectorAll('.gnav-menu a').forEach(a =>
      a.addEventListener('click', () => {
        header.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      })
    );
    const logoutBtn = header.querySelector('[data-logout]');
    if (logoutBtn) logoutBtn.addEventListener('click', () => this.logout());
  }

  createFooter() {
    const slot = document.querySelector('[data-site-footer]');
    if (!slot) return;
    const builds = SITE_BUILDS
      .map(([slug, name]) => `<a href="${this.url(`builds/${slug}.html`)}">${name}</a>`)
      .join('');
    slot.classList.add('gfoot');
    slot.innerHTML = `
      <div class="gfoot-inner">
        <div class="gfoot-cols">
          <div class="gfoot-col">
            <h4>Builds</h4>
            ${builds}
          </div>
          <div class="gfoot-col">
            <h4>Get a PC</h4>
            <a href="${this.url('index.html#request')}">Request a build plan</a>
            <a href="${this.url('index.html#how')}">How it works</a>
            <a href="${this.url('builds.html')}">All builds</a>
          </div>
          <div class="gfoot-col">
            <h4>Company</h4>
            <a href="${this.url('about.html')}">About</a>
            <a href="${this.url('contact.html')}">Contact</a>
            <a href="mailto:contact@custompc.tech">contact@custompc.tech</a>
          </div>
          <div class="gfoot-col">
            <h4>Account</h4>
            <a href="${this.url('account.html')}">My builds</a>
            <a href="${this.url('login.html')}">Sign in</a>
            <a href="${this.url('signup.html')}">Create account</a>
          </div>
        </div>
        <div class="gfoot-legal">
          <span>&copy; ${new Date().getFullYear()} CustomPC.tech. All rights reserved.</span>
          <span class="gfoot-legal-links">
            <a href="${this.url('privacy-policy.html')}">Privacy Policy</a>
            <a href="${this.url('terms-of-service.html')}">Terms of Service</a>
          </span>
        </div>
      </div>`;
  }

  async logout() {
    // Firebase holds the real session; pages without the SDK hand off to login.html
    if (!window.CPC) {
      window.location.href = this.url('login.html?signout=1');
      return;
    }
    await window.CPC.signOut();
    localStorage.removeItem('currentUser');
    if (window.sharedAuth) window.sharedAuth.currentUser = null;
    if (['account', 'admin'].includes(this.currentPage)) {
      window.location.href = this.url('index.html');
    }
  }

  setupScrollEffects() {
    const onScroll = () => {
      const header = document.getElementById('main-header');
      if (header) header.classList.toggle('scrolled', window.pageYOffset > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  refreshNavbar() {
    const oldHeader = document.getElementById('main-header');
    if (oldHeader) oldHeader.remove();
    this.createNavbar();
    this.setupScrollEffects();
  }
}

// Reveal-on-scroll for any .reveal element
function setupReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;
  if (!('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  items.forEach(el => io.observe(el));
}

function initSiteChrome() {
  window.navigationBar = new NavigationBar();
  window.addEventListener('authStateChanged', () => window.navigationBar.refreshNavbar());
  setupReveal();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSiteChrome);
} else {
  initSiteChrome();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = NavigationBar;
}
