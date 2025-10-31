// Admin authentication system extending SharedAuth

class AdminAuth extends SharedAuth {
  constructor() {
    super();
    this.adminCredentials = {
      username: "Minty-Komodo",
      password: "hJ.?'0PcU0).1.0.1PCimA4%oU",
      email: "griffin@crowhurst.ws"
    };
  }

  /**
   * Validate admin credentials against hardcoded values
   * @param {string} username - The username to validate
   * @param {string} password - The password to validate
   * @param {string} email - The email to validate
   * @returns {boolean} - True if all credentials match exactly
   */
  validateAdminCredentials(username, password, email) {
    return username === this.adminCredentials.username &&
           password === this.adminCredentials.password &&
           email === this.adminCredentials.email;
  }

  /**
   * Check if the current user is an admin
   * @returns {boolean} - True if current user has admin privileges
   */
  isCurrentUserAdmin() {
    if (!this.currentUser) return false;
    
    // Check if current user matches admin credentials (username and email)
    return this.currentUser.username === this.adminCredentials.username &&
           this.currentUser.email === this.adminCredentials.email;
  }

  /**
   * Require admin access - redirect to login if not admin
   * @param {string} redirectUrl - URL to redirect to after successful admin login
   */
  requireAdminAccess(redirectUrl = null) {
    if (!this.isCurrentUserAdmin()) {
      // Store the intended destination for after login
      if (redirectUrl) {
        sessionStorage.setItem('admin_redirect_url', redirectUrl);
      }
      
      // Redirect to login page with admin parameter
      const loginUrl = window.location.pathname.includes('/builds/') ? '../login.html' : 'login.html';
      window.location.href = `${loginUrl}?admin=true`;
      return false;
    }
    return true;
  }

  /**
   * Authenticate admin user and create session
   * @param {string} username - Admin username
   * @param {string} password - Admin password
   * @param {string} email - Admin email
   * @returns {boolean} - True if authentication successful
   */
  authenticateAdmin(username, password, email) {
    if (this.validateAdminCredentials(username, password, email)) {
      // Create admin user session
      const adminUser = {
        username: username,
        email: email,
        role: 'admin',
        loginTime: new Date().toISOString()
      };

      // Store user data
      localStorage.setItem('custompc_user', JSON.stringify(adminUser));
      
      // Update current user
      this.currentUser = adminUser;
      
      // Refresh UI
      this.refreshAuthUI();
      
      // Dispatch auth state change event
      window.dispatchEvent(new CustomEvent('authStateChanged'));
      
      return true;
    }
    return false;
  }

  /**
   * Get admin session information
   * @returns {Object|null} - Admin session data or null if not admin
   */
  getAdminSession() {
    if (!this.isCurrentUserAdmin()) return null;
    
    return {
      username: this.currentUser.username,
      email: this.currentUser.email,
      role: 'admin',
      loginTime: this.currentUser.loginTime,
      sessionValid: true
    };
  }

  /**
   * Check if admin session is valid and not expired
   * @param {number} maxAgeHours - Maximum session age in hours (default: 8 hours)
   * @returns {boolean} - True if session is valid
   */
  isAdminSessionValid(maxAgeHours = 8) {
    if (!this.isCurrentUserAdmin()) return false;
    
    if (!this.currentUser.loginTime) return false;
    
    const loginTime = new Date(this.currentUser.loginTime);
    const now = new Date();
    const sessionAgeHours = (now - loginTime) / (1000 * 60 * 60);
    
    return sessionAgeHours <= maxAgeHours;
  }

  /**
   * Logout admin user and clear session
   */
  logoutAdmin() {
    if (confirm('Are you sure you want to logout from admin session?')) {
      // Clear all auth-related storage
      localStorage.removeItem('custompc_username');
      localStorage.removeItem('custompc_user_hash');
      localStorage.removeItem('custompc_user');
      sessionStorage.removeItem('admin_redirect_url');
      
      this.currentUser = null;
      this.refreshAuthUI();
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('authStateChanged'));
      
      // Redirect to home page
      window.location.href = 'index.html';
    }
  }

  /**
   * Override logout to use admin-specific logout
   */
  logout() {
    this.logoutAdmin();
  }

  /**
   * Handle admin login form submission with enhanced error handling
   * @param {Event} event - Form submission event
   * @param {HTMLFormElement} form - The login form element
   */
  handleAdminLogin(event, form) {
    event.preventDefault();
    
    try {
      // Check if user is locked out
      const lockoutMinutes = this.isUserLockedOut();
      if (lockoutMinutes) {
        this.showAuthError(`Account temporarily locked. Please try again in ${lockoutMinutes} minute(s).`, 'warning');
        return;
      }

      // Get form data with validation
      const formData = new FormData(form);
      const username = formData.get('username');
      const password = formData.get('password');
      const email = formData.get('email');

      // Client-side validation
      const validationError = this.validateLoginForm(username, password, email);
      if (validationError) {
        this.showAuthError(validationError, 'error');
        return;
      }

      // Show loading state
      this.setLoginFormLoading(true);

      // Simulate network delay for better UX
      setTimeout(() => {
        try {
          if (this.authenticateAdmin(username, password, email)) {
            // Success - handle redirect
            this.handleSuccessfulLogin();
          }
        } catch (error) {
          this.showAuthError('Authentication failed. Please try again.', 'error');
        } finally {
          this.setLoginFormLoading(false);
        }
      }, 500);

    } catch (error) {
      console.error('Login form submission error:', error);
      this.showAuthError('An unexpected error occurred. Please refresh the page and try again.', 'error');
      this.setLoginFormLoading(false);
    }
  }

  /**
   * Validate login form inputs
   */
  validateLoginForm(username, password, email) {
    if (!username || username.trim() === '') {
      return 'Username is required';
    }

    if (!password || password.trim() === '') {
      return 'Password is required';
    }

    if (!email || email.trim() === '') {
      return 'Email is required';
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return 'Please enter a valid email address';
    }

    // Username format validation
    if (username.trim().length < 3) {
      return 'Username must be at least 3 characters long';
    }

    if (password.trim().length < 8) {
      return 'Password must be at least 8 characters long';
    }

    return null;
  }

  /**
   * Set loading state for login form
   */
  setLoginFormLoading(isLoading) {
    const submitButton = document.querySelector('form button[type="submit"]');
    const inputs = document.querySelectorAll('form input');

    if (submitButton) {
      if (isLoading) {
        submitButton.disabled = true;
        submitButton.textContent = 'Authenticating...';
        submitButton.style.opacity = '0.7';
      } else {
        submitButton.disabled = false;
        submitButton.textContent = 'Login';
        submitButton.style.opacity = '1';
      }
    }

    inputs.forEach(input => {
      input.disabled = isLoading;
    });
  }

  /**
   * Handle successful login with redirect logic
   */
  handleSuccessfulLogin() {
    try {
      // Check for redirect URL
      const redirectUrl = sessionStorage.getItem('admin_redirect_url');
      sessionStorage.removeItem('admin_redirect_url');
      
      // Validate redirect URL for security
      const allowedRedirects = ['payments.html', 'index.html', 'builds.html'];
      let targetUrl = 'payments.html'; // default
      
      if (redirectUrl) {
        const urlPath = redirectUrl.split('/').pop();
        if (allowedRedirects.includes(urlPath)) {
          targetUrl = redirectUrl;
        }
      }
      
      // Show success message briefly before redirect
      this.showAuthError('Login successful! Redirecting...', 'info');
      
      // Redirect after short delay
      setTimeout(() => {
        window.location.href = targetUrl;
      }, 1000);

    } catch (error) {
      console.error('Redirect error:', error);
      // Fallback redirect
      window.location.href = 'payments.html';
    }
  }

  /**
   * Show authentication error message with enhanced error handling
   * @param {string} message - Error message to display
   * @param {string} type - Error type ('error', 'warning', 'info')
   */
  showAuthError(message, type = 'error') {
    // Remove existing error messages
    const existingErrors = document.querySelectorAll('.auth-error, .auth-warning, .auth-info');
    existingErrors.forEach(error => error.remove());

    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.className = `auth-${type}`;
    errorDiv.setAttribute('role', 'alert');
    errorDiv.setAttribute('aria-live', 'assertive');
    
    const styles = {
      error: 'background-color: #ff4444; color: white;',
      warning: 'background-color: #ff9800; color: white;',
      info: 'background-color: #2196f3; color: white;'
    };
    
    errorDiv.style.cssText = `
      ${styles[type]}
      padding: 12px 16px;
      margin: 10px 0;
      border-radius: 6px;
      text-align: center;
      font-weight: 500;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      animation: slideIn 0.3s ease-out;
    `;
    
    // Add icon based on type
    const icons = {
      error: '⚠️',
      warning: '⚠️',
      info: 'ℹ️'
    };
    
    errorDiv.innerHTML = `
      <span style="margin-right: 8px;">${icons[type]}</span>
      <span>${message}</span>
    `;

    // Insert error message at the top of the form or body
    const form = document.querySelector('form');
    const container = form || document.body;
    
    if (form) {
      form.insertBefore(errorDiv, form.firstChild);
    } else {
      document.body.insertBefore(errorDiv, document.body.firstChild);
    }

    // Focus management for accessibility
    errorDiv.focus();

    // Auto-remove error after appropriate time based on type
    const timeout = type === 'error' ? 8000 : type === 'warning' ? 6000 : 4000;
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => errorDiv.remove(), 300);
      }
    }, timeout);

    // Add CSS animations if not already present
    this.addErrorAnimations();
  }

  /**
   * Add CSS animations for error messages
   */
  addErrorAnimations() {
    if (document.getElementById('auth-error-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'auth-error-styles';
    style.textContent = `
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes slideOut {
        from {
          opacity: 1;
          transform: translateY(0);
        }
        to {
          opacity: 0;
          transform: translateY(-20px);
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Enhanced admin authentication with comprehensive error handling
   */
  authenticateAdmin(username, password, email) {
    try {
      // Validate input parameters
      if (!username || !password || !email) {
        this.showAuthError('All fields are required for admin authentication', 'error');
        return false;
      }

      // Trim inputs
      username = username.trim();
      password = password.trim();
      email = email.trim();

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        this.showAuthError('Please enter a valid email address', 'error');
        return false;
      }

      // Check credentials with detailed error messages
      if (username !== this.adminCredentials.username) {
        this.showAuthError('Invalid username. Please check your credentials.', 'error');
        this.logFailedAttempt('username', username);
        return false;
      }

      if (email !== this.adminCredentials.email) {
        this.showAuthError('Invalid email address. Please check your credentials.', 'error');
        this.logFailedAttempt('email', email);
        return false;
      }

      if (password !== this.adminCredentials.password) {
        this.showAuthError('Invalid password. Please check your credentials.', 'error');
        this.logFailedAttempt('password', '[REDACTED]');
        return false;
      }

      // All credentials valid - create admin session
      const adminUser = {
        username: username,
        email: email,
        role: 'admin',
        loginTime: new Date().toISOString(),
        sessionId: this.generateSessionId()
      };

      // Store user data
      localStorage.setItem('custompc_user', JSON.stringify(adminUser));
      
      // Update current user
      this.currentUser = adminUser;
      
      // Clear any failed attempt records
      this.clearFailedAttempts();
      
      // Refresh UI
      this.refreshAuthUI();
      
      // Dispatch auth state change event
      window.dispatchEvent(new CustomEvent('authStateChanged', {
        detail: { user: adminUser, action: 'login' }
      }));
      
      this.showAuthError('Login successful! Redirecting...', 'info');
      return true;

    } catch (error) {
      console.error('Authentication error:', error);
      this.showAuthError('An unexpected error occurred during authentication. Please try again.', 'error');
      return false;
    }
  }

  /**
   * Generate a unique session ID
   */
  generateSessionId() {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Log failed authentication attempts
   */
  logFailedAttempt(field, value) {
    try {
      const attempts = JSON.parse(localStorage.getItem('admin_failed_attempts') || '[]');
      attempts.push({
        field: field,
        value: field === 'password' ? '[REDACTED]' : value,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        ip: 'client-side' // Would be server-side in production
      });

      // Keep only last 10 attempts
      if (attempts.length > 10) {
        attempts.splice(0, attempts.length - 10);
      }

      localStorage.setItem('admin_failed_attempts', JSON.stringify(attempts));

      // Check for too many failed attempts
      const recentAttempts = attempts.filter(attempt => {
        const attemptTime = new Date(attempt.timestamp);
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        return attemptTime > fiveMinutesAgo;
      });

      if (recentAttempts.length >= 5) {
        this.showAuthError('Too many failed login attempts. Please wait 5 minutes before trying again.', 'warning');
        this.lockoutUser();
      }

    } catch (error) {
      console.error('Failed to log authentication attempt:', error);
    }
  }

  /**
   * Clear failed attempt records
   */
  clearFailedAttempts() {
    localStorage.removeItem('admin_failed_attempts');
    localStorage.removeItem('admin_lockout_until');
  }

  /**
   * Lock out user temporarily
   */
  lockoutUser() {
    const lockoutUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    localStorage.setItem('admin_lockout_until', lockoutUntil.toISOString());
  }

  /**
   * Check if user is currently locked out
   */
  isUserLockedOut() {
    const lockoutUntil = localStorage.getItem('admin_lockout_until');
    if (!lockoutUntil) return false;

    const lockoutTime = new Date(lockoutUntil);
    const now = new Date();

    if (now < lockoutTime) {
      const remainingMinutes = Math.ceil((lockoutTime - now) / (1000 * 60));
      return remainingMinutes;
    }

    // Lockout expired, clear it
    localStorage.removeItem('admin_lockout_until');
    return false;
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdminAuth;
} else {
  window.AdminAuth = AdminAuth;
}