require('dotenv').config();
const { scrapeMultipleCategories, CATEGORIES, SUPERMARKETS } = require('./scrapeCategories.js');

/**
 * Daily scraper - runs a balanced scrape suitable for daily updates
 *
 * This scrapes a focused set of common products across all supermarkets
 * to keep prices up to date without overwhelming the system.
 */
async function dailyScrape() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║          BASKET SAVER - DAILY PRICE UPDATE                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`Started: ${new Date().toLocaleString()}`);
  console.log('');

  // Focus on most commonly purchased categories for daily updates
  const dailyCategories = [
    'Dairy & Eggs',
    'Bread & Bakery',
    'Fruit & Veg',
    'Meat & Fish',
    'Drinks',
    'Cupboard Essentials'
  ];

  try {
    const stats = await scrapeMultipleCategories({
      supermarkets: SUPERMARKETS,
      categories: dailyCategories,
      maxProductsPerSearch: 15, // Limit to 15 products per search
      delayBetweenSearches: 3000 // 3 second delay between searches
    });

    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                    DAILY SCRAPE COMPLETE                   ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`Completed: ${new Date().toLocaleString()}`);
    console.log('');

    // Log to file for monitoring
    const fs = require('fs');
    const logEntry = {
      date: new Date().toISOString(),
      stats: stats,
      success: true
    };

    fs.appendFileSync(
      'scrape-daily-log.json',
      JSON.stringify(logEntry) + '\n'
    );

    console.log('✓ Results logged to scrape-daily-log.json');

    return stats;

  } catch (error) {
    console.error('ERROR: Daily scrape failed:', error);

    // Log error
    const fs = require('fs');
    const logEntry = {
      date: new Date().toISOString(),
      error: error.message,
      success: false
    };

    fs.appendFileSync(
      'scrape-daily-log.json',
      JSON.stringify(logEntry) + '\n'
    );

    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  dailyScrape()
    .then(() => {
      console.log('\n✓ Daily scrape completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n✗ Daily scrape failed:', error);
      process.exit(1);
    });
}

module.exports = { dailyScrape };
