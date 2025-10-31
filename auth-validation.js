// Shared validation utilities for authentication forms

class AuthValidator {
  constructor() {
    this.rules = {
      username: {
        required: true,
        minLength: 3,
        maxLength: 20,
        pattern: /^[a-zA-Z0-9_-]+$/,
        messages: {
          required: 'Username is required',
          minLength: 'Username must be at least 3 characters',
          maxLength: 'Username must be less than 20 characters',
          pattern: 'Username can only contain letters, numbers, underscores, and hyphens'
        }
      },
      email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        messages: {
          required: 'Email is required',
          pattern: 'Please enter a valid email address'
        }
      },
      password: {
        required: true,
        minLength: 8,
        patterns: {
          lowercase: /(?=.*[a-z])/,
          uppercase: /(?=.*[A-Z])/,
          number: /(?=.*\d)/
        },
        messages: {
          required: 'Password is required',
          minLength: 'Password must be at least 8 characters',
          lowercase: 'Password must contain at least one lowercase letter',
          uppercase: 'Password must contain at least one uppercase letter',
          number: 'Password must contain at least one number'
        }
      }
    };
  }

  // Validate username field
  validateUsername(username) {
    const rule = this.rules.username;
    
    if (!username && rule.required) {
      return rule.messages.required;
    }
    
    if (username.length < rule.minLength) {
      return rule.messages.minLength;
    }
    
    if (username.length > rule.maxLength) {
      return rule.messages.maxLength;
    }
    
    if (!rule.pattern.test(username)) {
      return rule.messages.pattern;
    }
    
    return null;
  }

  // Validate email field
  validateEmail(email) {
    const rule = this.rules.email;
    
    if (!email && rule.required) {
      return rule.messages.required;
    }
    
    if (!rule.pattern.test(email)) {
      return rule.messages.pattern;
    }
    
    return null;
  }

  // Validate password field
  validatePassword(password) {
    const rule = this.rules.password;
    
    if (!password && rule.required) {
      return rule.messages.required;
    }
    
    if (password.length < rule.minLength) {
      return rule.messages.minLength;
    }
    
    if (!rule.patterns.lowercase.test(password)) {
      return rule.messages.lowercase;
    }
    
    if (!rule.patterns.uppercase.test(password)) {
      return rule.messages.uppercase;
    }
    
    if (!rule.patterns.number.test(password)) {
      return rule.messages.number;
    }
    
    return null;
  }

  // Validate confirm password field
  validateConfirmPassword(password, confirmPassword) {
    if (!confirmPassword) {
      return 'Please confirm your password';
    }
    
    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }
    
    return null;
  }

  // Get password strength score (0-4)
  getPasswordStrength(password) {
    if (!password) return 0;
    
    let score = 0;
    const rule = this.rules.password;
    
    // Length check
    if (password.length >= rule.minLength) score++;
    
    // Pattern checks
    if (rule.patterns.lowercase.test(password)) score++;
    if (rule.patterns.uppercase.test(password)) score++;
    if (rule.patterns.number.test(password)) score++;
    
    return score;
  }

  // Get password strength text
  getPasswordStrengthText(score) {
    const strengthLevels = {
      0: { text: 'Very Weak', class: 'very-weak' },
      1: { text: 'Weak', class: 'weak' },
      2: { text: 'Fair', class: 'fair' },
      3: { text: 'Good', class: 'good' },
      4: { text: 'Strong', class: 'strong' }
    };
    
    return strengthLevels[score] || strengthLevels[0];
  }

  // Validate entire form
  validateForm(formData) {
    const errors = {};
    
    if (formData.username !== undefined) {
      const usernameError = this.validateUsername(formData.username);
      if (usernameError) errors.username = usernameError;
    }
    
    if (formData.email !== undefined) {
      const emailError = this.validateEmail(formData.email);
      if (emailError) errors.email = emailError;
    }
    
    if (formData.password !== undefined) {
      const passwordError = this.validatePassword(formData.password);
      if (passwordError) errors.password = passwordError;
    }
    
    if (formData.confirmPassword !== undefined) {
      const confirmError = this.validateConfirmPassword(formData.password, formData.confirmPassword);
      if (confirmError) errors.confirmPassword = confirmError;
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors: errors
    };
  }
}

// Form handler class for managing form interactions
class AuthFormHandler {
  constructor(formId, validator) {
    this.form = document.getElementById(formId);
    this.validator = validator;
    this.inputs = {};
    this.errorDisplay = null;
    this.successDisplay = null;
    this.submitButton = null;
    
    this.init();
  }

  init() {
    if (!this.form) return;
    
    // Get form elements
    this.inputs.username = this.form.querySelector('#username');
    this.inputs.email = this.form.querySelector('#email');
    this.inputs.password = this.form.querySelector('#password');
    this.inputs.confirmPassword = this.form.querySelector('#confirm-password');
    
    this.errorDisplay = this.form.querySelector('#error-display');
    this.successDisplay = this.form.querySelector('#success-display');
    this.submitButton = this.form.querySelector('.gradient-btn');
    
    // Set up event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Real-time validation on blur
    Object.keys(this.inputs).forEach(fieldName => {
      const input = this.inputs[fieldName];
      if (input) {
        input.addEventListener('blur', () => this.validateField(fieldName));
        input.addEventListener('input', () => this.clearFieldError(fieldName));
        
        // Enhanced keyboard navigation
        input.addEventListener('keydown', (e) => this.handleKeyDown(e, fieldName));
      }
    });

    // Form submission
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    
    // Focus management
    this.setupFocusManagement();
  }

  handleKeyDown(e, fieldName) {
    // Enter key moves to next field or submits form
    if (e.key === 'Enter') {
      e.preventDefault();
      const inputs = Object.values(this.inputs).filter(input => input);
      const currentIndex = inputs.indexOf(e.target);
      
      if (currentIndex < inputs.length - 1) {
        // Move to next input
        inputs[currentIndex + 1].focus();
      } else {
        // Submit form if on last input
        this.form.dispatchEvent(new Event('submit'));
      }
    }
    
    // Escape key clears current field
    if (e.key === 'Escape') {
      e.target.value = '';
      this.clearFieldError(fieldName);
    }
  }

  setupFocusManagement() {
    // Focus first input when page loads
    const firstInput = Object.values(this.inputs).find(input => input);
    if (firstInput) {
      // Delay to ensure page is fully loaded
      setTimeout(() => firstInput.focus(), 100);
    }
    
    // Trap focus within the form
    this.form.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        this.handleTabNavigation(e);
      }
    });
  }

  handleTabNavigation(e) {
    const focusableElements = this.form.querySelectorAll(
      'input:not([disabled]), button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      // Shift + Tab (backward)
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab (forward)
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }

  validateField(fieldName) {
    const input = this.inputs[fieldName];
    if (!input) return;

    let error = null;
    const value = input.value.trim();

    switch (fieldName) {
      case 'username':
        error = this.validator.validateUsername(value);
        break;
      case 'email':
        error = this.validator.validateEmail(value);
        break;
      case 'password':
        error = this.validator.validatePassword(value);
        this.updatePasswordStrength(value);
        break;
      case 'confirmPassword':
        const password = this.inputs.password ? this.inputs.password.value : '';
        error = this.validator.validateConfirmPassword(password, value);
        break;
    }

    if (error) {
      input.classList.add('error');
      this.showError(error);
    } else {
      input.classList.remove('error');
      this.clearMessages();
    }

    return !error;
  }

  clearFieldError(fieldName) {
    const input = this.inputs[fieldName];
    if (input) {
      input.classList.remove('error');
    }
  }

  updatePasswordStrength(password) {
    const strengthIndicator = this.form.querySelector('#password-strength');
    if (!strengthIndicator) return;

    const score = this.validator.getPasswordStrength(password);
    const strength = this.validator.getPasswordStrengthText(score);
    
    strengthIndicator.textContent = strength.text;
    strengthIndicator.className = `password-strength ${strength.class}`;
  }

  clearMessages() {
    if (this.errorDisplay) {
      this.errorDisplay.classList.remove('show');
      this.errorDisplay.textContent = '';
    }
    if (this.successDisplay) {
      this.successDisplay.classList.remove('show');
      this.successDisplay.textContent = '';
    }
  }

  showError(message) {
    this.clearMessages();
    if (this.errorDisplay) {
      this.errorDisplay.textContent = message;
      this.errorDisplay.classList.add('show');
    }
  }

  showSuccess(message) {
    this.clearMessages();
    if (this.successDisplay) {
      this.successDisplay.textContent = message;
      this.successDisplay.classList.add('show');
    }
  }

  setLoading(isLoading) {
    if (this.submitButton) {
      if (isLoading) {
        this.submitButton.classList.add('loading');
        this.submitButton.disabled = true;
      } else {
        this.submitButton.classList.remove('loading');
        this.submitButton.disabled = false;
      }
    }
  }

  getFormData() {
    const data = {};
    
    Object.keys(this.inputs).forEach(fieldName => {
      const input = this.inputs[fieldName];
      if (input) {
        data[fieldName] = input.value.trim();
      }
    });
    
    return data;
  }

  async handleSubmit(e) {
    e.preventDefault();
    this.clearMessages();

    const formData = this.getFormData();
    const validation = this.validator.validateForm(formData);

    if (!validation.isValid) {
      // Show first error and focus on that field
      const firstError = Object.keys(validation.errors)[0];
      const firstErrorMessage = validation.errors[firstError];
      
      this.showError(firstErrorMessage);
      
      const firstErrorInput = this.inputs[firstError];
      if (firstErrorInput) {
        firstErrorInput.classList.add('error');
        firstErrorInput.focus();
      }
      
      return;
    }

    // All validation passed, proceed with form submission
    this.setLoading(true);

    try {
      // Call the form-specific submit handler
      await this.onSubmit(formData);
    } catch (error) {
      this.showError(error.message || 'An error occurred. Please try again.');
    } finally {
      this.setLoading(false);
    }
  }

  // Override this method in specific form implementations
  async onSubmit(formData) {
    throw new Error('onSubmit method must be implemented');
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AuthValidator, AuthFormHandler };
} else {
  window.AuthValidator = AuthValidator;
  window.AuthFormHandler = AuthFormHandler;
}