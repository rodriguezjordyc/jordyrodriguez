// Global error handler for robustness
window.addEventListener('error', function(e) {
    console.error('Global error caught:', e.error);

    // Try to show a fallback message if possible
    const blogElement = document.getElementById('blog-index') || document.getElementById('blog-post');
    if (blogElement && blogElement.innerHTML.includes('loading')) {
        blogElement.innerHTML = `
            <div class="error-message">
                <h2>Something Went Wrong</h2>
                <p>We encountered an unexpected error. Please refresh the page to try again.</p>
                <p><a href="/about">← Return to About</a></p>
            </div>
        `;
    }
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    e.preventDefault(); // Prevent browser's default behavior
});

// Blog Integration using pre-fetched content
document.addEventListener('DOMContentLoaded', function() {
    try {
        showBlogIndex();
    } catch (error) {
        console.error('Error during blog initialization:', error);
        const blogElement = document.getElementById('blog-index');
        if (blogElement) {
            blogElement.innerHTML = `
                <div class="error-message">
                    <h2>Blog Initialization Failed</h2>
                    <p>Unable to initialize the blog system. Please refresh the page.</p>
                    <p><a href="/about">← Return to About</a></p>
                </div>
            `;
        }
    }
});


// Cache for blog posts
let cachedBlogPosts = null;


// Load blog posts from local JSON file with robust error handling
async function fetchBlogPosts() {
    // Return cached data if available
    if (cachedBlogPosts) {
        return cachedBlogPosts;
    }

    try {
        // Check if fetch is available (polyfill for older browsers)
        if (typeof fetch === 'undefined') {
            throw new Error('Fetch API not supported');
        }

        const response = await fetch('/blog-content.json');

        if (!response.ok) {
            throw new Error(`Failed to load blog content: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Validate data structure
        if (!data || typeof data !== 'object' || !data.posts) {
            throw new Error('Invalid blog data structure');
        }

        // Cache the posts
        cachedBlogPosts = data.posts;

        return data.posts;

    } catch (error) {
        console.error('Error loading blog posts:', error);

        // Try to show a meaningful error to user
        const blogIndexElement = document.getElementById('blog-index');
        if (blogIndexElement) {
            blogIndexElement.innerHTML = `
                <div class="error-message">
                    <h2>Blog Temporarily Unavailable</h2>
                    <p>We're having trouble loading the blog content. Please try refreshing the page or check back later.</p>
                    <p><a href="/about">← Return to About</a></p>
                </div>
            `;
        }

        return {};
    }
}

// Get post content from cached data (already fetched)
function getPostContent(posts, slug) {
    const post = posts[slug];
    return post ? post.content || '' : '';
}


// Load and display blog index with error handling
async function showBlogIndex() {
    const blogIndexElement = document.getElementById('blog-index');
    const blogPostElement = document.getElementById('blog-post');

    // Safety check for DOM elements
    if (!blogIndexElement || !blogPostElement) {
        console.error('Required DOM elements not found');
        return;
    }

    // Show loading state
    blogIndexElement.innerHTML = '<div class="loading">Loading posts...</div>';
    blogIndexElement.style.display = 'block';
    blogPostElement.style.display = 'none';
    
    // Update page title
    document.title = 'jordy rodriguez';
    
    // Clear hash
    if (window.location.hash) {
        history.pushState("", document.title, window.location.pathname);
    }
    
    // Load posts
    const posts = await fetchBlogPosts();
    
    if (Object.keys(posts).length === 0) {
        // Show fallback content
        blogIndexElement.innerHTML = `
            <div class="blog-index">
                <div style="text-align: center; margin-top: 2rem; padding: 1rem; background: #f5f5f5; border-radius: 4px;">
                    <p>Unable to load posts from Notion. Please check the configuration.</p>
                </div>
            </div>
        `;
        return;
    }
    
    // Generate blog index HTML
    let html = '<div class="blog-index">';
    
    for (const [slug, post] of Object.entries(posts)) {
        const postDate = new Date(post.published_date);
        const formattedDate = postDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        
        html += `
            <article class="blog-index-item">
                <h2><a href="#${slug}" onclick="event.preventDefault(); showBlogPost('${slug}'); return false;">${post.title}</a></h2>
                <p class="post-excerpt">${post.excerpt}</p>
            </article>
        `;
    }
    
    html += '</div>';
    blogIndexElement.innerHTML = html;
}

// Show individual blog post
async function showBlogPost(slug) {
    const posts = cachedBlogPosts || await fetchBlogPosts();
    const post = posts[slug];
    
    if (!post) {
        console.error('Post not found:', slug);
        return;
    }

    const blogIndexElement = document.getElementById('blog-index');
    const blogPostElement = document.getElementById('blog-post');
    const postContentElement = document.getElementById('post-content');
    
    // Show loading state
    postContentElement.innerHTML = '<div class="loading">Loading post...</div>';
    blogIndexElement.style.display = 'none';
    blogPostElement.style.display = 'block';
    
    // Update page title and URL
    document.title = `${post.title} - jordy rodriguez`;
    history.pushState({post: slug}, document.title, `#${slug}`);
    
    // Get post content (already fetched)
    const content = getPostContent(posts, slug);
    
    if (content && content.trim()) {
        const formattedDate = new Date(post.published_date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        postContentElement.innerHTML = `
            <div class="post-header">
                <h1>${post.title}</h1>
                <p class="post-meta">${formattedDate}</p>
            </div>
            <div class="post-body">
                ${content}
            </div>
        `;
    } else {
        postContentElement.innerHTML = `
            <div class="error-message">
                <h2>Content not available</h2>
                <p>This post content is not currently available. Please try refreshing the page.</p>
                <p><a href="#" onclick="showBlogIndex()">← Back</a></p>
            </div>
        `;
    }
}

// Handle browser back/forward buttons
window.addEventListener('popstate', function(e) {
    if (e.state && e.state.post) {
        showBlogPost(e.state.post);
    } else {
        showBlogIndex();
    }
});

// Handle direct hash navigation
window.addEventListener('load', function() {
    const hash = window.location.hash.substring(1);
    if (hash) {
        showBlogPost(hash);
    }
});

// Image Zoom Functionality
class ImageZoom {
    constructor() {
        this.overlay = null;
        this.isOpen = false;
        this.init();
    }

    init() {
        // Create overlay element
        this.createOverlay();

        // Add event listeners for images
        this.bindEvents();

        // Handle keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'image-zoom-overlay';

        const container = document.createElement('div');
        container.className = 'image-zoom-container';

        const closeButton = document.createElement('button');
        closeButton.className = 'image-zoom-close';
        closeButton.innerHTML = '×';
        closeButton.setAttribute('aria-label', 'Close image');

        this.overlay.appendChild(container);
        this.overlay.appendChild(closeButton);
        document.body.appendChild(this.overlay);

        // Close on overlay click
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay || e.target === closeButton) {
                this.close();
            }
        });
    }

    bindEvents() {
        // Use event delegation to handle dynamically loaded images
        document.addEventListener('click', (e) => {
            const img = e.target;
            if (img.tagName === 'IMG' && img.closest('.post-content')) {
                e.preventDefault();
                this.open(img);
            }
        });
    }

    open(img) {
        if (this.isOpen) return;

        this.isOpen = true;

        // Create zoomed image
        const zoomedImg = img.cloneNode();
        zoomedImg.style.cursor = 'zoom-out';

        // Clear container and add new image
        const container = this.overlay.querySelector('.image-zoom-container');
        container.innerHTML = '';
        container.appendChild(zoomedImg);

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Show overlay with animation
        this.overlay.classList.add('active');

        // Handle touch events for mobile
        let startY = 0;
        const handleTouchStart = (e) => {
            startY = e.touches[0].clientY;
        };

        const handleTouchMove = (e) => {
            if (!this.isOpen) return;

            const currentY = e.touches[0].clientY;
            const diffY = Math.abs(currentY - startY);

            // If user swipes down significantly, close the modal
            if (currentY - startY > 100 && diffY > 50) {
                this.close();
            }
        };

        this.overlay.addEventListener('touchstart', handleTouchStart, { passive: true });
        this.overlay.addEventListener('touchmove', handleTouchMove, { passive: true });
    }

    close() {
        if (!this.isOpen) return;

        this.isOpen = false;

        // Hide overlay
        this.overlay.classList.remove('active');

        // Restore body scroll
        document.body.style.overflow = '';

        // Clean up after animation
        setTimeout(() => {
            const container = this.overlay.querySelector('.image-zoom-container');
            container.innerHTML = '';
        }, 300);
    }
}

// Initialize image zoom when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    new ImageZoom();
});