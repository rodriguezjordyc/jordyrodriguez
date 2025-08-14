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

// Static blog data as fallback when API is unavailable
const staticBlogPosts = {
    'complexity-science-in-football': {
        id: '24f79889-bbb1-8167-9d57-d604b46d421d',
        title: 'Complexity Science in Football',
        status: 'Published',
        published_date: '2025-08-11',
        blog_type: 'Personal',
        url: 'https://www.notion.so/Complexity-Science-in-Football-24f79889bbb181679d57d604b46d421d',
        excerpt: 'From Personal • Aug 11, 2025'
    },
    'ai-literacy-divide': {
        id: '24f79889-bbb1-817f-ba30-d262bd791b8a',
        title: 'AI Literacy Divide',
        status: 'Published',
        published_date: '2025-08-11',
        blog_type: 'Modern Stewardship',
        url: 'https://www.notion.so/AI-Literacy-Divide-24f79889bbb1817fba30d262bd791b8a',
        excerpt: 'From Modern Stewardship • Aug 11, 2025'
    },
    'the-intimacy-tax': {
        id: '24f79889-bbb1-8100-9614-ceb93ab835ac',
        title: 'The Intimacy Tax',
        status: 'Published',
        published_date: '2025-07-31',
        blog_type: 'Modern Stewardship',
        url: 'https://www.notion.so/The-Intimacy-Tax-24f79889bbb181009614ceb93ab835ac',
        excerpt: 'From Modern Stewardship • Jul 31, 2025'
    },
    'about-modern-stewardship': {
        id: '24f79889-bbb1-8107-9358-cf2ec83be22d',
        title: 'About Modern Stewardship',
        status: 'Published',
        published_date: '2025-07-26',
        blog_type: 'Modern Stewardship',
        url: 'https://www.notion.so/About-Modern-Stewardship-24f79889bbb181079358cf2ec83be22d',
        excerpt: 'From Modern Stewardship • Jul 26, 2025'
    }
};

// Fetch blog posts from Notion API via CORS proxy
async function fetchNotionPosts() {
    // Check if we have valid cached data
    if (cachedBlogPosts && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
        return cachedBlogPosts;
    }

    try {
        console.log('Fetching posts from Notion API...');
        
        // Try multiple CORS proxy services in sequence
        const proxies = [
            'https://api.codetabs.com/v1/proxy?quest=',
            'https://thingproxy.freeboard.io/fetch/'
        ];
        
        for (let i = 0; i < proxies.length; i++) {
            try {
                const proxyUrl = proxies[i];
                const notionUrl = `https://api.notion.com/v1/databases/${DATABASE_ID}/query`;
                
                const response = await fetch(proxyUrl + notionUrl, {
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
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('Notion response received from proxy', i + 1);

                    const posts = {};
                    
                    if (data.results) {
                        data.results.forEach(page => {
                            const titleProperty = page.properties.Title;
                            const statusProperty = page.properties.Status;
                            const publishedProperty = page.properties.Published;
                            const blogProperty = page.properties.Blog;

                            const title = titleProperty?.title?.[0]?.plain_text || 'Untitled';
                            const status = statusProperty?.select?.name || '';
                            const publishedDate = publishedProperty?.date?.start || '';
                            const blogType = blogProperty?.select?.name || '';

                            if (status === 'Published' && (blogType === 'Personal' || blogType === 'Modern Stewardship')) {
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
                    cachedBlogPosts = posts;
                    cacheTimestamp = Date.now();
                    return posts;
                }
            } catch (proxyError) {
                console.warn(`Proxy ${i + 1} failed:`, proxyError);
                continue;
            }
        }
        
        // All proxies failed, use static fallback
        console.log('All API attempts failed, using static blog data');
        return staticBlogPosts;
        
    } catch (error) {
        console.error('Error fetching posts:', error);
        console.log('Using static blog data as fallback');
        return staticBlogPosts;
    }
}

// Fetch individual post content from Notion API via CORS proxy
async function fetchPostContent(pageId) {
    try {
        // Try multiple CORS proxy services for content fetching
        const proxies = [
            'https://api.codetabs.com/v1/proxy?quest=',
            'https://thingproxy.freeboard.io/fetch/'
        ];
        
        for (let i = 0; i < proxies.length; i++) {
            try {
                const proxyUrl = proxies[i];
                const notionUrl = `https://api.notion.com/v1/blocks/${pageId}/children`;
                
                const response = await fetch(proxyUrl + notionUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${NOTION_API_KEY}`,
                        'Notion-Version': '2022-06-28'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    return convertNotionBlocksToHTML(data.results || []);
                }
            } catch (proxyError) {
                console.warn(`Content proxy ${i + 1} failed:`, proxyError);
                continue;
            }
        }
        
        // All proxies failed, return a message to redirect to Notion
        console.log('Content fetching failed, redirecting to Notion');
        return '';
        
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
                <p>This post content couldn't be loaded due to browser restrictions. You can read the full post on Notion:</p>
                <p><a href="${post.url}" target="_blank" rel="noopener noreferrer">Read "${post.title}" on Notion →</a></p>
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