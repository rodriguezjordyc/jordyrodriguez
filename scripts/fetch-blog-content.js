#!/usr/bin/env node

const fs = require('fs');
const path = require('path'); // For creating file paths
const https = require('https'); // For downloading images

// Notion API configuration
const NOTION_API_KEY = process.env.NOTION_API_KEY || 'your-api-key-here';
const DATABASE_ID = '24f79889bbb181c1a483dc5ddca87241';
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');
const IMAGES_PUBLIC_PATH = '/public/images';

// Fetch blog posts from Notion API
async function fetchNotionPosts() {
    try {
        console.log('Fetching posts from Notion API...');
        
        const response = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
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

        if (!response.ok) {
            throw new Error(`Failed to fetch from Notion: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`Fetched ${data.results.length} posts from Notion`);

        const posts = {};
        
        if (data.results) {
            for (const page of data.results) {
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

                    console.log(`Processing post: ${title}`);
                    
                    // Fetch content for this post
                    const content = await fetchPostContent(page.id);

                    posts[slug] = {
                        id: page.id,
                        title: title,
                        status: status,
                        published_date: publishedDate,
                        blog_type: blogType,
                        url: page.url,
                        content: content,
                        excerpt: new Date(publishedDate).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                        })
                    };
                }
            }
        }

        console.log(`Total processed posts: ${Object.keys(posts).length}`);
        return posts;
        
    } catch (error) {
        console.error('Error fetching posts:', error);
        throw error;
    }
}

// Fetch individual post content from Notion API
async function fetchPostContent(pageId) {
    try {
        const response = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${NOTION_API_KEY}`,
                'Notion-Version': '2022-06-28'
            }
        });

        if (!response.ok) {
            console.error(`Failed to fetch content for ${pageId}: ${response.status}`);
            return '';
        }

        const data = await response.json();
        return await convertNotionBlocksToHTML(data.results || []);
    } catch (error) {
        console.error(`Error fetching content for ${pageId}:`, error);
        return '';
    }
}

// Fetch children blocks for nested content
async function fetchChildrenBlocks(blockId) {
    try {
        const response = await fetch(`https://api.notion.com/v1/blocks/${blockId}/children`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${NOTION_API_KEY}`,
                'Notion-Version': '2022-06-28'
            }
        });

        if (!response.ok) {
            return [];
        }

        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error(`Error fetching children for ${blockId}:`, error);
        return [];
    }
}

// Convert Notion blocks to HTML
async function convertNotionBlocksToHTML(blocks) {
    let html = '';
    
    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];

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
                // Start of a new bulleted list
                html += '<ul>';
                html += await processListItem(block);

                // Continue adding items to the same list
                while (i + 1 < blocks.length && blocks[i + 1].type === 'bulleted_list_item') {
                    i++;
                    html += await processListItem(blocks[i]);
                }
                html += '</ul>';
                break;
            
            case 'numbered_list_item':
                // Start of a new numbered list
                html += '<ol>';
                html += await processListItem(block);

                // Continue adding items to the same list
                while (i + 1 < blocks.length && blocks[i + 1].type === 'numbered_list_item') {
                    i++;
                    html += await processListItem(blocks[i]);
                }
                html += '</ol>';
                break;
            
            case 'quote':
                const quoteText = extractTextFromRichText(block.quote.rich_text);
                html += `<blockquote><p>${quoteText}</p></blockquote>`;
                break;

            case 'image':
                const imageBlock = block.image;
                let imageUrl = '';
                let altText = '';

                // Handle different image sources
                if (imageBlock.type === 'external') {
                    imageUrl = imageBlock.external.url;
                } else if (imageBlock.type === 'file') {
                    imageUrl = imageBlock.file.url;
                }

                // Download the image and get its local path
                if (imageUrl) {
                    imageUrl = await downloadAndSaveImage(imageUrl, block.id);
                }

                // Get alt text from caption
                if (imageBlock.caption && imageBlock.caption.length > 0) {
                    altText = extractTextFromRichText(imageBlock.caption);
                }
                
                if (imageUrl) {
                    html += `<img src="${imageUrl}" alt="${altText}" />`;
                }
                break;

            case 'divider':
                html += '<hr>';
                break;

            case 'table':
                if (block.has_children) {
                    const tableRows = await fetchChildrenBlocks(block.id);
                    if (tableRows.length > 0) {
                        // Get table configuration from Notion
                        const hasColumnHeader = block.table?.has_column_header || false;
                        const hasRowHeader = block.table?.has_row_header || false;

                        // Add data attributes to indicate header configuration
                        let tableAttributes = '';
                        if (hasColumnHeader) tableAttributes += ' data-has-column-header="true"';
                        if (hasRowHeader) tableAttributes += ' data-has-row-header="true"';

                        html += `<table${tableAttributes}>`;

                        // Process each table row
                        for (let i = 0; i < tableRows.length; i++) {
                            const row = tableRows[i];
                            if (row.type === 'table_row') {
                                const isHeaderRow = hasColumnHeader && i === 0;

                                // Open thead or tbody as needed
                                if (isHeaderRow) {
                                    html += '<thead>';
                                } else if (i === 0 || (hasColumnHeader && i === 1)) {
                                    // Open tbody for the first non-header row
                                    html += '<tbody>';
                                }

                                html += '<tr>';

                                // Process each cell in the row
                                if (row.table_row && row.table_row.cells) {
                                    for (let j = 0; j < row.table_row.cells.length; j++) {
                                        const cell = row.table_row.cells[j];
                                        const cellText = extractTextFromRichText(cell);

                                        // Determine cell type based on header configuration
                                        let cellTag = 'td';
                                        if (isHeaderRow) {
                                            cellTag = 'th'; // Column header
                                        } else if (hasRowHeader && j === 0) {
                                            cellTag = 'th'; // Row header (first column)
                                        }

                                        html += `<${cellTag}>${cellText}</${cellTag}>`;
                                    }
                                }

                                html += '</tr>';
                                
                                // Close thead or tbody at the right time
                                if (isHeaderRow) {
                                    html += '</thead>';
                                } else if (i === tableRows.length - 1) {
                                    html += '</tbody>';
                                }
                            }
                        }

                        html += '</table>';
                    }
                }
                break;
        }
    }

    return html;
}

// Helper to process a single list item (bulleted or numbered)
async function processListItem(block) {
    const itemType = block.type; // 'bulleted_list_item' or 'numbered_list_item'
    const richText = block[itemType].rich_text;
    
    let listItemContent = extractTextFromRichText(richText);

    // Handle nested lists
    if (block.has_children) {
        const children = await fetchChildrenBlocks(block.id);
        if (children.length > 0) {
            const nestedContent = await convertNotionBlocksToHTML(children);
            listItemContent += nestedContent;
        }
    }

    return `<li>${listItemContent}</li>`;
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

// Download and save an image locally
async function downloadAndSaveImage(url, blockId) {
    if (!fs.existsSync(IMAGES_DIR)) {
        fs.mkdirSync(IMAGES_DIR, { recursive: true });
    }

    const urlObject = new URL(url);
    const extension = path.extname(urlObject.pathname) || '.png'; // Default to .png if no extension
    const filename = `${blockId}${extension}`;
    const localPath = path.join(IMAGES_DIR, filename);
    const publicPath = path.join(IMAGES_PUBLIC_PATH, filename).replace(/\\/g, '/');

    // If image already exists, just return its path
    if (fs.existsSync(localPath)) {
        return publicPath;
    }

    console.log(`Downloading image: ${url}`);

    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                console.error(`Failed to download image ${url}. Status: ${response.statusCode}`);
                resolve(''); // Return empty string on failure to not break the build
                return;
            }
            const fileStream = fs.createWriteStream(localPath);
            response.pipe(fileStream);
            fileStream.on('finish', () => {
                fileStream.close();
                console.log(`Saved image to ${localPath}`);
                resolve(publicPath);
            });
        }).on('error', (err) => {
            console.error(`Error downloading image ${url}:`, err);
            resolve(''); // Return empty string on failure
        });
    });
}

// Main execution
async function main() {
    try {
        // Fetch all blog posts with content
        const posts = await fetchNotionPosts();
        
        // Save to JSON file
        const outputPath = path.join(__dirname, '..', 'blog-content.json');
        fs.writeFileSync(outputPath, JSON.stringify({
            posts: posts,
            lastUpdated: new Date().toISOString()
        }, null, 2));
        
        console.log(`Blog content saved to ${outputPath}`);
        console.log(`Updated at: ${new Date().toISOString()}`);
        
    } catch (error) {
        console.error('Failed to fetch and save blog content:', error);
        process.exit(1);
    }
}

// Run if this script is executed directly
if (require.main === module) {
    main();
}

module.exports = { fetchNotionPosts, fetchPostContent };