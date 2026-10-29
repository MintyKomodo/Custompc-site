/**
 * Shared Firebase setup (compat SDK 9.22.0).
 * Load after firebase-app-compat.js, firebase-auth-compat.js and
 * (where data is needed) firebase-database-compat.js.
 *
 * Exposes window.CPC: auth, db, onUser(cb), signOut(), isAdmin(user),
 * STATUSES. Mirrors the signed-in user to localStorage so navbar.js can
 * render the right links before Firebase finishes loading.
 */
(function () {
  const config = {
    apiKey: "AIzaSyANB6z6rM3lb2GZc3wTO5767fO1jB-PUjM",
    authDomain: "custompc-website.firebaseapp.com",
    databaseURL: "https://custompc-website-default-rtdb.firebaseio.com",
    projectId: "custompc-website",
    storageBucket: "custompc-website.firebasestorage.app",
    messagingSenderId: "1043646914253",
    appId: "1:1043646914253:web:aa1479531bc12745e65384"
  };

  // Must match the admin email in firebase-database.rules.json
  const ADMIN_EMAIL = 'support@custompc.tech';

  // Build progress shown to customers, in order. 'closed' sits outside the track.
  const STATUSES = [
    { id: 'new', label: 'Received' },
    { id: 'planning', label: 'Planning' },
    { id: 'plan_sent', label: 'Plan sent' },
    { id: 'parts', label: 'Parts ordered' },
    { id: 'building', label: 'Building' },
    { id: 'testing', label: 'Testing' },
    { id: 'shipped', label: 'Shipped' },
    { id: 'delivered', label: 'Delivered' }
  ];
  const CLOSED = { id: 'closed', label: 'Closed' };

  const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(config);
  const auth = firebase.auth();
  const db = typeof firebase.database === 'function' ? firebase.database() : null;

  // visitor-tracking.js still looks for this older global
  if (db && !window.firebaseChatManager) {
    window.firebaseChatManager = { isInitialized: true, database: db };
  }

  function isAdmin(user) {
    return !!user && user.emailVerified && (user.email || '').toLowerCase() === ADMIN_EMAIL;
  }

  function mirror(user) {
    try {
      const before = localStorage.getItem('custompc_user');
      if (user) {
        const next = JSON.stringify({
          username: user.displayName || (user.email || '').split('@')[0],
          email: user.email,
          uid: user.uid
        });
        if (next !== before) {
          localStorage.setItem('custompc_user', next);
          window.dispatchEvent(new CustomEvent('authStateChanged'));
        }
      } else if (before) {
        localStorage.removeItem('custompc_user');
        localStorage.removeItem('custompc_username');
        localStorage.removeItem('custompc_user_hash');
        window.dispatchEvent(new CustomEvent('authStateChanged'));
      }
    } catch (e) {}
  }

  let resolveReady;
  const ready = new Promise(res => { resolveReady = res; });
  auth.onAuthStateChanged(user => {
    mirror(user);
    resolveReady(user);
  });

  function statusLabel(id) {
    if (id === CLOSED.id) return CLOSED.label;
    const s = STATUSES.find(x => x.id === id);
    return s ? s.label : STATUSES[0].label;
  }

  window.CPC = {
    app, auth, db, ADMIN_EMAIL, STATUSES, CLOSED,
    isAdmin,
    statusLabel,
    ready,
    onUser(cb) { return auth.onAuthStateChanged(cb); },
    async signOut() {
      await auth.signOut();
      mirror(null);
    }
  };
})();
