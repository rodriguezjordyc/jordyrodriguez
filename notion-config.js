// Notion API Configuration
// To set this up:
// 1. Go to https://www.notion.so/my-integrations
// 2. Create a new integration
// 3. Copy the "Internal Integration Token"
// 4. Share your blog database with the integration
// 5. Copy your database ID from the URL

const NOTION_CONFIG = {
    // This will be replaced by GitHub Actions during deployment
    API_TOKEN: 'YOUR_NOTION_API_TOKEN_HERE',
    
    // This will be replaced by GitHub Actions during deployment
    DATABASE_ID: 'YOUR_DATABASE_ID_HERE',
    
    // API endpoint
    API_BASE: 'https://api.notion.com/v1'
};

// Export for use in blog.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NOTION_CONFIG;
} else {
    window.NOTION_CONFIG = NOTION_CONFIG;
}