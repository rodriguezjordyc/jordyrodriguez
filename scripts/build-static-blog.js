#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const THOUGHTS_DIR = path.join(PUBLIC_DIR, 'thoughts');
const BLOG_CONTENT_PATH = path.join(PUBLIC_DIR, 'blog-content.json');

// Transform slug to clean URL (remove hyphens and spaces)
function createCleanUrl(slug) {
    return slug.replace(/[-\s]/g, '').toLowerCase();
}

// Generate individual article page
function generateArticlePage(post, cleanSlug) {
    const formattedDate = new Date(post.published_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${post.title} - jordy rodriguez</title>
    <meta name="description" content="${post.title} - Published ${formattedDate}">
    <link rel="icon" type="image/jpeg" href="../../pics/jr.jpg">
    <link rel="shortcut icon" type="image/jpeg" href="../../pics/jr.jpg">
    <link rel="apple-touch-icon" href="../../pics/jr.jpg">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Latin+Modern+Roman&display=swap">
    <link rel="stylesheet" href="../../style.css">
</head>
<body>
    <header>
        <div class="header-content">
            <div class="name"><a href="/">jordy rodriguez</a></div>
            <div class="menu-toggle">☰</div>
            <nav>
                <ul>
                    <a href="/about">about</a>
                    <a href="/thoughts">thoughts</a>
                </ul>
            </nav>
        </div>
    </header>
    <div class="menu-overlay"></div>

    <main>
        <section id="blog-post" class="blog-view">
            <div class="blog-nav">
                <a href="/thoughts/" class="back-link">← Back</a>
            </div>

            <article>
                <header class="post-header">
                    <h1>${post.title}</h1>
                    <time class="post-date">${formattedDate}</time>
                </header>

                <div class="post-content">
                    ${post.content}
                </div>
            </article>
        </section>
    </main>

    <footer>
        <div class="contact-links">
            <a href="https://x.com/jordyrodriguezc" class="contact-link" target="_blank" rel="noopener noreferrer">x</a>
            <a href="https://github.com/rodriguezjordyc" class="contact-link" target="_blank" rel="noopener noreferrer">github</a>
        </div>
    </footer>

    <script src="../../menu.js"></script>
    <script>
      window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
    </script>
    <script defer src="/_vercel/insights/script.js"></script>
</body>
</html>`;
}

// Generate thoughts index page
function generateThoughtsIndex(posts) {
    // Convert posts to array and sort by date (newest first)
    const postsArray = Object.entries(posts)
        .map(([slug, post]) => ({ ...post, slug, cleanSlug: createCleanUrl(slug) }))
        .sort((a, b) => new Date(b.published_date) - new Date(a.published_date));

    const postsHTML = postsArray.map(post => {
        const formattedDate = new Date(post.published_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        return `
            <article class="blog-index-item">
                <h2><a href="/thoughts/${post.cleanSlug}/">${post.title}</a></h2>
                <p class="post-excerpt">${formattedDate}</p>
            </article>
        `;
    }).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>thoughts - jordy rodriguez</title>
    <meta name="description" content="Thoughts and writings by jordy rodriguez">
    <link rel="icon" type="image/jpeg" href="pics/jr.jpg">
    <link rel="shortcut icon" type="image/jpeg" href="pics/jr.jpg">
    <link rel="apple-touch-icon" href="pics/jr.jpg">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Latin+Modern+Roman&display=swap">
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <div class="header-content">
            <div class="name"><a href="/">jordy rodriguez</a></div>
            <div class="menu-toggle">☰</div>
            <nav>
                <ul>
                    <a href="/about">about</a>
                    <a href="/thoughts">thoughts</a>
                </ul>
            </nav>
        </div>
    </header>
    <div class="menu-overlay"></div>

    <main>
        <section id="blog-index" class="blog-view">
            <div class="blog-index">
                ${postsHTML}
            </div>
        </section>
    </main>

    <footer>
        <div class="contact-links">
            <a href="https://x.com/jordyrodriguezc" class="contact-link" target="_blank" rel="noopener noreferrer">x</a>
            <a href="https://github.com/rodriguezjordyc" class="contact-link" target="_blank" rel="noopener noreferrer">github</a>
        </div>
    </footer>

    <script src="menu.js"></script>
    <script>
      window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
    </script>
    <script defer src="/_vercel/insights/script.js"></script>
</body>
</html>`;
}

// Main build function
async function buildStaticBlog() {
    try {
        console.log('Building static blog...');

        // Read blog content
        if (!fs.existsSync(BLOG_CONTENT_PATH)) {
            throw new Error('Blog content file not found. Run fetch-blog-content.js first.');
        }

        const blogData = JSON.parse(fs.readFileSync(BLOG_CONTENT_PATH, 'utf8'));
        const posts = blogData.posts;

        // Create thoughts directory
        if (!fs.existsSync(THOUGHTS_DIR)) {
            fs.mkdirSync(THOUGHTS_DIR, { recursive: true });
        }

        // Clean existing article directories (but preserve index.html)
        const existingDirs = fs.readdirSync(THOUGHTS_DIR).filter(item => {
            const itemPath = path.join(THOUGHTS_DIR, item);
            return fs.statSync(itemPath).isDirectory();
        });

        existingDirs.forEach(dir => {
            fs.rmSync(path.join(THOUGHTS_DIR, dir), { recursive: true, force: true });
        });

        // Generate individual article pages
        for (const [slug, post] of Object.entries(posts)) {
            const cleanSlug = createCleanUrl(slug);
            const articleDir = path.join(THOUGHTS_DIR, cleanSlug);

            // Create article directory
            if (!fs.existsSync(articleDir)) {
                fs.mkdirSync(articleDir, { recursive: true });
            }

            // Generate article HTML
            const articleHTML = generateArticlePage(post, cleanSlug);
            const articlePath = path.join(articleDir, 'index.html');

            fs.writeFileSync(articlePath, articleHTML);
            console.log(`Generated: /thoughts/${cleanSlug}/`);
        }

        // Generate thoughts index page
        const indexHTML = generateThoughtsIndex(posts);
        const indexPath = path.join(THOUGHTS_DIR, 'index.html');
        fs.writeFileSync(indexPath, indexHTML);
        console.log('Generated: /thoughts/');

        console.log(`\nStatic blog build complete!`);
        console.log(`Generated ${Object.keys(posts).length} article pages + index`);

        // Show URL mappings
        console.log('\nURL Mappings:');
        Object.keys(posts).forEach(slug => {
            const cleanSlug = createCleanUrl(slug);
            console.log(`  ${slug} → /thoughts/${cleanSlug}/`);
        });

    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

// Run if this script is executed directly
if (require.main === module) {
    buildStaticBlog();
}

module.exports = { buildStaticBlog };