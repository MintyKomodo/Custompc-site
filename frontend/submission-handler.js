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
    console.log('🚀 SubmissionHandler initializing...');
    
    // Wait for Firebase to be ready
    let attempts = 0;
    while ((!window.firebaseChatManager || !window.firebaseChatManager.isInitialized) && attempts < 30) {
      console.log(`⏳ Waiting for Firebase... attempt ${attempts + 1}/30`);
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }

    if (window.firebaseChatManager && window.firebaseChatManager.isInitialized) {
      this.isReady = true;
      console.log('✅ SubmissionHandler ready - Firebase initialized');
    } else {
      console.warn('⚠️ Firebase not available after 15 seconds, submissions will use fallback');
      // Set isReady to true anyway so we can try Firebase if it becomes available later
      this.isReady = true;
    }
  }

  /**
   * Submit a contact form to Firebase
   * @param {Object} data - Form data { name, email, message }
   * @returns {Promise<Object>} Result { success, submissionId, message }
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
        timestamp: Date.now(),
        submittedAt: new Date().toISOString(),
        source: 'Contact Form',
        status: 'new'
      };

      // Send to Firebase submissions path
      const result = await this.sendToFirebaseSubmissions(submission);
      return result;

    } catch (error) {
      console.error('❌ Contact submission failed:', error);
      throw error;
    }
  }

  /**
   * Submit a quote request to Firebase
   * @param {Object} data - Quote data { name, email, buildType, budget, message }
   * @returns {Promise<Object>} Result { success, submissionId, message }
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
        timestamp: Date.now(),
        submittedAt: new Date().toISOString(),
        source: 'Quote Request Form',
        status: 'new'
      };

      // Send to Firebase submissions path
      const result = await this.sendToFirebaseSubmissions(submission);
      return result;

    } catch (error) {
      console.error('❌ Quote request submission failed:', error);
      throw error;
    }
  }

  /**
   * Send submission to Firebase submissions path
   * @private
   */
  async sendToFirebaseSubmissions(submission) {
    console.log('📤 sendToFirebaseSubmissions called with:', submission);
    console.log('🔍 Firebase status check:', {
      isReady: this.isReady,
      hasFirebaseChatManager: !!window.firebaseChatManager,
      isInitialized: window.firebaseChatManager?.isInitialized,
      hasDatabase: !!window.firebaseChatManager?.database
    });
    
    // Check if Firebase is actually available (don't rely only on this.isReady)
    if (!window.firebaseChatManager || !window.firebaseChatManager.isInitialized || !window.firebaseChatManager.database) {
      console.warn('⚠️ Firebase not available, attempting to use fallback...');
      
      // Fallback: Store submission locally as backup
      try {
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
          submissionId: 'local_' + Date.now(),
          message: 'Your submission has been received. We\'ll get back to you within 24-48 hours.'
        };
      } catch (fallbackError) {
        console.error('❌ Both Firebase and fallback failed:', fallbackError);
        throw new Error('Unable to process submission - please try again or email us directly');
      }
    }

    try {
      console.log('🔥 Firebase is ready, creating chat from submission...');
      
      // Create a chat session for this submission using the new structure
      const chatData = {
        userName: submission.name,
        userEmail: submission.email,
        startTime: new Date().toISOString(),
        messages: [],
        unreadCount: 1
      };

      console.log('📝 Chat data prepared:', chatData);
      
      const chatId = await window.firebaseChatManager.createChatSession(chatData);
      console.log('✅ Chat session created with ID:', chatId);

      // Send the submission as the first message
      const messageContent = this.formatSubmissionMessage(submission);
      console.log('💬 Preparing to send message...');
      
      const messageData = {
        content: messageContent,
        text: messageContent,
        type: 'user',
        userId: submission.email,
        username: submission.name
      };

      console.log('📨 Sending message to Firebase...');
      await window.firebaseChatManager.sendMessage(chatId, messageData);
      console.log('✅ Message sent successfully');

      return {
        success: true,
        submissionId: chatId,
        message: 'Your submission has been received. We\'ll get back to you within 24-48 hours.'
      };

    } catch (error) {
      console.error('❌ Firebase submission failed:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
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
          submissionId: 'local_' + Date.now(),
          message: 'Your submission has been received. We\'ll get back to you within 24-48 hours.'
        };
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
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
