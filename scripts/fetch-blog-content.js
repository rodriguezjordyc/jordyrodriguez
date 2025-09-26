#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// For Node.js environments that don't have fetch built-in
if (typeof fetch === 'undefined') {
    global.fetch = require('https').get;
    // Simplified fetch polyfill for Node.js
    global.fetch = async (url, options = {}) => {
        const https = require('https');
        const urlParsed = new URL(url);
        
        return new Promise((resolve, reject) => {
            const req = https.request({
                hostname: urlParsed.hostname,
                port: urlParsed.port || 443,
                path: urlParsed.pathname + urlParsed.search,
                method: options.method || 'GET',
                headers: options.headers || {}
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({
                        ok: res.statusCode >= 200 && res.statusCode < 300,
                        status: res.statusCode,
                        statusText: res.statusMessage,
                        json: () => Promise.resolve(JSON.parse(data)),
                        text: () => Promise.resolve(data)
                    });
                });
            });
            
            req.on('error', reject);
            
            if (options.body) {
                req.write(options.body);
            }
            
            req.end();
        });
    };
}

// Notion API configuration
const NOTION_API_KEY = process.env.NOTION_API_KEY || 'your-api-key-here';
const DATABASE_ID = '24f79889bbb181c1a483dc5ddca87241';

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

// Helper function to wrap consecutive list items in ul tags
function wrapListItems(html) {
    // Use a more robust regex approach to wrap consecutive <li> elements
    // This handles nested HTML content properly

    // Pattern: Find sequences of <li>...content...</li> tags that are consecutive
    let result = html.replace(/(<li>[\s\S]*?<\/li>)(\s*)(<li>[\s\S]*?<\/li>)/g, (match, li1, spacing, li2) => {
        // If we find consecutive list items, start building a list
        return li1 + spacing + li2;
    });

    // Now wrap all consecutive <li> groups in <ul> tags
    // This pattern matches one or more <li> elements that are consecutive (with possible whitespace)
    result = result.replace(/(<li>[\s\S]*?<\/li>(\s*<li>[\s\S]*?<\/li>)*)/g, (match) => {
        return `<ul>${match}</ul>`;
    });

    return result;
}

// Convert Notion blocks to HTML
async function convertNotionBlocksToHTML(blocks) {
    let html = '';
    
    for (const block of blocks) {
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
                let listItem = bulletText;
                
                // Check if this block has children (nested items)
                if (block.has_children) {
                    const children = await fetchChildrenBlocks(block.id);
                    if (children.length > 0) {
                        const nestedContent = await convertNotionBlocksToHTML(children);
                        listItem += nestedContent;
                    }
                }
                
                html += `<li>${listItem}</li>`;
                break;
            
            case 'numbered_list_item':
                const numberText = extractTextFromRichText(block.numbered_list_item.rich_text);
                let numberedItem = numberText;
                
                // Check if this block has children (nested items)
                if (block.has_children) {
                    const children = await fetchChildrenBlocks(block.id);
                    if (children.length > 0) {
                        const nestedContent = await convertNotionBlocksToHTML(children);
                        numberedItem += nestedContent;
                    }
                }
                
                html += `<li>${numberedItem}</li>`;
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
                                const isFirstRow = i === 0;
                                const isHeaderRow = hasColumnHeader && isFirstRow;

                                // Determine if we need thead/tbody structure
                                const rowTag = isHeaderRow ? 'thead' : (i === 1 && hasColumnHeader ? 'tbody' : '');

                                if (rowTag) html += `<${rowTag}>`;
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
                                if (rowTag === 'thead') html += '</thead>';
                                if (i === tableRows.length - 1 && i > 0 && hasColumnHeader) html += '</tbody>';
                            }
                        }

                        html += '</table>';
                    }
                }
                break;
        }
    }

    // Wrap consecutive list items in appropriate list tags
    // This handles nested lists properly by processing from the inside out
    html = wrapListItems(html);

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