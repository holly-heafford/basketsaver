module.exports = {
  apps: [
    {
      name: 'asda-scraper',
      script: 'scrapeToSupabase.js',
      cron_restart: '0 2 * * *',  // Run daily at 2 AM
      autorestart: false,          // Don't auto-restart on completion
      watch: false,
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'tesco-scraper',
      script: 'scrapeTescoCategories.js',
      cron_restart: '0 3 * * *',  // Run daily at 3 AM
      autorestart: false,
      watch: false
    },
    {
      name: 'sainsburys-scraper',
      script: 'scrapeAsdaCategories.js',
      cron_restart: '0 4 * * *',  // Run daily at 4 AM
      autorestart: false,
      watch: false
    }
  ]
};
