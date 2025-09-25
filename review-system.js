// Enhanced Review System for CustomPC.tech

class ReviewSystem {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  init() {
    this.currentUser = this.getCurrentUser();
    this.setupEventListeners();
  }

  // Get current user from our authentication system
  getCurrentUser() {
    // Check new format first
    const userData = localStorage.getItem('custompc_user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return {
          username: user.username,
          email: user.email || null,
          id: this.generateUserId(user.username)
        };
      } catch (e) {
        console.warn('Invalid user data format');
      }
    }
    
    // Check legacy format
    const legacyUser = localStorage.getItem('custompc_username');
    if (legacyUser) {
      return {
        username: legacyUser,
        email: null,
        id: this.generateUserId(legacyUser)
      };
    }
    
    // Anonymous user
    let anonId = localStorage.getItem('custompc_anon_id');
    if (!anonId) {
      anonId = 'anon_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      localStorage.setItem('custompc_anon_id', anonId);
    }
    
    return {
      username: 'Anonymous',
      email: null,
      id: anonId
    };
  }

  // Generate consistent user ID from username
  generateUserId(username) {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      const char = username.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return 'user_' + Math.abs(hash).toString(36);
  }

  // Create star rating HTML
  createStarRating(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars += '<span class="star filled" style="color: #ffd700;">★</span>';
      } else if (i - 0.5 === rating) {
        stars += '<span class="star half">★</span>';
      } else {
        stars += '<span class="star empty" style="color: #666;">☆</span>';
      }
    }
    return stars;
  }

  // Load reviews for a specific build
  async loadReviews(buildId) {
    const container = document.getElementById(`reviews-container-${buildId}`);
    if (!container) return;

    container.innerHTML = '<p style="color: var(--muted); text-align: center; padding: var(--space);">Loading reviews...</p>';
    
    try {
      const allReviews = this.getReviewsFromStorage(buildId);
      
      // Group reviews by user
      const reviewsByUser = {};
      allReviews.forEach(review => {
        if (!reviewsByUser[review.userId]) {
          reviewsByUser[review.userId] = [];
        }
        reviewsByUser[review.userId].push(review);
      });
      
      // Sort each user's reviews by timestamp (newest first) and take the 2 most recent
      const sortedReviews = [];
      Object.values(reviewsByUser).forEach(userReviews => {
        userReviews
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 2)
          .forEach(review => sortedReviews.push(review));
      });
      
      // Sort all reviews by timestamp (newest first)
      sortedReviews.sort((a, b) => b.timestamp - a.timestamp);
      
      if (sortedReviews.length === 0) {
        container.innerHTML = '<p style="color: var(--muted); text-align: center; padding: var(--space);">No reviews yet. Be the first to review this build!</p>';
        return;
      }

      const currentUser = this.getCurrentUser();
      container.innerHTML = sortedReviews.map((review, index) => {
        const isOwner = review.userId === currentUser.id;
        const reviewDate = new Date(review.timestamp).toLocaleDateString();
        
        // Count how many reviews this user has
        const userReviewCount = (reviewsByUser[review.userId] || []).length;
        
        return `
          <div class="review-card" data-review-id="${review.id}" style="background: var(--panel); border: 1px solid var(--border); border-radius: 12px; padding: var(--space); margin-bottom: var(--space);">
            <div class="review-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <div class="review-author" style="font-weight: 700; color: var(--accent1);">${review.author}</div>
                ${userReviewCount > 1 ? `<span style="font-size: 0.8rem; color: var(--muted);">(${userReviewCount} reviews)</span>` : ''}
              </div>
              <div style="display: flex; align-items: center; gap: 12px;">
                <div class="review-date" style="color: var(--muted); font-size: 0.9rem;">${reviewDate}</div>
                ${isOwner ? `
                  <div class="review-actions" style="display: flex; gap: 8px;">
                    <button onclick="reviewSystem.editReview('${buildId}', '${review.id}')" style="background: var(--accent1); color: #0b0f1a; border: 0; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; font-weight: 600;">Edit</button>
                    <button onclick="if(confirm('Are you sure you want to delete this review?')) reviewSystem.deleteReview('${buildId}', '${review.id}')" style="background: #ff6b6b; color: white; border: 0; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; font-weight: 600;">Delete</button>
                  </div>
                ` : ''}
              </div>
            </div>
            ${review.rating ? `
              <div class="review-rating" style="margin-bottom: 8px;">
                <div class="stars" style="font-size: 1.2rem;">
                  ${this.createStarRating(review.rating)}
                </div>
              </div>
            ` : ''}
            <div class="review-text" style="line-height: 1.5; color: var(--ink);">
              ${review.text}
            </div>
          </div>
        `;
      }).join('');
    } catch (error) {
      console.error('Error loading reviews:', error);
      container.innerHTML = '<p style="color: #ff6b6b; text-align: center; padding: var(--space);">Error loading reviews. Please try again.</p>';
    }
  }

  // Get reviews from localStorage
  getReviewsFromStorage(buildId) {
    try {
      const reviews = localStorage.getItem(`buildReviews_${buildId}`);
      return reviews ? JSON.parse(reviews) : [];
    } catch (error) {
      console.error('Error parsing reviews from storage:', error);
      return [];
    }
  }

  // Save reviews to localStorage
  saveReviewsToStorage(buildId, reviews) {
    try {
      localStorage.setItem(`buildReviews_${buildId}`, JSON.stringify(reviews));
    } catch (error) {
      console.error('Error saving reviews to storage:', error);
    }
  }

  // Submit a new review
  async submitReview(buildId, reviewData) {
    const currentUser = this.getCurrentUser();
    
    const review = {
      ...reviewData,
      userId: currentUser.id,
      author: currentUser.username,
      timestamp: Date.now(),
      id: 'review_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9) // More unique ID
    };
    
    try {
      const reviews = this.getReviewsFromStorage(buildId);
      
      // Add new review at the beginning
      reviews.unshift(review);
      
      // Keep only the 2 most recent reviews per user
      const userReviews = {};
      const filteredReviews = [];
      
      // First, sort all reviews by timestamp (newest first)
      reviews.sort((a, b) => b.timestamp - a.timestamp);
      
      // Then filter to keep only the 2 most recent per user
      reviews.forEach(review => {
        if (!userReviews[review.userId]) {
          userReviews[review.userId] = [];
        }
        
        if (userReviews[review.userId].length < 2) {
          userReviews[review.userId].push(review);
          filteredReviews.push(review);
        }
      });
      
      // Sort filtered reviews by timestamp (newest first)
      filteredReviews.sort((a, b) => b.timestamp - a.timestamp);
      
      this.saveReviewsToStorage(buildId, filteredReviews);
      await this.loadReviews(buildId);
      
      // Reset the form
      const reviewForm = document.getElementById('review-form');
      if (reviewForm) {
        reviewForm.reset();
        this.setStarRating(0);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error submitting review:', error);
      return { success: false, error: error.message };
    }
  }

  // Edit a review
  editReview(buildId, reviewId) {
    const reviews = this.getReviewsFromStorage(buildId);
    const reviewIndex = reviews.findIndex(r => r.id === reviewId);
    const review = reviews[reviewIndex];
    
    if (!review) return;
    
    const currentUser = this.getCurrentUser();
    if (review.userId !== currentUser.id) {
      alert('You can only edit your own reviews.');
      return;
    }
    
    // Show the review form
    const form = document.getElementById('review-form');
    const leaveBtn = document.getElementById('leave-review-btn');
    
    if (form && leaveBtn) {
      form.style.display = 'block';
      leaveBtn.style.display = 'none';
      
      // Populate form with existing data
      const textArea = document.getElementById('review-text');
      if (textArea) textArea.value = review.text;
      
      // Set rating stars
      this.setStarRating(review.rating || 0);
      
      // Store the review ID in a data attribute for the update
      form.setAttribute('data-edit-review-id', reviewId);
      
      // Change submit button to update mode
      const submitBtn = document.getElementById('submit-review');
      if (submitBtn) {
        submitBtn.textContent = 'Update Review';
        submitBtn.onclick = (e) => {
          e.preventDefault();
          this.updateReview(buildId, reviewId);
        };
      }
    }
  }

  // Update an existing review
  async updateReview(buildId, reviewId) {
    const rating = this.getSelectedRating();
    const text = document.getElementById('review-text')?.value?.trim();
    
    if (!text || text.length < 10) {
      alert('Review must be at least 10 characters long.');
      return;
    }
    
    const reviews = this.getReviewsFromStorage(buildId);
    const reviewIndex = reviews.findIndex(r => r.id === reviewId);
    
    if (reviewIndex !== -1) {
      // Create a new review object to maintain all properties
      const updatedReview = {
        ...reviews[reviewIndex],
        text,
        rating,
        timestamp: Date.now()
      };
      
      // Replace the old review with the updated one
      reviews[reviewIndex] = updatedReview;
      
      this.saveReviewsToStorage(buildId, reviews);
      await this.loadReviews(buildId);
      this.hideReviewForm();
      
      // Reset the form
      const reviewForm = document.getElementById('review-form');
      if (reviewForm) {
        reviewForm.reset();
        this.setStarRating(0);
        reviewForm.removeAttribute('data-edit-review-id');
      }
    }
  }

  // Delete a review
  async deleteReview(buildId, reviewId) {
    if (!confirm('Are you sure you want to delete this review?')) {
      return;
    }
    
    const reviews = this.getReviewsFromStorage(buildId);
    const reviewIndex = reviews.findIndex(r => r.id === reviewId);
    const currentUser = this.getCurrentUser();
    
    if (reviewIndex !== -1 && reviews[reviewIndex].userId === currentUser.id) {
      reviews.splice(reviewIndex, 1);
      this.saveReviewsToStorage(buildId, reviews);
      await this.loadReviews(buildId);
      
      // Show success message
      this.showMessage('Review deleted successfully!', 'success');
    } else {
      this.showMessage('You can only delete your own reviews.', 'error');
    }
  }

  // Setup event listeners
  setupEventListeners() {
    document.addEventListener('click', (e) => {
      // Handle star rating clicks
      if (e.target.classList.contains('rating-star')) {
        const star = e.target;
        const rect = star.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const rating = parseInt(star.dataset.rating);
        
        if (clickX < rect.width / 2) {
          this.setStarRating(rating - 0.5);
        } else {
          this.setStarRating(rating);
        }
      }
      
      // Handle leave review button
      if (e.target.id === 'leave-review-btn') {
        this.showReviewForm();
      }
      
      // Handle cancel review button
      if (e.target.id === 'cancel-review') {
        this.hideReviewForm();
      }
      
      // Handle submit review button
      if (e.target.id === 'submit-review') {
        this.handleReviewSubmission();
      }
    });

    // Listen for auth state changes
    window.addEventListener('authStateChanged', () => {
      this.currentUser = this.getCurrentUser();
    });
  }

  // Show review form
  showReviewForm() {
    const currentUser = this.getCurrentUser();
    // Allow Anonymous users to leave reviews; optionally show a gentle note
    if (!currentUser || currentUser.username === 'Anonymous') {
      // Informational message only; do not block
      this.showMessage('Leaving an anonymous review. Log in for editing and history.', 'info');
    }

    const form = document.getElementById('review-form');
    const leaveBtn = document.getElementById('leave-review-btn');
    
    if (form && leaveBtn) {
      form.style.display = 'block';
      leaveBtn.style.display = 'none';
      
      // Reset form
      const textArea = document.getElementById('review-text');
      if (textArea) textArea.value = '';
      this.setStarRating(0);
      
      // Clear any edit mode
      form.removeAttribute('data-edit-review-id');
      
      // Reset submit button
      const submitBtn = document.getElementById('submit-review');
      if (submitBtn) {
        submitBtn.textContent = 'Submit Review';
        submitBtn.onclick = (e) => {
          e.preventDefault();
          this.handleReviewSubmission();
        };
      }
    }
  }

  // Hide review form
  hideReviewForm() {
    const form = document.getElementById('review-form');
    const leaveBtn = document.getElementById('leave-review-btn');
    
    if (form && leaveBtn) {
      form.style.display = 'none';
      form.reset();
      form.removeAttribute('data-edit-review-id');
      leaveBtn.style.display = 'block';
      this.setStarRating(0);
    }
  }
  
  // Show a message to the user
  showMessage(message, type = 'info') {
    // Remove any existing messages
    const existingMessages = document.querySelectorAll('.review-message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `review-message ${type}`;
    messageEl.textContent = message;
    messageEl.style.padding = '10px';
    messageEl.style.margin = '10px 0';
    messageEl.style.borderRadius = '4px';
    messageEl.style.fontWeight = '500';
    
    // Style based on message type
    switch (type) {
      case 'success':
        messageEl.style.backgroundColor = 'rgba(40, 167, 69, 0.2)';
        messageEl.style.color = '#28a745';
        messageEl.style.border = '1px solid #28a745';
        break;
      case 'error':
        messageEl.style.backgroundColor = 'rgba(220, 53, 69, 0.2)';
        messageEl.style.color = '#dc3545';
        messageEl.style.border = '1px solid #dc3545';
        break;
      case 'info':
      default:
        messageEl.style.backgroundColor = 'rgba(23, 162, 184, 0.2)';
        messageEl.style.color = '#17a2b8';
        messageEl.style.border = '1px solid #17a2b8';
    }
    
    // Insert message above the reviews container
    const buildId = this.getCurrentBuildId();
    if (buildId) {
      const container = document.getElementById(`reviews-container-${buildId}`);
      if (container) {
        container.parentNode.insertBefore(messageEl, container);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
          messageEl.style.opacity = '0';
          messageEl.style.transition = 'opacity 0.5s ease';
          setTimeout(() => {
            if (messageEl.parentNode) {
              messageEl.parentNode.removeChild(messageEl);
            }
          }, 500);
        }, 5000);
      }
    }
  }

  // Handle review submission
  async handleReviewSubmission() {
    const rating = this.getSelectedRating();
    const text = document.getElementById('review-text')?.value?.trim();
    
    if (!rating) {
      this.showMessage('Please select a rating', 'error');
      return;
    }
    
    if (!text || text.length < 10) {
      this.showMessage('Review must be at least 10 characters long', 'error');
      return;
    }
    
    const buildId = this.getCurrentBuildId();
    if (!buildId) {
      this.showMessage('Error: Could not determine build ID', 'error');
      return;
    }
    
    // Check if we're editing an existing review
    const reviewForm = document.getElementById('review-form');
    const reviewId = reviewForm?.getAttribute('data-edit-review-id');
    
    try {
      if (reviewId) {
        // Update existing review
        await this.updateReview(buildId, reviewId);
      } else {
        // Submit new review
        const result = await this.submitReview(buildId, { rating, text });
        
        if (result.success) {
          this.hideReviewForm();
          this.showMessage('Review submitted successfully!', 'success');
        } else {
          throw new Error(result.error || 'Failed to submit review');
        }
      }
    } catch (error) {
      console.error('Error handling review submission:', error);
      this.showMessage('Error: ' + (error.message || 'Failed to process review'), 'error');
    }
  }

  // Get currently selected rating
  getSelectedRating() {
    const ratingInput = document.getElementById('review-rating');
    return ratingInput ? parseFloat(ratingInput.value) : 0;
  }

  // Set star rating visually
  setStarRating(rating) {
    const stars = document.querySelectorAll('.rating-star');
    const ratingInput = document.getElementById('review-rating');
    if (ratingInput) {
      ratingInput.value = rating;
    }

    stars.forEach(star => {
      const starRating = parseInt(star.dataset.rating);
      if (starRating <= rating) {
        star.textContent = '★';
        star.style.color = '#ffd700';
      } else if (starRating - 0.5 === rating) {
        star.textContent = '★'; // Visually it's a full star, but CSS will clip it
        star.style.color = 'var(--muted)'; // Base color
        star.classList.add('half');
      } else {
        star.textContent = '☆';
        star.style.color = 'var(--muted)';
      }

      // Clean up half-star class if not needed
      if (starRating - 0.5 !== rating) {
        star.classList.remove('half');
      }
    });
  }

  // Get current build ID from page
  getCurrentBuildId() {
    const path = window.location.pathname;
    const match = path.match(/builds\/(.+)\.html/);
    if (match) {
      return match[1];
    }
    const container = document.querySelector('[id^="reviews-container-"]');
    if (container) {
      return container.id.replace('reviews-container-', '');
    }
    return null;
  }
}

// Initialize review system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.reviewSystem = new ReviewSystem();
  const buildId = window.reviewSystem.getCurrentBuildId();
  if (buildId) {
    window.reviewSystem.loadReviews(buildId);
  }
});

// Add CSS animations and styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
  .rating-star {
    transition: color 0.2s ease, transform 0.2s ease;
    position: relative;
  }
  .rating-star:hover {
    transform: scale(1.1);
  }
  .rating-star.half::before {
    content: '★';
    position: absolute;
    left: 0;
    top: 0;
    width: 50%;
    overflow: hidden;
    color: #ffd700;
  }
`;
document.head.appendChild(style);

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ReviewSystem;
} else {
  window.ReviewSystem = ReviewSystem;
}