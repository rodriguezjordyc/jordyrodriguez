// Notion API Integration for Blog
document.addEventListener('DOMContentLoaded', function() {
    showBlogIndex();
});

// Cache for blog posts
let cachedBlogPosts = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Notion API configuration
const NOTION_API_KEY = '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';
const DATABASE_ID = '24f79889bbb181c1a483dc5ddca87241';

// Fetch blog posts from Notion API via CORS proxy
async function fetchNotionPosts() {
    // Check if we have valid cached data
    if (cachedBlogPosts && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
        return cachedBlogPosts;
    }

    try {
        console.log('Fetching posts from Notion API...');
        
        // Using a CORS proxy to bypass browser restrictions
        const proxyUrl = 'https://api.allorigins.win/raw?url=';
        const notionUrl = `https://api.notion.com/v1/databases/${DATABASE_ID}/query`;
        
        const response = await fetch(proxyUrl + encodeURIComponent(notionUrl), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${NOTION_API_KEY}`,
                    'Notion-Version': '2022-06-28',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    filter: {
                        property: 'Status',
                        select: {
                            equals: 'Published'
                        }
                    },
                    sorts: [
                        {
                            property: 'Published',
                            direction: 'descending'
                        }
                    ]
                })
            })
        });

        if (!response.ok) {
            console.error('Failed to fetch from Notion:', response.status, response.statusText);
            return {};
        }

        const data = await response.json();
        console.log('Notion response received');

        const posts = {};
        
        if (data.results) {
            data.results.forEach(page => {
                // Extract properties
                const titleProperty = page.properties.Title;
                const statusProperty = page.properties.Status;
                const publishedProperty = page.properties.Published;
                const blogProperty = page.properties.Blog;

                // Get title
                const title = titleProperty?.title?.[0]?.plain_text || 'Untitled';
                
                // Get status
                const status = statusProperty?.select?.name || '';
                
                // Get published date
                const publishedDate = publishedProperty?.date?.start || '';
                
                // Get blog type
                const blogType = blogProperty?.select?.name || '';

                // Only include published posts from both blogs
                if (status === 'Published' && (blogType === 'Personal' || blogType === 'Modern Stewardship')) {
                    // Create slug from title
                    const slug = title.toLowerCase()
                        .replace(/\s+/g, '-')
                        .replace(/[^\w-]/g, '');

                    posts[slug] = {
                        id: page.id,
                        title: title,
                        status: status,
                        published_date: publishedDate,
                        blog_type: blogType,
                        url: page.url,
                        excerpt: `From ${blogType} • ${new Date(publishedDate).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                        })}`
                    };
                }
            });
        }

        console.log('Total processed posts:', Object.keys(posts).length);

        // Cache the results
        cachedBlogPosts = posts;
        cacheTimestamp = Date.now();
        
        return posts;
    } catch (error) {
        console.error('Error fetching posts:', error);
        return {};
    }
}

// Fetch individual post content from Notion API via CORS proxy
async function fetchPostContent(pageId) {
    try {
        const proxyUrl = 'https://api.allorigins.win/raw?url=';
        const notionUrl = `https://api.notion.com/v1/blocks/${pageId}/children`;
        
        const response = await fetch(proxyUrl + encodeURIComponent(notionUrl), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${NOTION_API_KEY}`,
                    'Notion-Version': '2022-06-28'
                }
            })
        });

        if (!response.ok) {
            console.error('Failed to fetch post content:', response.status);
            return '';
        }

        const data = await response.json();
        return convertNotionBlocksToHTML(data.results || []);
    } catch (error) {
        console.error('Error fetching post content:', error);
        return '';
    }
}

// Convert Notion blocks to HTML
function convertNotionBlocksToHTML(blocks) {
    let html = '';
    
    blocks.forEach(block => {
        switch (block.type) {
            case 'paragraph':
                const paragraphText = extractTextFromRichText(block.paragraph.rich_text);
                if (paragraphText.trim()) {
                    html += `<p>${paragraphText}</p>`;
                }
                break;
            
            case 'heading_1':
                const h1Text = extractTextFromRichText(block.heading_1.rich_text);
                html += `<h1>${h1Text}</h1>`;
                break;
            
            case 'heading_2':
                const h2Text = extractTextFromRichText(block.heading_2.rich_text);
                html += `<h2>${h2Text}</h2>`;
                break;
            
            case 'heading_3':
                const h3Text = extractTextFromRichText(block.heading_3.rich_text);
                html += `<h3>${h3Text}</h3>`;
                break;
            
            case 'bulleted_list_item':
                const bulletText = extractTextFromRichText(block.bulleted_list_item.rich_text);
                html += `<li>${bulletText}</li>`;
                break;
            
            case 'numbered_list_item':
                const numberText = extractTextFromRichText(block.numbered_list_item.rich_text);
                html += `<li>${numberText}</li>`;
                break;
            
            case 'quote':
                const quoteText = extractTextFromRichText(block.quote.rich_text);
                html += `<blockquote><p>${quoteText}</p></blockquote>`;
                break;
            
            case 'divider':
                html += '<hr>';
                break;
        }
    });

    // Wrap consecutive list items in appropriate list tags
    html = html.replace(/(<li>.*?<\/li>)+/g, (match) => {
        return `<ul>${match}</ul>`;
    });

    return html;
}

// Extract text from Notion rich text objects
function extractTextFromRichText(richTextArray) {
    if (!richTextArray || !Array.isArray(richTextArray)) {
        return '';
    }
    
    return richTextArray.map(textObj => {
        let text = textObj.plain_text || '';
        
        // Apply formatting
        if (textObj.annotations) {
            if (textObj.annotations.bold) {
                text = `<strong>${text}</strong>`;
            }
            if (textObj.annotations.italic) {
                text = `<em>${text}</em>`;
            }
            if (textObj.annotations.code) {
                text = `<code>${text}</code>`;
            }
        }
        
        // Handle links
        if (textObj.href) {
            text = `<a href="${textObj.href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
        }
        
        return text;
    }).join('');
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
    const posts = cachedBlogPosts || await fetchNotionPosts();
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
    
    // Fetch and display post content
    const content = await fetchPostContent(post.id);
    
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
                <h2>Unable to load post content</h2>
                <p>There was an error loading this post. Please try again later.</p>
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