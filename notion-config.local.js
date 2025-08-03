// Local configuration file - DO NOT COMMIT TO GIT
// Add this file to .gitignore

const NOTION_CONFIG = {
    API_TOKEN: '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',
    DATABASE_ID: '2439f51e6d25805e93eef5df36b19e2b',
    API_BASE: 'https://api.notion.com/v1'
};

// Export for use in blog.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NOTION_CONFIG;
} else {
    window.NOTION_CONFIG = NOTION_CONFIG;
}