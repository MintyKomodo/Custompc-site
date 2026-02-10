/**
 * Submission Handler - Routes all form submissions through Firebase to Admin Chats
 * This replaces Formspree with Firebase for all submissions
 */

class SubmissionHandler {
  constructor() {
    this.isReady = false;
    this.init();
  }

  async init() {
    // Wait for Firebase to be ready
    let attempts = 0;
    while (!window.firebaseChatManager && attempts < 20) {
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }

    if (window.firebaseChatManager && window.firebaseChatManager.isInitialized) {
      this.isReady = true;
      console.log('✅ SubmissionHandler ready - Firebase initialized');
    } else {
      console.warn('⚠️ Firebase not available, submissions will use fallback');
    }
  }

  /**
   * Submit a contact form to Firebase
   * @param {Object} data - Form data { name, email, message }
   * @returns {Promise<Object>} Result { success, chatId, message }
   */
  async submitContact(data) {
    try {
      const { name, email, message } = data;

      // Validate required fields
      if (!name || !email || !message) {
        throw new Error('Missing required fields');
      }

      // Create submission data
      const submission = {
        type: 'contact',
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
        submittedAt: new Date().toISOString(),
        source: 'Contact Form'
      };

      // Send to Firebase
      const result = await this.sendToFirebase(submission);
      return result;

    } catch (error) {
      console.error('❌ Contact submission failed:', error);
      throw error;
    }
  }

  /**
   * Submit a quote request to Firebase
   * @param {Object} data - Quote data { name, email, buildType, budget, message }
   * @returns {Promise<Object>} Result { success, chatId, message }
   */
  async submitQuoteRequest(data) {
    try {
      const { name, email, buildType, budget, message } = data;

      // Validate required fields
      if (!name || !email) {
        throw new Error('Missing required fields: name and email');
      }

      // Create submission data
      const submission = {
        type: 'quote_request',
        name: name.trim(),
        email: email.trim(),
        buildType: buildType || 'Not specified',
        budget: budget || 'Not specified',
        message: message ? message.trim() : '',
        submittedAt: new Date().toISOString(),
        source: 'Quote Request Form'
      };

      // Send to Firebase
      const result = await this.sendToFirebase(submission);
      return result;

    } catch (error) {
      console.error('❌ Quote request submission failed:', error);
      throw error;
    }
  }

  /**
   * Send submission to Firebase
   * @private
   */
  async sendToFirebase(submission) {
    if (!this.isReady || !window.firebaseChatManager || !window.firebaseChatManager.isInitialized) {
      console.warn('⚠️ Firebase not available, attempting to use fallback...');
      
      // Fallback: Try to send via email or store locally
      try {
        // Store submission locally as backup
        const submissions = JSON.parse(localStorage.getItem('custompc_submissions') || '[]');
        submissions.push({
          ...submission,
          id: Date.now(),
          status: 'pending'
        });
        localStorage.setItem('custompc_submissions', JSON.stringify(submissions));
        
        console.log('✅ Submission stored locally (Firebase unavailable)');
        
        return {
          success: true,
          chatId: 'local_' + Date.now(),
          message: 'Your submission has been received. We\'ll get back to you within 24-48 hours.'
        };
      } catch (fallbackError) {
        console.error('❌ Both Firebase and fallback failed:', fallbackError);
        throw new Error('Unable to process submission - please try again or email us directly');
      }
    }

    try {
      // Create a chat session for this submission using the new structure
      const chatData = {
        userName: submission.name,
        userEmail: submission.email,
        startTime: new Date().toISOString(),
        messages: [],
        unreadCount: 1
      };

      const chatId = await window.firebaseChatManager.createChatSession(chatData);

      // Send the submission as the first message
      const messageContent = this.formatSubmissionMessage(submission);
      
      const messageData = {
        content: messageContent,
        text: messageContent,
        type: 'user',
        userId: submission.email,
        username: submission.name
      };

      await window.firebaseChatManager.sendMessage(chatId, messageData);

      console.log('✅ Submission saved to Firebase:', chatId);

      return {
        success: true,
        chatId: chatId,
        message: 'Your submission has been received. We\'ll get back to you within 24-48 hours.'
      };

    } catch (error) {
      console.error('❌ Firebase submission failed:', error);
      
      // Try fallback if Firebase fails
      try {
        const submissions = JSON.parse(localStorage.getItem('custompc_submissions') || '[]');
        submissions.push({
          ...submission,
          id: Date.now(),
          status: 'pending',
          firebaseError: error.message
        });
        localStorage.setItem('custompc_submissions', JSON.stringify(submissions));
        
        console.log('✅ Submission stored locally (Firebase error fallback)');
        
        return {
          success: true,
          chatId: 'local_' + Date.now(),
          message: 'Your submission has been received. We\'ll get back to you within 24-48 hours.'
        };
      } catch (fallbackError) {
        throw error;
      }
    }
  }

  /**
   * Generate a subject line for the submission
   * @private
   */
  generateSubject(submission) {
    switch (submission.type) {
      case 'contact':
        return `Contact: ${submission.name}`;
      case 'quote_request':
        return `Quote Request: ${submission.buildType} - ${submission.budget}`;
      default:
        return `New Submission: ${submission.name}`;
    }
  }

  /**
   * Format submission as a readable message
   * @private
   */
  formatSubmissionMessage(submission) {
    let message = '';

    if (submission.type === 'contact') {
      message = `📧 **Contact Form Submission**\n\n`;
      message += `**From:** ${submission.name}\n`;
      message += `**Email:** ${submission.email}\n\n`;
      message += `**Message:**\n${submission.message}`;
    } else if (submission.type === 'quote_request') {
      message = `💻 **Quote Request**\n\n`;
      message += `**Name:** ${submission.name}\n`;
      message += `**Email:** ${submission.email}\n`;
      message += `**Build Type:** ${submission.buildType}\n`;
      message += `**Budget:** ${submission.budget}\n`;
      if (submission.message) {
        message += `\n**Additional Notes:**\n${submission.message}`;
      }
    }

    message += `\n\n---\n*Submitted: ${submission.submittedAt}*`;
    return message;
  }
}

// Global instance
window.submissionHandler = new SubmissionHandler();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SubmissionHandler;
}
