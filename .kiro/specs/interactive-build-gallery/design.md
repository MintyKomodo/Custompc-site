# Design Document

## Overview

The Interactive Build Gallery feature enhances the existing builds.html page by implementing a responsive grid layout, modal popup system, and comprehensive build detail pages with user reviews. The design leverages the existing CSS custom properties and JavaScript patterns while adding new interactive components that maintain the site's visual consistency and performance standards.

The system consists of three main components:
1. **Enhanced Grid Layout** - Responsive 3-column build gallery with hover effects
2. **Modal Popup System** - Quick preview overlays with build details and navigation
3. **Detailed Build Pages** - Comprehensive build information with user review functionality

## Architecture

### Component Structure

```
Interactive Build Gallery
├── Grid Layout System
│   ├── Build Cards (500px height, 350px images)
│   ├── Responsive Grid (3 columns → 2 → 1)
│   └── Hover/Focus States
├── Modal System
│   ├── Popup Overlay (backdrop blur)
│   ├── Modal Content (left: image, right: specs)
│   ├── Navigation Controls
│   └── Accessibility Features
└── Build Detail Pages
    ├── Hero Section (large image + title)
    ├── Description & Specifications
    ├── Size & Dimensions
    └── Reviews System
        ├── Review Display
        ├── Rating System (5-star)
        └── Review Submission
```

### Data Flow

1. **Page Load**: builds.html loads with enhanced grid layout
2. **User Interaction**: Click on build card triggers modal
3. **Modal Display**: Shows build preview with "Open in new tab" option
4. **Navigation**: User can open dedicated build page
5. **Review System**: Users can view and submit reviews on build pages

## Components and Interfaces

### 1. Enhanced Grid Layout

**Purpose**: Display builds in a responsive 3-column grid with consistent sizing and hover effects.

**Implementation**:
- Modify existing `.gallery` CSS to enforce 3-column layout
- Set `.card` height to 500px with `.thumb-container` at 350px
- Maintain existing hover animations and accessibility features
- Use CSS Grid with `grid-template-columns: repeat(3, 1fr)`
- Responsive breakpoints: 3 cols → 2 cols (tablet) → 1 col (mobile)

**Key CSS Classes**:
```css
.gallery {
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}
.card {
  height: 500px;
}
.thumb-container {
  height: 350px;
}
```

### 2. Modal Popup System

**Purpose**: Provide quick build previews without page navigation.

**Current Implementation**: The existing modal system in builds.html already provides:
- Backdrop blur effect
- Left-right layout (image + specs)
- "Open in new tab" functionality
- Keyboard navigation and focus management
- Accessibility attributes (ARIA)

**Enhancement Needed**: Ensure modal opens correctly for all build cards and maintains consistent behavior.

**JavaScript Interface**:
```javascript
// Existing functions to maintain
function openFromCard(card)
function closeModal()
// Event handlers for click, keyboard, focus management
```

### 3. Build Detail Pages

**Purpose**: Comprehensive build information with scrollable sections and review system.

**Current Structure**: Existing build pages (e.g., esports-1080p-1440p.html) provide:
- Hero image section
- Build specifications
- Description text
- Request build functionality

**Enhancements Needed**:
1. **Size & Dimensions Section**: Add scrollable section with physical specifications
2. **Reviews Section**: Implement review display and submission system

**Page Structure**:
```html
<div class="build-container">
  <div class="hero-section">
    <!-- Large build image -->
    <!-- Build title -->
  </div>
  <div class="content-sections">
    <!-- Description -->
    <!-- Specifications -->
    <!-- Size & Dimensions (NEW) -->
    <!-- Reviews Section (NEW) -->
  </div>
</div>
```

### 4. Reviews System

**Purpose**: Allow users to view and submit reviews with star ratings.

**Components**:

**Review Display**:
- List existing reviews with author, date, rating, and text
- Star rating visualization (1-5 stars or unrated)
- Responsive layout for review cards

**Review Submission**:
- "Leave a review" button
- Text input field for review content
- Interactive 5-star rating selector
- Submit functionality with validation

**Data Storage**: 
- Use localStorage for client-side review persistence
- JSON structure: `{ buildId, reviews: [{ author, date, rating, text }] }`

**Review Interface**:
```javascript
// Review management functions
function loadReviews(buildId)
function submitReview(buildId, reviewData)
function displayReviews(reviews)
function initializeRatingSelector()
```

## Data Models

### Build Data Structure
```javascript
{
  id: "esports-1080p-1440p",
  title: "Esports 1080p/1440p",
  description: "High FPS for Valorant/CS2. Air-cooled, low noise.",
  image: "images/build_01.png",
  specifications: {
    cpu: "6–8 core current-gen class",
    gpu: "Mid–high tier (great 1440p esports)",
    ram: "32GB DDR5, dual-channel",
    storage: "1TB NVMe Gen4",
    cooling: "Quiet tower air cooler",
    case: "Airflow-focused ATX",
    psu: "750W 80+ Gold"
  },
  dimensions: {
    height: "450mm",
    width: "200mm", 
    depth: "400mm",
    weight: "12kg"
  },
  features: ["Low input latency", "Thermals under control", "Simple upgrades later"]
}
```

### Review Data Structure
```javascript
{
  id: "review_" + Date.now(),
  buildId: "esports-1080p-1440p",
  author: "Anonymous", // Default for public reviews
  date: "2025-01-15",
  rating: 4, // 0-5 (0 = no rating)
  text: "Great build for competitive gaming. Runs Valorant at 300+ FPS consistently."
}
```

### LocalStorage Schema
```javascript
// Key: "buildReviews_" + buildId
{
  "buildReviews_esports-1080p-1440p": [
    {
      id: "review_1642234567890",
      author: "Anonymous",
      date: "2025-01-15",
      rating: 4,
      text: "Excellent performance for esports titles."
    }
  ]
}
```

## Error Handling

### Modal System
- **Failed to load build data**: Display fallback content with generic build information
- **Image loading errors**: Show placeholder image with build icon
- **JavaScript errors**: Graceful degradation to direct page navigation

### Review System
- **LocalStorage unavailable**: Display read-only message, disable review submission
- **Invalid review data**: Show validation errors, prevent submission
- **Rating not selected**: Allow submission with 0 rating (unrated)
- **Empty review text**: Require minimum 10 characters for review submission

### Responsive Design
- **Small screens**: Stack modal content vertically, adjust grid to single column
- **Touch devices**: Ensure adequate touch targets (44px minimum)
- **Keyboard navigation**: Maintain focus management and skip links

## Testing Strategy

### Unit Testing
- **Modal functionality**: Open/close behavior, content population, keyboard navigation
- **Review system**: Submit, display, validation, localStorage operations
- **Grid layout**: Responsive behavior, card interactions, accessibility

### Integration Testing
- **End-to-end user flows**: Browse builds → open modal → navigate to detail page → submit review
- **Cross-browser compatibility**: Test modal behavior across modern browsers
- **Accessibility testing**: Screen reader compatibility, keyboard navigation, ARIA attributes

### Performance Testing
- **Image loading**: Optimize build images, implement lazy loading for large galleries
- **LocalStorage limits**: Test with large numbers of reviews, implement cleanup if needed
- **Modal animations**: Ensure smooth transitions on lower-end devices

### Visual Testing
- **Responsive breakpoints**: Verify grid layout at various screen sizes
- **Modal positioning**: Test modal centering and backdrop behavior
- **Review display**: Ensure consistent formatting across different review lengths

## Implementation Notes

### CSS Custom Properties
Leverage existing CSS variables for consistency:
- `--space` for consistent spacing
- `--panel`, `--panel2` for background colors
- `--border` for consistent borders
- `--accent1`, `--accent2` for interactive elements
- `--radius` for consistent border radius

### JavaScript Patterns
Follow existing patterns:
- Event delegation for dynamic content
- LocalStorage for client-side persistence
- Accessibility-first approach with ARIA attributes
- Progressive enhancement principles

### Performance Considerations
- **Image optimization**: Ensure build images are appropriately sized (recommend 800x600px max)
- **Lazy loading**: Implement for images below the fold
- **CSS animations**: Use transform and opacity for smooth animations
- **JavaScript efficiency**: Minimize DOM queries, cache frequently accessed elements