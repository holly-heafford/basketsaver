require('dotenv').config();
const { scrapeSearchTermToSupabase } = require('./scrapeToSupabase.js');
const { refreshPopularItems } = require('./refresh-popular-items.js');

/**
 * Common grocery search terms to scrape across all supermarkets
 * Organized by category for better data organization
 */
const CATEGORIES = {
  'Dairy & Eggs': [
    'milk',
    'eggs',
    'butter',
    'cheese',
    'yogurt',
    'cream',
    'cheddar',
    'mozzarella',
    'parmesan',
    'brie',
    'halloumi',
    'feta'
  ],
  'Meat & Fish': [
    'chicken',
    'beef',
    'pork',
    'salmon',
    'bacon',
    'sausages',
    'mince',
    'steak',
    'lamb',
    'turkey',
    'ham',
    'cod',
    'tuna',
    'prawns',
    'fish',
    'meat'
  ],
  'Fruit & Veg': [
    'apples',
    'bananas',
    'tomatoes',
    'potatoes',
    'carrots',
    'lettuce',
    'onions',
    'peppers',
    'cucumbers',
    'broccoli',
    'mushrooms',
    'oranges',
    'grapes',
    'strawberries',
    'avocado',
    'spinach',
    'cabbage',
    'cauliflower'
  ],
  'Bread & Bakery': [
    'bread',
    'rolls',
    'croissants',
    'bagels',
    'baguette',
    'pitta',
    'wraps',
    'muffins',
    'crumpets',
    'teacakes'
  ],
  'Drinks': [
    'water',
    'orange juice',
    'coca cola',
    'milk',
    'tea',
    'coffee',
    'squash',
    'lemonade',
    'beer',
    'wine',
    'spirits',
    'apple juice',
    'fizzy drinks',
    'energy drinks'
  ],
  'Cupboard Essentials': [
    'pasta',
    'rice',
    'flour',
    'sugar',
    'oil',
    'salt',
    'cereal',
    'beans',
    'soup',
    'tinned tomatoes',
    'spaghetti',
    'noodles',
    'sauce',
    'ketchup',
    'mayonnaise',
    'jam',
    'peanut butter',
    'honey',
    'stock cubes',
    'herbs',
    'spices'
  ],
  'Snacks': [
    'crisps',
    'chocolate',
    'biscuits',
    'nuts',
    'sweets',
    'popcorn',
    'crackers',
    'cereal bars',
    'cake',
    'cookies'
  ],
  'Frozen': [
    'pizza',
    'ice cream',
    'frozen vegetables',
    'fish fingers',
    'chips',
    'peas',
    'burgers',
    'chicken nuggets',
    'frozen meals',
    'frozen fruit'
  ],
  'Household': [
    'toilet paper',
    'kitchen roll',
    'washing liquid',
    'dishwasher tablets',
    'cleaning products',
    'bin bags',
    'soap',
    'shampoo',
    'toothpaste',
    'deodorant'
  ],
  'Baby': [
    'nappies',
    'baby wipes',
    'baby food',
    'baby milk',
    'baby snacks'
  ]
};

/**
 * Supermarkets to scrape
 */
const SUPERMARKETS = ['asda', 'morrisons', 'tesco', 'sainsburys', 'aldi', 'lidl', 'waitrose', 'ocado'];

/**
 * Main function to scrape multiple categories
 */
async function scrapeMultipleCategories(options = {}) {
  const {
    supermarkets = SUPERMARKETS,
    categories = Object.keys(CATEGORIES),
    maxProductsPerSearch = 20,
    delayBetweenSearches = 5000 // 5 seconds between searches
  } = options;

  console.log('='.repeat(60));
  console.log('BASKET SAVER - MULTI-CATEGORY SCRAPER');
  console.log('='.repeat(60));
  console.log(`Supermarkets: ${supermarkets.join(', ')}`);
  console.log(`Categories: ${categories.join(', ')}`);
  console.log(`Max products per search: ${maxProductsPerSearch}`);
  console.log('='.repeat(60));
  console.log('');

  const overallStats = {
    totalSearches: 0,
    totalFound: 0,
    totalInserted: 0,
    totalUpdated: 0,
    totalErrors: 0,
    startTime: new Date()
  };

  // Loop through each supermarket
  for (const supermarket of supermarkets) {
    console.log(`\n${'#'.repeat(60)}`);
    console.log(`# SCRAPING: ${supermarket.toUpperCase()}`);
    console.log(`${'#'.repeat(60)}\n`);

    // Loop through each category
    for (const category of categories) {
      const searchTerms = CATEGORIES[category] || [];

      console.log(`\n[$category] - ${searchTerms.length} search terms`);
      console.log('-'.repeat(60));

      // Loop through each search term in the category
      for (const searchTerm of searchTerms) {
        try {
          overallStats.totalSearches++;

          const stats = await scrapeSearchTermToSupabase(
            supermarket,
            searchTerm,
            maxProductsPerSearch
          );

          // Accumulate stats
          overallStats.totalFound += stats.found;
          overallStats.totalInserted += stats.inserted;
          overallStats.totalUpdated += stats.updated;
          overallStats.totalErrors += stats.errors;

          // Delay between searches to be respectful
          if (delayBetweenSearches > 0) {
            console.log(`Waiting ${delayBetweenSearches / 1000}s before next search...\n`);
            await new Promise(resolve => setTimeout(resolve, delayBetweenSearches));
          }

        } catch (error) {
          console.error(`Error scraping ${supermarket} - ${searchTerm}:`, error.message);
          overallStats.totalErrors++;
        }
      }
    }
  }

  // Print final summary
  const endTime = new Date();
  const durationMinutes = ((endTime - overallStats.startTime) / 1000 / 60).toFixed(2);

  console.log('\n' + '='.repeat(60));
  console.log('SCRAPING COMPLETE - FINAL SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total searches: ${overallStats.totalSearches}`);
  console.log(`Total products found: ${overallStats.totalFound}`);
  console.log(`New products inserted: ${overallStats.totalInserted}`);
  console.log(`Existing products updated: ${overallStats.totalUpdated}`);
  console.log(`Errors: ${overallStats.totalErrors}`);
  console.log(`Duration: ${durationMinutes} minutes`);
  console.log('='.repeat(60));

  return overallStats;
}

/**
 * Quick test mode - scrape just a few items
 */
async function quickTest() {
  console.log('Running QUICK TEST mode...\n');

  await scrapeMultipleCategories({
    supermarkets: ['asda'],
    categories: ['Drinks', 'Cupboard Essentials'],
    maxProductsPerSearch: 10,
    delayBetweenSearches: 2000
  });

  // Refresh popular items with latest products
  console.log('\n' + '='.repeat(60));
  console.log('REFRESHING POPULAR ITEMS');
  console.log('='.repeat(60));
  await refreshPopularItems();
}

/**
 * Full scrape mode - comprehensive but takes longer
 */
async function fullScrape() {
  console.log('Running FULL SCRAPE mode...\n');
  console.log('WARNING: This will take a while (2-3 hours)\n');

  await scrapeMultipleCategories({
    supermarkets: SUPERMARKETS,
    categories: Object.keys(CATEGORIES),
    maxProductsPerSearch: 50,
    delayBetweenSearches: 5000
  });

  // Refresh popular items with latest products
  console.log('\n' + '='.repeat(60));
  console.log('REFRESHING POPULAR ITEMS');
  console.log('='.repeat(60));
  await refreshPopularItems();
}

/**
 * Single supermarket scrape
 */
async function scrapeSingleSupermarket(supermarketName) {
  console.log(`Running scrape for ${supermarketName.toUpperCase()} only...\n`);

  await scrapeMultipleCategories({
    supermarkets: [supermarketName.toLowerCase()],
    categories: Object.keys(CATEGORIES),
    maxProductsPerSearch: 50,
    delayBetweenSearches: 3000
  });

  // Refresh popular items with latest products
  console.log('\n' + '='.repeat(60));
  console.log('REFRESHING POPULAR ITEMS');
  console.log('='.repeat(60));
  await refreshPopularItems();
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const mode = args[0] || 'quick';

  switch (mode.toLowerCase()) {
    case 'test':
    case 'quick':
      quickTest().catch(console.error);
      break;

    case 'full':
      fullScrape().catch(console.error);
      break;

    case 'asda':
      scrapeSingleSupermarket('asda').catch(console.error);
      break;

    case 'morrisons':
      scrapeSingleSupermarket('morrisons').catch(console.error);
      break;

    case 'tesco':
      scrapeSingleSupermarket('tesco').catch(console.error);
      break;

    case 'sainsburys':
      scrapeSingleSupermarket('sainsburys').catch(console.error);
      break;

    case 'aldi':
      scrapeSingleSupermarket('aldi').catch(console.error);
      break;

    case 'lidl':
      scrapeSingleSupermarket('lidl').catch(console.error);
      break;

    case 'waitrose':
      scrapeSingleSupermarket('waitrose').catch(console.error);
      break;

    case 'ocado':
      scrapeSingleSupermarket('ocado').catch(console.error);
      break;

    default:
      console.log('Usage: node scrapeCategories.js [mode]');
      console.log('');
      console.log('Modes:');
      console.log('  quick      Quick test (Asda only, 2 categories) [default]');
      console.log('  full       Full scrape (all supermarkets, all categories)');
      console.log('  asda       Scrape Asda only (all categories)');
      console.log('  morrisons  Scrape Morrisons only (all categories)');
      console.log('  tesco      Scrape Tesco only (all categories)');
      console.log('  sainsburys Scrape Sainsburys only (all categories)');
      console.log('  aldi       Scrape Aldi only (all categories)');
      console.log('  lidl       Scrape Lidl only (all categories)');
      console.log('  waitrose   Scrape Waitrose only (all categories)');
      console.log('  ocado      Scrape Ocado only (all categories)');
      console.log('');
      console.log('Examples:');
      console.log('  node scrapeCategories.js quick');
      console.log('  node scrapeCategories.js full');
      console.log('  node scrapeCategories.js asda');
      process.exit(0);
  }
}

module.exports = {
  scrapeMultipleCategories,
  quickTest,
  fullScrape,
  scrapeSingleSupermarket,
  CATEGORIES,
  SUPERMARKETS
};
