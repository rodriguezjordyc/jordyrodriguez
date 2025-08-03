// Enhanced Blog functionality with Substack RSS feed
document.addEventListener('DOMContentLoaded', function() {
    // Just show the blog index
    showBlogIndex();
});

// Cache for blog posts
let cachedBlogPosts = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Substack RSS feed URLs
const SUBSTACK_FEEDS = [
    {
        url: 'https://modernstewardship.substack.com/feed',
        name: 'Modern Stewardship'
    },
    {
        url: 'https://jordyrodriguez.substack.com/feed', 
        name: 'Personal Blog'
    }
];

// Fetch blog posts from multiple Substack RSS feeds
async function fetchSubstackPosts() {
    // Check if we have valid cached data
    if (cachedBlogPosts && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
        return cachedBlogPosts;
    }

    try {
        console.log('Fetching from multiple Substack RSS feeds...');
        
        const allPosts = [];
        const proxyUrl = 'https://api.allorigins.win/get?url=';
        
        // Fetch from all feeds
        for (const feed of SUBSTACK_FEEDS) {
            try {
                console.log(`Fetching ${feed.name}...`);
                
                const response = await fetch(proxyUrl + encodeURIComponent(feed.url));
                
                if (!response.ok) {
                    console.warn(`Failed to fetch ${feed.name}: ${response.status}`);
                    continue;
                }

                const data = await response.json();
                const rssText = data.contents;
                
                if (!rssText) {
                    console.warn(`No content received from ${feed.name}`);
                    continue;
                }
                
                // Parse RSS XML
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(rssText, 'text/xml');
                
                // Check for parsing errors
                if (xmlDoc.querySelector('parsererror')) {
                    console.error(`XML parsing error for ${feed.name}:`, xmlDoc.querySelector('parsererror').textContent);
                    continue;
                }
                
                const items = xmlDoc.querySelectorAll('item');
                console.log(`Found ${items.length} posts from ${feed.name}`);
                
                items.forEach((item, index) => {
                    const title = item.querySelector('title')?.textContent || 'Untitled';
                    const link = item.querySelector('link')?.textContent || '';
                    const pubDate = item.querySelector('pubDate')?.textContent || '';
                    
                    console.log(`${feed.name} - Post ${index + 1}:`, title);
                    
                    // Create a unique slug that includes the feed name to avoid conflicts
                    const baseSlug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
                    const feedSlug = feed.name.toLowerCase().replace(/\s+/g, '-');
                    const slug = `${feedSlug}-${baseSlug}`;
                    
                    allPosts.push({
                        slug: slug,
                        title: title,
                        excerpt: `Published ${new Date(pubDate).toLocaleDateString()}`,
                        original_link: link,
                        publication_date: pubDate,
                        feed_name: feed.name,
                        sort_date: new Date(pubDate)
                    });
                });
                
            } catch (feedError) {
                console.error(`Error fetching ${feed.name}:`, feedError);
                continue;
            }
        }
        
        // Sort all posts by publication date (most recent first)
        allPosts.sort((a, b) => b.sort_date - a.sort_date);
        
        // Convert to object format for compatibility
        const posts = {};
        allPosts.forEach(post => {
            posts[post.slug] = {
                title: post.title,
                excerpt: post.excerpt,
                original_link: post.original_link,
                publication_date: post.publication_date,
                feed_name: post.feed_name
            };
        });

        console.log('Total processed posts:', Object.keys(posts).length);
        console.log('Posts by date:', allPosts.map(p => `${p.title} (${p.feed_name})`));

        // Cache the results
        cachedBlogPosts = posts;
        cacheTimestamp = Date.now();
        
        return posts;
    } catch (error) {
        console.error('Error fetching Substack posts:', error);
        return {};
    }
}

// Clean and format Substack content
function cleanSubstackContent(htmlContent) {
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Remove unwanted elements
    const elementsToRemove = tempDiv.querySelectorAll('table, script, style, .email-share, .subscription-widget, .captioned-image-container, .tweet-header, .button-wrapper');
    elementsToRemove.forEach(el => el.remove());
    
    // Convert Substack-specific elements to clean HTML
    let cleanedHtml = '';
    
    // Process each child element
    const children = Array.from(tempDiv.children);
    for (const child of children) {
        const tagName = child.tagName.toLowerCase();
        const textContent = child.textContent.trim();
        
        // Skip empty elements
        if (!textContent) continue;
        
        // Convert different elements to clean HTML
        switch (tagName) {
            case 'h1':
                cleanedHtml += `<h1>${textContent}</h1>`;
                break;
            case 'h2':
                cleanedHtml += `<h2>${textContent}</h2>`;
                break;
            case 'h3':
                cleanedHtml += `<h3>${textContent}</h3>`;
                break;
            case 'p':
                // Handle paragraphs with potential formatting
                const innerHTML = cleanInlineFormatting(child.innerHTML);
                if (innerHTML.trim()) {
                    cleanedHtml += `<p>${innerHTML}</p>`;
                }
                break;
            case 'blockquote':
                // Handle blockquotes
                const quoteContent = child.textContent.trim();
                if (quoteContent) {
                    cleanedHtml += `<blockquote><p>${quoteContent}</p></blockquote>`;
                }
                break;
            case 'ol':
                // Handle ordered lists
                const listItems = Array.from(child.querySelectorAll('li'));
                if (listItems.length > 0) {
                    cleanedHtml += '<ol>';
                    listItems.forEach(li => {
                        const liContent = li.textContent.trim();
                        if (liContent) {
                            cleanedHtml += `<li>${liContent}</li>`;
                        }
                    });
                    cleanedHtml += '</ol>';
                }
                break;
            case 'ul':
                // Handle unordered lists
                const ulItems = Array.from(child.querySelectorAll('li'));
                if (ulItems.length > 0) {
                    cleanedHtml += '<ul>';
                    ulItems.forEach(li => {
                        const liContent = li.textContent.trim();
                        if (liContent) {
                            cleanedHtml += `<li>${liContent}</li>`;
                        }
                    });
                    cleanedHtml += '</ul>';
                }
                break;
            case 'div':
                // Handle divs that might contain paragraphs
                const divText = textContent;
                if (divText && !child.querySelector('table, script, .subscription')) {
                    cleanedHtml += `<p>${divText}</p>`;
                }
                break;
            default:
                // For other elements, just extract text if meaningful
                if (textContent.length > 20) { // Only include substantial text
                    cleanedHtml += `<p>${textContent}</p>`;
                }
                break;
        }
    }
    
    return cleanedHtml;
}

// Clean inline formatting while preserving basic formatting
function cleanInlineFormatting(html) {
    // Remove Substack-specific classes and attributes but keep basic formatting
    let cleaned = html;
    
    // Remove specific Substack classes and attributes
    cleaned = cleaned.replace(/class="[^"]*"/gi, '');
    cleaned = cleaned.replace(/data-[^=]*="[^"]*"/gi, '');
    cleaned = cleaned.replace(/style="[^"]*"/gi, '');
    
    // Keep basic formatting tags
    cleaned = cleaned.replace(/<span[^>]*>/gi, '');
    cleaned = cleaned.replace(/<\/span>/gi, '');
    cleaned = cleaned.replace(/<div[^>]*>/gi, '');
    cleaned = cleaned.replace(/<\/div>/gi, '');
    
    // Clean up multiple spaces and empty tags
    cleaned = cleaned.replace(/\s+/g, ' ');
    cleaned = cleaned.replace(/<([^>]+)>\s*<\/\1>/gi, '');
    
    return cleaned.trim();
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
    const posts = await fetchSubstackPosts();
    
    if (Object.keys(posts).length === 0) {
        // Show fallback content with direct links to both Substacks
        blogIndexElement.innerHTML = `
            <div class="blog-index">
                <article class="blog-index-item">
                    <h2><a href="https://modernstewardship.substack.com/p/the-intimacy-tax" target="_blank">The Intimacy Tax</a></h2>
                    <p class="post-excerpt">Published August 1, 2025</p>
                </article>
                <article class="blog-index-item">
                    <h2><a href="https://modernstewardship.substack.com/p/about-modern-stewardship" target="_blank">About Modern Stewardship</a></h2>
                    <p class="post-excerpt">Published July 27, 2025</p>
                </article>
            </div>
            <div style="text-align: center; margin-top: 2rem; padding: 1rem; background: #f5f5f5; border-radius: 4px;">
                <p>Posts loading from <a href="https://modernstewardship.substack.com" target="_blank">Modern Stewardship</a> and <a href="https://jordyrodriguez.substack.com" target="_blank">Personal Blog</a></p>
            </div>
        `;
        return;
    }
    
    // Generate blog index HTML - just a clean table of contents
    let html = '<div class="blog-index">';
    
    for (const [slug, post] of Object.entries(posts)) {
        html += `
            <article class="blog-index-item">
                <h2><a href="${post.original_link}" target="_blank">${post.title}</a></h2>
                <p class="post-excerpt">${post.excerpt}</p>
            </article>
        `;
    }
    
    html += '</div>';
    blogIndexElement.innerHTML = html;
}

// No individual post functionality needed - everything links to Substack