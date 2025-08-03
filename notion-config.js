// Notion API Configuration
// To set this up:
// 1. Go to https://www.notion.so/my-integrations
// 2. Create a new integration
// 3. Copy the "Internal Integration Token"
// 4. Share your blog database with the integration
// 5. Copy your database ID from the URL

const NOTION_CONFIG = {
    // Public API key for isolated workspace
    API_TOKEN: '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',
    
    // Database ID
    DATABASE_ID: '24479889bbb181e9a593000cbcd959b2',
    
    // API endpoint
    API_BASE: 'https://api.notion.com/v1'
};

// Export for use in blog.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NOTION_CONFIG;
} else {
    window.NOTION_CONFIG = NOTION_CONFIG;
}
