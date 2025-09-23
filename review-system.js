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
      const reviews = this.getReviewsFromStorage(buildId);
      
      if (reviews.length === 0) {
        container.innerHTML = '<p style="color: var(--muted); text-align: center; padding: var(--space);">No reviews yet. Be the first to review this build!</p>';
        return;
      }

      const currentUser = this.getCurrentUser();
      container.innerHTML = reviews.map((review, index) => {
        const isOwner = review.userId === currentUser.id;
        const reviewDate = new Date(review.timestamp).toLocaleDateString();
        
        return `
          <div class="review-card" data-review-id="${index}" style="background: var(--panel); border: 1px solid var(--border); border-radius: 12px; padding: var(--space); margin-bottom: var(--space);">
            <div class="review-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <div class="review-author" style="font-weight: 700; color: var(--accent1);">${review.author}</div>
              <div style="display: flex; align-items: center; gap: 12px;">
                <div class="review-date" style="color: var(--muted); font-size: 0.9rem;">${reviewDate}</div>
                ${isOwner ? `
                  <div class="review-actions" style="display: flex; gap: 8px;">
                    <button onclick="reviewSystem.editReview('${buildId}', ${index})" style="background: var(--accent1); color: #0b0f1a; border: 0; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; font-weight: 600;">Edit</button>
                    <button onclick="reviewSystem.deleteReview('${buildId}', ${index})" style="background: #ff6b6b; color: white; border: 0; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; font-weight: 600;">Delete</button>
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
      id: 'review_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
    };
    
    try {
      const reviews = this.getReviewsFromStorage(buildId);
      
      // Add new review at the beginning
      reviews.unshift(review);
      
      // Keep only the 2 most recent reviews per user
      const userReviews = {};
      const filteredReviews = [];
      
      reviews.forEach(review => {
        if (!userReviews[review.userId]) {
          userReviews[review.userId] = [];
        }
        
        if (userReviews[review.userId].length < 2) {
          userReviews[review.userId].push(review);
          filteredReviews.push(review);
        }
      });
      
      this.saveReviewsToStorage(buildId, filteredReviews);
      await this.loadReviews(buildId);
      
      return { success: true };
    } catch (error) {
      console.error('Error submitting review:', error);
      return { success: false, error: error.message };
    }
  }

  // Edit a review
  editReview(buildId, reviewIndex) {
    const reviews = this.getReviewsFromStorage(buildId);
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
      
      // Change submit button to update mode
      const submitBtn = document.getElementById('submit-review');
      if (submitBtn) {
        submitBtn.textContent = 'Update Review';
        submitBtn.onclick = () => this.updateReview(buildId, reviewIndex);
      }
    }
  }

  // Update an existing review
  async updateReview(buildId, reviewIndex) {
    const rating = this.getSelectedRating();
    const text = document.getElementById('review-text')?.value?.trim();
    
    if (!text || text.length < 10) {
      alert('Review must be at least 10 characters long.');
      return;
    }
    
    const reviews = this.getReviewsFromStorage(buildId);
    if (reviews[reviewIndex]) {
      reviews[reviewIndex].text = text;
      reviews[reviewIndex].rating = rating;
      reviews[reviewIndex].timestamp = Date.now(); // Update timestamp
      
      this.saveReviewsToStorage(buildId, reviews);
      await this.loadReviews(buildId);
      this.hideReviewForm();
    }
  }

  // Delete a review
  async deleteReview(buildId, reviewIndex) {
    if (!confirm('Are you sure you want to delete this review?')) return;
    
    const reviews = this.getReviewsFromStorage(buildId);
    const currentUser = this.getCurrentUser();
    
    if (reviews[reviewIndex] && reviews[reviewIndex].userId === currentUser.id) {
      reviews.splice(reviewIndex, 1);
      this.saveReviewsToStorage(buildId, reviews);
      await this.loadReviews(buildId);
    }
  }

  // Set up event listeners
  setupEventListeners() {
    document.addEventListener('click', (e) => {
      // Handle star rating clicks
      if (e.target.classList.contains('rating-star')) {
        const rating = parseInt(e.target.dataset.rating);
        this.setStarRating(rating);
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
    if (!currentUser || currentUser.username === 'Anonymous') {
      alert('Please log in to leave a review.');
      return;
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
      
      // Reset submit button
      const submitBtn = document.getElementById('submit-review');
      if (submitBtn) {
        submitBtn.textContent = 'Submit Review';
        submitBtn.onclick = () => this.handleReviewSubmission();
      }
    }
  }

  // Hide review form
  hideReviewForm() {
    const form = document.getElementById('review-form');
    const leaveBtn = document.getElementById('leave-review-btn');
    
    if (form && leaveBtn) {
      form.style.display = 'none';
      leaveBtn.style.display = 'block';
    }
  }

  // Handle review submission
  async handleReviewSubmission() {
    const rating = this.getSelectedRating();
    const text = document.getElementById('review-text')?.value?.trim();
    
    if (!text || text.length < 10) {
      alert('Review must be at least 10 characters long.');
      return;
    }
    
    const buildId = this.getCurrentBuildId();
    if (!buildId) {
      alert('Error: Could not determine build ID.');
      return;
    }
    
    const result = await this.submitReview(buildId, { rating, text });
    
    if (result.success) {
      this.hideReviewForm();
      // Show success message briefly
      this.showMessage('Review submitted successfully!', 'success');
    } else {
      alert('Error submitting review: ' + (result.error || 'Unknown error'));
    }
  }

  // Get currently selected rating
  getSelectedRating() {
    const stars = document.querySelectorAll('.rating-star');
    let rating = 0;
    stars.forEach(star => {
      if (star.style.color === 'rgb(255, 215, 0)' || star.style.color === '#ffd700') {
        rating = Math.max(rating, parseInt(star.dataset.rating));
      }
    });
    return rating;
  }

  // Set star rating visually
  setStarRating(rating) {
    const stars = document.querySelectorAll('.rating-star');
    stars.forEach(star => {
      const starRating = parseInt(star.dataset.rating);
      if (starRating <= rating) {
        star.style.color = '#ffd700';
        star.textContent = '★';
      } else {
        star.style.color = 'var(--muted)';
        star.textContent = '☆';
      }
    });
  }

  // Get current build ID from page
  getCurrentBuildId() {
    // Try to extract from URL or page elements
    const path = window.location.pathname;
    const match = path.match(/builds\/(.+)\.html/);
    if (match) {
      return match[1];
    }
    
    // Fallback: look for reviews container
    const container = document.querySelector('[id^="reviews-container-"]');
    if (container) {
      return container.id.replace('reviews-container-', '');
    }
    
    return null;
  }

  // Show temporary message
  showMessage(text, type = 'info') {
    const message = document.createElement('div');
    message.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? 'var(--accent2)' : 'var(--accent1)'};
      color: #0b0f1a;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: 600;
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    message.textContent = text;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
      message.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => message.remove(), 300);
    }, 3000);
  }
}

// Initialize review system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.reviewSystem = new ReviewSystem();
  
  // Auto-load reviews for current build
  const buildId = window.reviewSystem.getCurrentBuildId();
  if (buildId) {
    window.reviewSystem.loadReviews(buildId);
  }
});

// Add CSS animations
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
    transition: color 0.2s ease;
  }
  
  .rating-star:hover {
    transform: scale(1.1);
  }
`;
document.head.appendChild(style);

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ReviewSystem;
} else {
  window.ReviewSystem = ReviewSystem;
}