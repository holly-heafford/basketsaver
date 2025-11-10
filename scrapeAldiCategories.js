require('dotenv').config();
const { upsertProduct } = require('./scrapeToSupabase.js');
const { scrapeSupermarket, SUPERMARKET_SELECTORS } = require('./scraper-stealth-template.js');

/**
 * Aldi-specific category scraper
 * Aldi's website structure requires navigating to category pages directly
 * instead of using search, as search returns SpecialBuys promotional items
 */

const ALDI_CATEGORIES = [
  { name: 'Fresh Food', url: 'https://www.aldi.co.uk/products/fresh-food/k/1588161416978050' },
  { name: 'Chilled Food', url: 'https://www.aldi.co.uk/products/chilled-food/k/1588161416978051' },
  { name: 'Food Cupboard', url: 'https://www.aldi.co.uk/products/food-cupboard/k/1588161416978053' },
  { name: 'Drinks', url: 'https://www.aldi.co.uk/products/drinks/k/1588161416978054' },
  { name: 'Frozen Food', url: 'https://www.aldi.co.uk/products/frozen-food/k/1588161416978056' },
  { name: 'Bakery', url: 'https://www.aldi.co.uk/products/bakery/k/1588161416978049' }
];

/**
 * Extract subcategory URLs from a category page
 */
async function getSubcategories(page, categoryUrl, categoryName) {
  console.log(`\nNavigating to category: ${categoryUrl}`);
  await page.goto(categoryUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Handle cookie consent
  try {
    const buttons = await page.$$('button');
    for (const button of buttons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text && (text.includes('Accept') || text.includes('accept'))) {
        await button.click();
        console.log('Clicked cookie consent button');
        await new Promise(resolve => setTimeout(resolve, 2000));
        break;
      }
    }
  } catch (e) {}

  // Extract the category slug from the URL for filtering
  const categorySlug = categoryUrl.split('/products/')[1]?.split('/')[0] || '';
  console.log(`  Filtering for category slug: "${categorySlug}"`);

  // Extract subcategory links
  const subcategories = await page.evaluate((slug) => {
    const links = document.querySelectorAll('a[href*="/products/"][href*="/k/"]');
    const filtered = [...links].filter(a => {
      const url = a.href.toLowerCase();
      // Must contain the category slug and not be excluded
      return url.includes(`/products/${slug}/`) &&
             !url.includes('specialbuys') &&
             !url.includes('onetrust.com') &&
             !url.includes('cookie') &&
             !url.includes('privacy');
    });

    // Get unique URLs
    const uniqueUrls = [...new Set(filtered.map(a => a.href))];
    return uniqueUrls;
  }, categorySlug);

  console.log(`Found ${subcategories.length} subcategories`);
  return subcategories;
}

/**
 * Extract product URLs from a category or subcategory page
 */
async function getProductsFromCategory(page, categoryUrl, maxProducts = 999999) {
  console.log(`  Scanning for products: ${categoryUrl}`);
  await page.goto(categoryUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(resolve => setTimeout(resolve, 3000));

  const productUrls = await page.evaluate(() => {
    const tiles = document.querySelectorAll('.product-tile');
    const urls = [];

    tiles.forEach(tile => {
      const link = tile.querySelector('a[href*="/product/"]');
      if (link && link.href) {
        urls.push(link.href);
      }
    });

    return urls;
  });

  console.log(`  Found ${productUrls.length} products`);
  return productUrls.slice(0, maxProducts);
}

/**
 * Wrap a promise with a timeout
 */
function withTimeout(promise, timeoutMs, errorMessage) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage || 'Timeout')), timeoutMs)
    )
  ]);
}

/**
 * Scrape all Aldi categories
 */
async function scrapeAldi(maxProductsPerCategory = 50) {
  console.log('\n' + '='.repeat(60));
  console.log('ALDI CATEGORY SCRAPER');
  console.log('='.repeat(60));
  console.log(`Max products per category: ${maxProductsPerCategory}`);
  console.log('='.repeat(60) + '\n');

  const puppeteer = require('puppeteer-extra');
  const StealthPlugin = require('puppeteer-extra-plugin-stealth');
  puppeteer.use(StealthPlugin());

  const overallStats = {
    totalCategories: 0,
    totalFound: 0,
    totalInserted: 0,
    totalUpdated: 0,
    totalErrors: 0,
    totalSkipped: 0,
    failedProducts: [],
    startTime: new Date()
  };

  let browser;
  let page;

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Process each main category
    for (const category of ALDI_CATEGORIES) {
      console.log(`\n${'#'.repeat(60)}`);
      console.log(`# ${category.name.toUpperCase()}`);
      console.log(`${'#'.repeat(60)}`);

      overallStats.totalCategories++;

      try {
        // Get all subcategories for this main category
        const subcategories = await getSubcategories(page, category.url, category.name);

        // Also include the main category page itself
        const categoriesToScrape = [category.url, ...subcategories];

        console.log(`Will scrape ${categoriesToScrape.length} pages (main + subcategories)`);

        // Collect products from all subcategories
        let allProductUrls = [];

        for (const subcat of categoriesToScrape) {
          try {
            const products = await getProductsFromCategory(page, subcat);
            allProductUrls.push(...products);

            // Small delay between subcategories
            await new Promise(resolve => setTimeout(resolve, 2000));
          } catch (error) {
            console.error(`  Error scanning subcategory: ${error.message}`);
            // Continue to next subcategory
          }
        }

        // Remove duplicates
        allProductUrls = [...new Set(allProductUrls)];

        console.log(`\nTotal products to scrape from ${category.name}: ${allProductUrls.length}\n`);
        overallStats.totalFound += allProductUrls.length;

        // Scrape each product
        for (let i = 0; i < allProductUrls.length; i++) {
          const url = allProductUrls[i];
          console.log(`[${i + 1}/${allProductUrls.length}] Scraping product...`);

          try {
            // Wrap scraping with 60-second timeout
            const product = await withTimeout(
              scrapeSupermarket(url, SUPERMARKET_SELECTORS['aldi']),
              60000,
              'Product scraping timed out after 60 seconds'
            );

            if (product && product.name && product.price) {
              console.log(`  ${product.name} - ${product.price}`);

              // Add URL to product data
              product.url = url;

              const result = await upsertProduct('aldi', product);

              if (result) {
                if (result.action === 'inserted') {
                  overallStats.totalInserted++;
                  console.log(`  ✓ Saved to database (NEW)`);
                } else if (result.action === 'updated') {
                  overallStats.totalUpdated++;
                  console.log(`  ✓ Saved to database (updated)`);
                }
              } else {
                overallStats.totalErrors++;
              }
            } else {
              console.log(`  ✗ Failed to extract product data`);
              overallStats.totalErrors++;
              overallStats.failedProducts.push({ url, reason: 'Failed to extract data' });
            }

          } catch (error) {
            if (error.message.includes('timed out')) {
              console.error(`  ⏱️  TIMEOUT: Skipping product (took > 60s)`);
              overallStats.totalSkipped++;
              overallStats.failedProducts.push({ url, reason: 'Timeout (>60s)' });
            } else {
              console.error(`  Error: ${error.message}`);
              overallStats.totalErrors++;
              overallStats.failedProducts.push({ url, reason: error.message });
            }
          }

          // Small delay between products
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Close and reopen browser after each category to prevent memory/connection issues
        console.log(`\nClosing browser before next category...\n`);
        await browser.close();

        // Reopen browser for next category (if not last)
        const categoryIndex = ALDI_CATEGORIES.indexOf(category);
        if (categoryIndex < ALDI_CATEGORIES.length - 1) {
          console.log(`Reopening browser for next category...\n`);
          const newBrowser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
          });
          page = await newBrowser.newPage();
          await page.setViewport({ width: 1920, height: 1080 });
          browser = newBrowser;
        }

        // Delay between main categories
        console.log(`\nWaiting 5s before next category...\n`);
        await new Promise(resolve => setTimeout(resolve, 5000));

      } catch (error) {
        console.error(`Error processing category ${category.name}:`, error.message);
        overallStats.totalErrors++;

        // Try to recover by recreating browser
        try {
          await browser.close();
        } catch (e) {}

        const categoryIndex = ALDI_CATEGORIES.indexOf(category);
        if (categoryIndex < ALDI_CATEGORIES.length - 1) {
          console.log(`Recovering... reopening browser\n`);
          const newBrowser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
          });
          page = await newBrowser.newPage();
          await page.setViewport({ width: 1920, height: 1080 });
          browser = newBrowser;
        }
      }
    }

    await browser.close();

    // Print final summary
    const endTime = new Date();
    const durationMinutes = ((endTime - overallStats.startTime) / 1000 / 60).toFixed(2);

    console.log('\n' + '='.repeat(60));
    console.log('ALDI SCRAPING COMPLETE - FINAL SUMMARY');
    console.log('='.repeat(60));
    console.log(`Categories scraped: ${overallStats.totalCategories}`);
    console.log(`Total products found: ${overallStats.totalFound}`);
    console.log(`New products inserted: ${overallStats.totalInserted}`);
    console.log(`Existing products updated: ${overallStats.totalUpdated}`);
    console.log(`Skipped (timeout): ${overallStats.totalSkipped}`);
    console.log(`Errors: ${overallStats.totalErrors}`);
    console.log(`Duration: ${durationMinutes} minutes`);
    console.log('='.repeat(60));

    // List failed products if any
    if (overallStats.failedProducts.length > 0) {
      console.log('\n' + '='.repeat(60));
      console.log(`FAILED/SKIPPED PRODUCTS (${overallStats.failedProducts.length})`);
      console.log('='.repeat(60));
      overallStats.failedProducts.forEach((failed, index) => {
        console.log(`${index + 1}. ${failed.url}`);
        console.log(`   Reason: ${failed.reason}`);
      });
      console.log('='.repeat(60));
    }

    return overallStats;

  } catch (error) {
    console.error('Fatal error:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  const maxProducts = process.argv[2] ? parseInt(process.argv[2]) : 999999;
  scrapeAldi(maxProducts).catch(console.error);
}

module.exports = { scrapeAldi, ALDI_CATEGORIES };
