// Blog Integration using pre-fetched content
document.addEventListener('DOMContentLoaded', function() {
    showBlogIndex();
});

// Cache for blog posts
let cachedBlogPosts = null;


// Load blog posts from local JSON file
async function fetchBlogPosts() {
    // Return cached data if available
    if (cachedBlogPosts) {
        return cachedBlogPosts;
    }

    try {
        console.log('Loading blog posts from local file...');
        
        const response = await fetch('blog-content.json');
        
        if (!response.ok) {
            throw new Error(`Failed to load blog content: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`Loaded ${Object.keys(data.posts).length} posts from local file`);
        console.log(`Last updated: ${data.lastUpdated}`);
        
        // Cache the posts
        cachedBlogPosts = data.posts;
        
        return data.posts;
        
    } catch (error) {
        console.error('Error loading blog posts:', error);
        return {};
    }
}

// Get post content from cached data (already fetched)
function getPostContent(posts, slug) {
    const post = posts[slug];
    return post ? post.content || '' : '';
}


// Load and display blog index
async function showBlogIndex() {
    const blogIndexElement = document.getElementById('blog-index');
    const blogPostElement = document.getElementById('blog-post');
    
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
                <h2><a href="#${slug}" onclick="showBlogPost('${slug}')">${post.title}</a></h2>
                <p class="post-excerpt">${post.blog_type} • Published ${formattedDate}</p>
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
    
    if (content) {
        const formattedDate = new Date(post.published_date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        postContentElement.innerHTML = `
            <div class="post-header">
                <h1>${post.title}</h1>
                <p class="post-meta">${post.blog_type} • Published ${formattedDate}</p>
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
                <p><a href="#" onclick="showBlogIndex()">← Back to Blog</a></p>
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