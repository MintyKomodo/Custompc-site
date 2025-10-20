/**
 * Initialize Review System for Build Pages
 * This script ensures consistent review functionality across all build pages
 */

document.addEventListener('DOMContentLoaded', function() {
  // The ReviewSystem class handles its own initialization
  // This file is kept for compatibility but functionality is in review-system.js
  console.log('Review system initialization delegated to ReviewSystem class');
});

/**
 * Get the build ID from the current page
 * @returns {string} The build ID
 */
function getBuildId() {
  // Try to get from URL first (e.g., builds/creator-4k.html)
  const path = window.location.pathname;
  const match = path.match(/builds\/([^\/]+)\.html/);
  if (match && match[1]) {
    return match[1];
  }
  
  // Try to get from the reviews container ID
  const container = document.querySelector('[id^="reviews-container-"]');
  if (container) {
    return container.id.replace('reviews-container-', '');
  }
  
  // Try to get from page title or other elements
  const pageTitle = document.title.toLowerCase();
  if (pageTitle.includes('creator')) return 'creator-4k';
  if (pageTitle.includes('esports')) return 'esports-1080p-1440p';
  if (pageTitle.includes('cad') || pageTitle.includes('ai')) return 'cad-ai-workstation';
  if (pageTitle.includes('photo')) return 'photo-pro';
  if (pageTitle.includes('rgb')) return 'rgb-showcase';
  if (pageTitle.includes('silence')) return 'silence-optimized';
  if (pageTitle.includes('small') || pageTitle.includes('form factor')) return 'small-form-factor';
  if (pageTitle.includes('stream')) return 'streaming-gaming';
  
  // Default fallback
  return 'default-build';
}

/**
 * Set up star rating interaction
 */
function setupStarRating() {
  const starContainers = document.querySelectorAll('.star-rating');
  
  starContainers.forEach(container => {
    const stars = container.querySelectorAll('.star');
    const ratingInput = container.parentElement.querySelector('input[type="hidden"]');
    
    if (!ratingInput) return;
    
    stars.forEach(star => {
      star.addEventListener('click', function() {
        const value = parseInt(this.getAttribute('data-rating'));
        ratingInput.value = value;
        
        // Update star display
        stars.forEach((s, index) => {
          s.textContent = index < value ? '★' : '☆';
          s.style.color = index < value ? '#ffd700' : '#666';
        });
      });
      
      // Add hover effect
      star.addEventListener('mouseover', function() {
        const value = parseInt(this.getAttribute('data-rating'));
        stars.forEach((s, index) => {
          s.style.color = index < value ? '#ffd700' : '#666';
        });
      });
      
      // Reset on mouse out if no rating selected
      star.addEventListener('mouseout', function() {
        const currentRating = parseInt(ratingInput.value) || 0;
        stars.forEach((s, index) => {
          s.style.color = index < currentRating ? '#ffd700' : '#666';
        });
      });
    });
  });
}

// Make sure the review system is available when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    if (typeof ReviewSystem === 'function' && !window.reviewSystem) {
      window.reviewSystem = new ReviewSystem();
    }
  });
} else if (typeof ReviewSystem === 'function' && !window.reviewSystem) {
  window.reviewSystem = new ReviewSystem();
}
