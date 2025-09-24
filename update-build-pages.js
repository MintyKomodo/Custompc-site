// Script to update all build pages with the review system
const fs = require('fs');
const path = require('path');

// List of all build pages
const buildPages = [
  'photo-pro.html',
  'rgb-showcase.html',
  'silence-optimized.html',
  'small-form-factor.html',
  'streaming-gaming.html'
];

// The review section HTML to insert
const reviewSection = `
  <!-- Reviews Section -->
  <section class="reviews-section" style="margin-top: var(--space); background: var(--panel2); border: 1px solid var(--border); border-radius: var(--radius); padding: var(--space);">
    <h3 style="margin-top: 0; margin-bottom: var(--space); color: var(--accent1);">Reviews</h3>
    
    <!-- Review Form -->
    <div id="review-form" style="margin-bottom: var(--space);">
      <h4 style="margin-top: 0; margin-bottom: 12px;">Write a Review</h4>
      <form id="review-form-content">
        <div style="margin-bottom: 12px;">
          <div class="star-rating" style="font-size: 24px; margin-bottom: 8px;">
            <span class="star rating-star" data-rating="1" style="cursor: pointer; color: #666;">☆</span>
            <span class="star rating-star" data-rating="2" style="cursor: pointer; color: #666;">☆</span>
            <span class="star rating-star" data-rating="3" style="cursor: pointer; color: #666;">☆</span>
            <span class="star rating-star" data-rating="4" style="cursor: pointer; color: #666;">☆</span>
            <span class="star rating-star" data-rating="5" style="cursor: pointer; color: #666;">☆</span>
            <input type="hidden" id="review-rating" value="0">
          </div>
        </div>
        <div style="margin-bottom: 12px;">
          <textarea id="review-text" 
            style="width: 100%; min-height: 100px; padding: 12px; border-radius: 8px; background: var(--panel); border: 1px solid var(--border); color: var(--ink);" 
            placeholder="Share your thoughts about this build..." required></textarea>
        </div>
        <div style="display: flex; gap: 12px;">
          <button type="submit" 
            style="background: var(--accent1); color: #0b0f1a; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer;">
            Submit Review
          </button>
          <button type="button" id="cancel-review"
            style="background: var(--panel); color: var(--ink); border: 1px solid var(--border); padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer;">
            Cancel
          </button>
        </div>
      </form>
    </div>
    
    <!-- Reviews Container -->
    <div id="reviews-container-{BUILD_ID}">
      <!-- Reviews will be loaded here -->
    </div>
    
    <!-- Leave Review Button -->
    <div style="margin-top: var(--space); padding-top: var(--space); border-top: 1px solid var(--border);">
      <button id="leave-review-btn" 
        style="background: var(--accent1); color: #0b0f1a; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 700; cursor: pointer;">
        Leave a Review
      </button>
    </div>
  </section>
`;

// The script to add before the closing body tag
const scriptToAdd = `
  <!-- Include Review System -->
  <script src="../review-system.js"></script>
  <script src="../js/init-reviews.js"></script>
`;

// Function to update a single build page
function updateBuildPage(buildPage) {
  const buildId = buildPage.replace('.html', '');
  const buildPath = path.join(__dirname, 'builds', buildPage);
  
  try {
    // Read the file
    let content = fs.readFileSync(buildPath, 'utf8');
    
    // Check if the page already has a reviews section
    if (content.includes('reviews-container-')) {
      console.log(`Skipping ${buildPage} - already has reviews section`);
      return;
    }
    
    // Find the position to insert the reviews section (before the closing </div> of the wrap div)
    const insertPosition = content.lastIndexOf('</div>', content.lastIndexOf('</div>'));
    
    if (insertPosition === -1) {
      console.error(`Could not find insertion point in ${buildPage}`);
      return;
    }
    
    // Insert the reviews section
    const updatedContent = 
      content.substring(0, insertPosition) + 
      reviewSection.replace(/{BUILD_ID}/g, buildId) + 
      content.substring(insertPosition);
    
    // Find the position to insert the script (before the closing </body> tag)
    const scriptPosition = updatedContent.lastIndexOf('</body>');
    
    if (scriptPosition === -1) {
      console.error(`Could not find </body> tag in ${buildPage}`);
      return;
    }
    
    // Insert the script
    const finalContent = 
      updatedContent.substring(0, scriptPosition) + 
      scriptToAdd.replace(/{BUILD_ID}/g, buildId) + 
      updatedContent.substring(scriptPosition);
    
    // Write the updated content back to the file
    fs.writeFileSync(buildPath, finalContent, 'utf8');
    console.log(`Updated ${buildPage} with review system`);
    
  } catch (error) {
    console.error(`Error updating ${buildPage}:`, error);
  }
}

// Process all build pages
buildPages.forEach(updateBuildPage);

console.log('All build pages have been updated with the review system.');
