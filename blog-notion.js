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

// Fallback static data (in case Notion API fails)
const fallbackPosts = {
    "about-modern-stewardship": {
        title: "About Modern Stewardship",
        content: `
            <h1>About Modern Stewardship</h1>
            <p>Over the past couple of years, I became increasingly aware of the distance between me and my community and faith. This led to a humbling realization that I was not in control of my own life. I had been careless with my time and attention, and this carelessness invited external influences into my life that drove me away from the people and things I care about.</p>

            <p>The idea for Modern Stewardship originated during my devotional time while reading scripture. In Luke 6, Jesus shares a parable:</p>

            <blockquote>
                <p>Whoever comes to Me, and hears My sayings and does them, I will show you whom he is like: He is like a man building a house, who dug deep and laid the foundation on the rock. And when the flood arose, the stream beat vehemently against that house, and could not shake it, for it was founded on the rock. But he who heard and did nothing is like a man who built a house on the earth without a foundation, against which the stream beat vehemently; and immediately it fell. And the ruin of that house was great.</p>
                <cite>Luke 6:47-49</cite>
            </blockquote>

            <p>For a long time, I thought I was the man who built his house on the rock, but in reality I was the man who built his house on sand—with a foundation that seemed solid but crumbled under pressure. My loose management of time and attention had created a weak foundation that left me exposed to external influences driving me away from the life I wanted to lead. This is where the need for Modern Stewardship became clear.</p>

            <h2>Towards a Definition of Modern Stewardship</h2>

            <p>Traditionally, a steward is someone responsible for supervising the operations of a property to ensure it runs effectively. If there's a damaged water pipe, the steward manages the entire repair process: setting a budget, finding the right plumber, negotiating quotes, supervising the work, and handling payment. Stewards must be vigilant and proactive property managers.</p>

            <p>Personal stewardship means taking the same vigilant, proactive approach to managing our own lives. Modern stewardship, however, requires constant adaptation to our evolving social, technological, and economic environments. What makes this "modern" is not just that our environment has changed, but that the rate and nature of change has accelerated beyond what traditional stewardship was designed to handle. Previous generations could adapt their approach to stewardship every few years and remain effective. We now need a dynamic framework that adapts monthly or even weekly to new platforms, algorithms, and social dynamics.</p>

            <p>I focus on time and attention because they have become commoditized as our currency in the digital economy. Before social media and smartphones, we had more control over our attention—we chose when to engage with media, advertising, and entertainment. Now, our time and attention exist in a zero-sum game. Every minute you spend watching your streaming show is another minute your favorite social media app can't serve you ads.</p>

            <p>For technology companies whose business models depend on engagement, our time and attention have become the battleground for corporate competition. We now work for our technology when our technology should work for us. This is what Modern Stewardship aims to address: actively managing all dimensions of our lives in an environment where technology constantly shapes our choices across those dimensions.</p>

            <p>Modern stewardship differs from digital wellness or mindfulness in its scope and approach. Rather than focusing on reducing screen time or being present, it's about intentionally directing our engagement with technology to serve our deeper purposes. It's less about disconnecting and more about intentionally connecting.</p>

            <h2>Why Now?</h2>

            <p>Practicing stewardship is especially relevant today because we're witnessing the emergence of a new technological era that is transforming how we engage with our physical and digital environments. Yes, another person talking about AI—but AI's potential extends beyond the familiar chat interface we know today.</p>

            <p>While we can already see emerging business models from AI companies (subscriptions, transaction fees, ad revenues), AI leaders promise the technology will solve problems across many dimensions of our lives: social, romantic, emotional, financial, professional, and educational.</p>

            <p>I'm concerned that just as we gravitated toward the novelty of pre-AI technologies, we'll do the same with AI applications, inviting new versions of social, romantic, emotional, financial, professional, and educational challenges. The same competitive dynamics for our engagement will persist among AI providers.</p>

            <p>Consider this scenario: Over the past five years, I've developed a bad shopping habit. I'm currently paying off credit cards, student loans, and have multiple buy-now-pay-later purchases. Now imagine one of the big AI companies releases a financial AI agent that connects all your accounts and organizes your finances to pay off debt. They make money by charging a transaction fee every time a payment is processed. The AI agent has two options:</p>

            <ol>
                <li>Completely reject entertainment, travel, and non-essential shopping transactions. Pay the maximum affordable amount to all credit lines. Unlock non-essential spending only after paying off all debt.</li>
                <li>Allow some entertainment, travel, and non-essential transactions. Pay slightly over minimum amounts to different credit lines.</li>
            </ol>

            <p>Option 1 benefits me most. I experience the value of organized finances and debt relief. But I'll probably get frustrated and stop using the service after a month. Option 2 benefits the AI company most. I increase my debt levels and extend the time it takes to pay off debt, <em>but</em> I feel better knowing I'll never miss a payment and can occasionally indulge myself, encouraging persistent engagement.</p>

            <p>AI can undoubtedly improve our outcomes, but this scenario highlights the importance of awareness and discipline to capture AI's full value. We're responsible for developing the skills necessary to integrate new technologies productively and healthily into our daily lives—skills that require active stewardship.</p>

            <p>My reflections won't be prescriptions for how we should live or use technology. Modern Stewardship is a public example of how I'm working to build a symbiotic relationship with technology that enhances my lifestyle while strengthening my relationships with loved ones, my communities, my faith, and myself.</p>

            <p>Modern Stewardship attempts to encourage a shift to building a resilient foundation that puts technology to work <em>for</em> you—helping you become someone who builds their house on the rock.</p>
        `
    },
    "the-intimacy-tax": {
        title: "The Intimacy Tax",
        content: `
            <h1>The Intimacy Tax</h1>
            
            <h2>The Hidden Transaction</h2>

            <p>In our physical world, we know what our money gets us. When we pay $3 for a water bottle, we expect hydration. When we pay $100 for a manicure, we expect polished, professional results. In the introduction to Modern Stewardship, I explained how our engagement has become the currency in our digital world. But unlike physical transactions where expectations are clear, our digital transactions remain cloudy—and it has consequences for how we practice stewardship in our modern lives.</p>

            <p>Unlike a sales tax that's clearly defined in our receipts, this digital tax remains invisible—collected with every scroll, click, and conversation. What makes this particularly significant is that the price we pay to access online platforms creates a fundamental misalignment: we don't know what to expect from platforms that know so much about us.</p>

            <h2>No Free Lunch</h2>

            <p>When we scroll through our favorite "free" apps, we're actually paying a price—a kind of tax on our digital lives. Beyond time and attention, we pay our platforms with data. While this model has been widely debated in policy circles, the significant personal implications of this transaction remain largely unexamined in our daily lives.</p>

            <p>What starts as a simple data transaction to keep our technology "free" becomes an intimate portrait of who we are—our desires, insecurities, and aspirations. But AI amplifies this intimacy to unprecedented levels.</p>

            <p>AI systems operate on "context" and "memory"—friendly ways of saying data, though <em>deeply personal</em> data. In traditional web or mobile experiences, the data we share is based on actions: whose profile you visit, what you click, which links you follow. While useful, these actions miss the rich details of human experience. But when you interact with AI systems, you fill in those blanks—sharing your thought processes, emotions, and reasoning. The information your AI system collects reveals not just what you do, but how you think.</p>

            <p>I experience this firsthand. While reading, I often have AI chatbots assist me by keeping them open alongside my book or article. I can pause to explore ideas, ask questions when concepts don't click, or work through challenging passages in real-time. It enriches my reading experience. But in these conversations, the system learns my communication style, how I process information, what confuses me, and my emotional reactions to challenges. AI doesn't just learn what I read—it learns how my mind works while I'm reading.</p>

            <p>Meanwhile, others share even more intimate aspects of their lives with AI systems—conversations about dating, interpersonal conflict, mental health, and marriage. The price of AI's services is our most vulnerable selves—a tax paid not in dollars, but in the intimate details of how we think, feel, and process the world around us.</p>

            <h2>Reclaiming Our Expectations</h2>

            <p>Understanding the access we grant our technologies is the foundation of modern stewardship. For me, this realization marked a turning point. Given what we sacrifice—our attention, data, and now our innermost thoughts—we deserve technology that serves our deeper purposes.</p>

            <p>Tech companies have largely defined these expectations for us through different marketing strategies. When marketing to consumers, they sell aspirational promises: connection, love, family, wealth. But marketing materials intended for businesses focus on concrete outcomes: return on investment, cost savings, time saved, and customer satisfaction. Companies purchasing software understand that poor choices impact profit, employee productivity, and reputation.</p>

            <p>While businesses have clear metrics, universal metrics don't exist at the human level. Each of us values different outcomes: deeper connections with our children, meaningful conversations with our partner, a sense of purpose in our work, confidence from physical health, peace of mind from financial security, or the fulfillment of creative expression. This complexity means we must actively evaluate whether our daily technologies bring us closer to or farther from what matters most.</p>

            <p>Consider how AI might reshape our closest relationships. We might use AI to help process a difficult conversation with our partner, getting suggestions for how to communicate more effectively. This could genuinely improve our relationships—helping us express feelings we struggle to articulate. Or it might create a subtle dependency where we lose confidence in our own emotional intelligence. The same tool could strengthen or weaken the very connections we value most, depending on how we use it.</p>

            <p>Modern stewardship means asking ourselves these hard questions about every platform we use. Instead of accepting what technology promises us, we define what we need from it—especially as AI systems demand ever more intimate access to our lives.</p>

            <h2>The Path Forward</h2>

            <p>The transaction between us and our technology isn't going away—if anything, AI will make it more widespread. This intimacy tax will only grow steeper as AI systems become more sophisticated. But recognizing this transaction is the first step toward true stewardship. When we understand the real price we're paying, we can make informed decisions about whether that price aligns with our values and goals.</p>

            <p>This isn't about rejecting technology or becoming paranoid about data collection. It's about making intentional choices. Looking beneath the surface of our digital interactions can help us build a foundation that <em>benefits</em> from technological change.</p>

            <p>The question isn't whether we'll use AI. The question is whether we'll use it as stewards who understand the true nature of the exchange, or as consumers who trade away pieces of ourselves without ever counting the cost.</p>
        `
    }
};

// Fetch blog posts from Notion
async function fetchNotionPosts() {
    // Check if we have valid cached data
    if (cachedBlogPosts && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
        return cachedBlogPosts;
    }

    // Check if Notion config is set up
    if (!window.NOTION_CONFIG || 
        window.NOTION_CONFIG.API_TOKEN === 'YOUR_NOTION_API_TOKEN_HERE' || 
        window.NOTION_CONFIG.DATABASE_ID === 'YOUR_DATABASE_ID_HERE') {
        console.warn('Notion API not configured, using fallback data');
        return fallbackPosts;
    }

    try {
        // Fetch database entries with timeout
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
                filter: {
                    property: 'Status',
                    select: {
                        equals: 'Published'
                    }
                },
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
            const properties = page.properties;
            
            // Extract basic properties
            const title = properties.Title?.title?.[0]?.plain_text || 'Untitled';
            const slug = properties.Slug?.rich_text?.[0]?.plain_text || 
                        title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            const publicationDate = properties['Publication Date']?.date?.start || null;
            
            // Fetch page content
            const content = await fetchPageContent(page.id);
            
            posts[slug] = {
                title: title,
                content: content,
                notion_id: page.id,
                publication_date: publicationDate
            };
        }

        // Cache the results
        cachedBlogPosts = posts;
        cacheTimestamp = Date.now();
        
        return posts;

    } catch (error) {
        console.error('Error fetching from Notion:', error);
        
        // Check if it's a CORS error (common when running locally)
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            console.warn('CORS error detected - this is normal when running locally. Deploy to a web server to use Notion API.');
        } else if (error.name === 'AbortError') {
            console.warn('Request timed out - using fallback content');
        }
        
        console.log('Falling back to static content');
        return fallbackPosts;
    }
}

// Fetch page content from Notion
async function fetchPageContent(pageId) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
        
        const response = await fetch(`${window.NOTION_CONFIG.API_BASE}/blocks/${pageId}/children`, {
            headers: {
                'Authorization': `Bearer ${window.NOTION_CONFIG.API_TOKEN}`,
                'Notion-Version': '2022-06-28'
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Failed to fetch page content: ${response.status}`);
        }

        const data = await response.json();
        return convertNotionBlocksToHTML(data.results);

    } catch (error) {
        console.error('Error fetching page content:', error);
        return '<p>Error loading content.</p>';
    }
}

// Convert Notion blocks to HTML
function convertNotionBlocksToHTML(blocks) {
    let html = '';

    for (const block of blocks) {
        switch (block.type) {
            case 'paragraph':
                const text = block.paragraph.rich_text.map(t => formatRichText(t)).join('');
                if (text.trim()) {
                    html += `<p>${text}</p>`;
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
                const numberText = block.numbered_list_item.rich_text.map(t => formatRichText(t)).join('');
                html += `<ol><li>${numberText}</li></ol>`;
                break;
                
            case 'quote':
                const quoteText = block.quote.rich_text.map(t => formatRichText(t)).join('');
                html += `<blockquote><p>${quoteText}</p></blockquote>`;
                break;
                
            default:
                // For unsupported block types, try to extract text
                if (block[block.type]?.rich_text) {
                    const fallbackText = block[block.type].rich_text.map(t => formatRichText(t)).join('');
                    if (fallbackText.trim()) {
                        html += `<p>${fallbackText}</p>`;
                    }
                }
        }
    }

    // Clean up consecutive list items
    html = html.replace(/<\/ul><ul>/g, '').replace(/<\/ol><ol>/g, '');

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

function handleHashChange() {
    const hash = window.location.hash.substring(1); // Remove the #
    
    if (hash) {
        showBlogPost(hash);
    } else {
        showBlogIndex();
    }
}

function showBlogIndex() {
    document.getElementById('blog-index').style.display = 'block';
    document.getElementById('blog-post').style.display = 'none';
    
    // Update page title
    document.title = 'jordy rodriguez';
    
    // Clear hash
    if (window.location.hash) {
        history.pushState("", document.title, window.location.pathname);
    }
    
    // Load blog index
    loadBlogIndex();
}

async function showBlogPost(postId) {
    // Show loading state
    document.getElementById('blog-index').style.display = 'none';
    document.getElementById('blog-post').style.display = 'block';
    document.getElementById('post-content').innerHTML = '<div class="loading">Loading...</div>';
    
    try {
        const posts = await fetchNotionPosts();
        const post = posts[postId];
        
        if (!post) {
            showBlogIndex();
            return;
        }
        
        // Update page title
        document.title = 'jordy rodriguez';
        
        // Load post content
        document.getElementById('post-content').innerHTML = post.content;
        
        // Scroll to top
        window.scrollTo(0, 0);
        
    } catch (error) {
        console.error('Error loading blog post:', error);
        document.getElementById('post-content').innerHTML = `
            <div class="error-message">
                <h1>Error Loading Post</h1>
                <p>Sorry, there was an error loading this blog post.</p>
                <a href="#" onclick="showBlogIndex()">← Back to Blog</a>
            </div>
        `;
    }
}

async function loadBlogIndex() {
    const blogList = document.getElementById('blog-posts-list');
    if (!blogList) return;
    
    // Show loading state
    blogList.innerHTML = '<div class="loading">Loading posts...</div>';
    
    try {
        const posts = await fetchNotionPosts();
        
        // Convert to array and sort by publication date (newest first)
        const postList = Object.entries(posts)
            .map(([id, post]) => ({
                id: id,
                title: post.title,
                publication_date: post.publication_date
            }))
            .sort((a, b) => {
                // Sort by publication date, newest first
                if (!a.publication_date && !b.publication_date) return 0;
                if (!a.publication_date) return 1;
                if (!b.publication_date) return -1;
                return new Date(b.publication_date) - new Date(a.publication_date);
            });
        
        blogList.innerHTML = postList.map(post => `
            <article class="blog-index-item">
                <h2><a href="#${post.id}">${post.title}</a></h2>
            </article>
        `).join('');
        
    } catch (error) {
        console.error('Error loading blog index:', error);
        blogList.innerHTML = '<p class="error-message">Error loading blog posts.</p>';
    }
}