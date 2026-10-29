/**
 * Submission Handler: saves contact messages and build requests to
 * Firebase under /submissions. Requests from a signed-in customer carry
 * their uid so they show up on My builds (account.html).
 * Needs frontend/firebase-app.js (window.CPC) with the database SDK.
 */

class SubmissionHandler {
  async submitContact(data) {
    const { name, email, message } = data;
    if (!name || !email || !message) {
      throw new Error('Missing required fields');
    }
    return this.save({
      type: 'contact',
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
      source: 'Contact Form'
    });
  }

  async submitQuoteRequest(data) {
    const { name, email, buildType, budget, message } = data;
    if (!name || !email) {
      throw new Error('Missing required fields: name and email');
    }
    return this.save({
      type: 'quote_request',
      name: name.trim(),
      email: email.trim().toLowerCase(),
      buildType: buildType || 'Not specified',
      budget: budget || 'Not specified',
      message: message ? message.trim() : '',
      source: 'Quote Request Form'
    });
  }

  /** @private */
  async save(fields) {
    if (!window.CPC || !window.CPC.db) {
      throw new Error('Database not available');
    }
    const user = await window.CPC.ready;
    const now = Date.now();
    const submission = {
      ...fields,
      timestamp: now,
      submittedAt: new Date(now).toISOString(),
      status: 'new',
      read: false
    };
    if (user) submission.uid = user.uid;

    const ref = await window.CPC.db.ref('submissions').push(submission);
    return { success: true, submissionId: ref.key, signedIn: !!user };
  }
}

window.submissionHandler = new SubmissionHandler();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SubmissionHandler;
}
