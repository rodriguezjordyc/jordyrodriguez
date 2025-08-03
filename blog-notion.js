// Enhanced Blog functionality with Notion API integration
document.addEventListener('DOMContentLoaded', function() {
    // Initialize based on URL hash
    handleHashChange();
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
});

// Cache for blog posts
let cachedBlogPosts = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// No fallback data - testing API connectivity

// Fetch blog posts from Notion
async function fetchNotionPosts() {
    // Check if we have valid cached data
    if (cachedBlogPosts && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
        return cachedBlogPosts;
    }

    // Check if Notion is configured
    if (!window.NOTION_CONFIG || 
        !window.NOTION_CONFIG.API_TOKEN || 
        !window.NOTION_CONFIG.DATABASE_ID || 
        window.NOTION_CONFIG.API_TOKEN === 'YOUR_NOTION_API_TOKEN_HERE' || 
        window.NOTION_CONFIG.DATABASE_ID === 'YOUR_DATABASE_ID_HERE') {
        console.warn('Notion API not configured');
        return {};
    }

    try {
        // Set timeout for the request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(`${window.NOTION_CONFIG.API_BASE}/databases/${window.NOTION_CONFIG.DATABASE_ID}/query`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${window.NOTION_CONFIG.API_TOKEN}`,
                'Content-Type': 'application/json',
                'Notion-Version': '2022-06-28'
            },
            body: JSON.stringify({
                sorts: [
                    {
                        property: 'Publication Date',
                        direction: 'descending'
                    }
                ]
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Notion API error: ${response.status}`);
        }

        const data = await response.json();
        const posts = {};

        // Process each post
        for (const page of data.results) {
            const title = page.properties.Name?.title?.[0]?.plain_text || 'Untitled';
            const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
            
            // Extract publication date
            const publicationDate = page.properties['Publication Date']?.date?.start || page.created_time;
            
            posts[slug] = {
                title: title,
                excerpt: `Published ${new Date(publicationDate).toLocaleDateString()}`,
                content: '', // Will be loaded when needed
                notion_id: page.id,
                publication_date: publicationDate
            };
        }

        // Cache the results
        cachedBlogPosts = posts;
        cacheTimestamp = Date.now();
        
        return posts;
    } catch (error) {
        if (error.name === 'AbortError') {
            console.warn('Request timed out');
        } else if (error.message.includes('Failed to fetch')) {
            console.warn('CORS error detected - this is normal when running locally. Deploy to a web server to use Notion API.');
        } else {
            console.error('Error fetching posts:', error);
        }
        return {};
    }
}

// Fetch content for a specific post
async function fetchPostContent(notionId) {
    if (!window.NOTION_CONFIG || !window.NOTION_CONFIG.API_TOKEN) {
        return '<p>Notion API not configured</p>';
    }

    try {
        const response = await fetch(`${window.NOTION_CONFIG.API_BASE}/blocks/${notionId}/children`, {
            headers: {
                'Authorization': `Bearer ${window.NOTION_CONFIG.API_TOKEN}`,
                'Notion-Version': '2022-06-28'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch content: ${response.status}`);
        }

        const data = await response.json();
        return convertNotionToHTML(data.results);
    } catch (error) {
        console.error('Error fetching content:', error);
        return '<p>Error loading content. Please try again later.</p>';
    }
}

// Convert Notion blocks to HTML
function convertNotionToHTML(blocks) {
    let html = '';
    
    for (const block of blocks) {
        switch (block.type) {
            case 'paragraph':
                const paragraphText = block.paragraph.rich_text.map(t => formatRichText(t)).join('');
                if (paragraphText.trim()) {
                    html += `<p>${paragraphText}</p>`;
                }
                break;
                
            case 'heading_1':
                const h1Text = block.heading_1.rich_text.map(t => formatRichText(t)).join('');
                html += `<h1>${h1Text}</h1>`;
                break;
                
            case 'heading_2':
                const h2Text = block.heading_2.rich_text.map(t => formatRichText(t)).join('');
                html += `<h2>${h2Text}</h2>`;
                break;
                
            case 'heading_3':
                const h3Text = block.heading_3.rich_text.map(t => formatRichText(t)).join('');
                html += `<h3>${h3Text}</h3>`;
                break;
                
            case 'bulleted_list_item':
                const bulletText = block.bulleted_list_item.rich_text.map(t => formatRichText(t)).join('');
                html += `<ul><li>${bulletText}</li></ul>`;
                break;
                
            case 'numbered_list_item':
                const numberedText = block.numbered_list_item.rich_text.map(t => formatRichText(t)).join('');
                html += `<ol><li>${numberedText}</li></ol>`;
                break;
                
            case 'quote':
                const quoteText = block.quote.rich_text.map(t => formatRichText(t)).join('');
                html += `<blockquote><p>${quoteText}</p></blockquote>`;
                break;
                
            default:
                // Handle other block types as plain text
                if (block[block.type] && block[block.type].rich_text) {
                    const fallbackText = block[block.type].rich_text.map(t => formatRichText(t)).join('');
                    if (fallbackText.trim()) {
                        html += `<p>${fallbackText}</p>`;
                    }
                }
                break;
        }
    }
    
    return html;
}

// Format rich text with styling
function formatRichText(richText) {
    let text = richText.plain_text;
    
    if (richText.annotations.bold) {
        text = `<strong>${text}</strong>`;
    }
    if (richText.annotations.italic) {
        text = `<em>${text}</em>`;
    }
    if (richText.annotations.code) {
        text = `<code>${text}</code>`;
    }
    if (richText.href) {
        text = `<a href="${richText.href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    }
    
    return text;
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
    
    // Fetch posts
    const posts = await fetchNotionPosts();
    
    if (Object.keys(posts).length === 0) {
        blogIndexElement.innerHTML = `
            <div class="error-message">
                <p>No posts available. Please check your Notion configuration or try again later.</p>
                <p><a href="#" onclick="location.reload()">Refresh page</a></p>
            </div>
        `;
        return;
    }
    
    // Generate blog index HTML
    let html = '<div class="blog-description">thoughts on technology and stewardship</div>';
    html += '<div class="blog-index">';
    
    for (const [slug, post] of Object.entries(posts)) {
        html += `
            <article class="blog-index-item">
                <h2><a href="#${slug}">${post.title}</a></h2>
                <p class="post-excerpt">${post.excerpt}</p>
            </article>
        `;
    }
    
    html += '</div>';
    blogIndexElement.innerHTML = html;
}

// Load and display a specific blog post
async function showBlogPost(slug) {
    const posts = await fetchNotionPosts();
    const post = posts[slug];
    
    if (!post) {
        document.getElementById('blog-index').style.display = 'none';
        document.getElementById('blog-post').innerHTML = `
            <div class="error-message">
                <p>Post not found.</p>
                <p><a href="#" onclick="showBlogIndex()">← Back to Blog</a></p>
            </div>
        `;
        document.getElementById('blog-post').style.display = 'block';
        return;
    }
    
    // Hide blog index, show post
    document.getElementById('blog-index').style.display = 'none';
    document.getElementById('blog-post').style.display = 'block';
    
    // Update page title
    document.title = 'jordy rodriguez';
    
    // Show loading state
    document.getElementById('blog-post').innerHTML = `
        <div class="blog-nav">
            <a href="#" class="back-link" onclick="showBlogIndex()">← Back to Blog</a>
        </div>
        <div class="loading">Loading post...</div>
    `;
    
    // Load post content if not already loaded
    if (!post.content) {
        post.content = await fetchPostContent(post.notion_id);
    }
    
    // Load post content
    document.getElementById('post-content').innerHTML = post.content;
    
    // Update the full post display
    document.getElementById('blog-post').innerHTML = `
        <div class="blog-nav">
            <a href="#" class="back-link" onclick="showBlogIndex()">← Back to Blog</a>
        </div>
        <article class="post-header">
            <h1>${post.title}</h1>
            <p class="post-meta">Published ${new Date(post.publication_date).toLocaleDateString()}</p>
        </article>
        <div class="post-content" id="post-content">${post.content}</div>
    `;
}

// Handle URL hash changes
function handleHashChange() {
    const hash = window.location.hash.substring(1); // Remove the #
    
    if (hash) {
        showBlogPost(hash);
    } else {
        showBlogIndex();
    }
}
