/**
 * Asda Subcategory Scraper
 * Uses manual list of subcategory URLs to comprehensively scrape all Asda products
 */

require('dotenv').config();
const { upsertProduct } = require('./scrapeToSupabase.js');
const { scrapeSupermarket, SUPERMARKET_SELECTORS } = require('./scraper-stealth-template.js');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const stealth = require('./stealth.js');

puppeteer.use(StealthPlugin());

// Manual list of Asda subcategories
const ASDA_SUBCATEGORIES = [
  { category: 'Fruit, Veg & Flowers', name: 'Fruit', url: 'https://www.asda.com/groceries/fruit-veg-flowers/fruit/view-all-fruit' },
  { category: 'Fruit, Veg & Flowers', name: 'Vegetables & Potatoes', url: 'https://www.asda.com/groceries/fruit-veg-flowers/vegetables-potatoes/view-all-vegetables-potatoes' },
  { category: 'Fruit, Veg & Flowers', name: 'Salads & Stir Fry', url: 'https://www.asda.com/groceries/fruit-veg-flowers/salads-stir-fry/view-all-salads-stir-fry' },
  { category: 'Fruit, Veg & Flowers', name: 'Exceptional Fruit & Veg', url: 'https://www.asda.com/groceries/fruit-veg-flowers/exceptional-fruit-veg' },
  { category: 'Fruit, Veg & Flowers', name: 'Flowers', url: 'https://www.asda.com/groceries/fruit-veg-flowers/flowers/flowers' },
  { category: 'Fruit, Veg & Flowers', name: 'Raw Nuts, Seeds & Dried Fruit', url: 'https://www.asda.com/groceries/fruit-veg-flowers/raw-nuts-seeds-dried-fruit/view-all-raw-nuts-seeds-dried-fruit' },
  { category: 'Meat, Poultry & Fish', name: 'Chicken & Turkey', url: 'https://www.asda.com/groceries/meat-poultry-fish/meat-poultry/chicken-turkey' },
  { category: 'Meat, Poultry & Fish', name: 'Beef', url: 'https://www.asda.com/groceries/meat-poultry-fish/meat-poultry/beef' },
  { category: 'Meat, Poultry & Fish', name: 'Bacon, Sausages & Gammon', url: 'https://www.asda.com/groceries/meat-poultry-fish/meat-poultry/bacon-sausages-gammon' },
  { category: 'Meat, Poultry & Fish', name: 'Pork', url: 'https://www.asda.com/groceries/meat-poultry-fish/meat-poultry/pork' },
  { category: 'Meat, Poultry & Fish', name: 'Lamb', url: 'https://www.asda.com/groceries/meat-poultry-fish/meat-poultry/lamb' },
  { category: 'Meat, Poultry & Fish', name: 'Exceptional Meat & Fish', url: 'https://www.asda.com/groceries/meat-poultry-fish/meat-poultry/exceptional-meat-fish' },
  { category: 'Meat, Poultry & Fish', name: 'Duck, Game & Venison', url: 'https://www.asda.com/groceries/meat-poultry-fish/meat-poultry/duck-game-venison' },
  { category: 'Meat, Poultry & Fish', name: 'Simple to Cook', url: 'https://www.asda.com/groceries/meat-poultry-fish/meat-poultry/simple-to-cook' },
  { category: 'Meat, Poultry & Fish', name: 'Slow Cooked', url: 'https://www.asda.com/groceries/meat-poultry-fish/meat-poultry/slow-cooked' },
  { category: 'Meat, Poultry & Fish', name: '2 for £4.98 Meat, Fish & Poultry', url: 'https://www.asda.com/groceries/meat-poultry-fish/meat-poultry/2-for-498-meat-fish-poultry' },
  { category: 'Meat, Poultry & Fish', name: 'BBQ Essentials', url: 'https://www.asda.com/groceries/meat-poultry-fish/meat-poultry/bbq-essentials' },
  { category: 'Meat, Poultry & Fish', name: 'Liver', url: 'https://www.asda.com/groceries/meat-poultry-fish/meat-poultry/liver' },
  { category: 'Meat, Poultry & Fish', name: 'Microwavable Snacks', url: 'https://www.asda.com/groceries/meat-poultry-fish/meat-poultry/microwavable-snacks' },
  { category: 'Meat, Poultry & Fish', name: '2 for £8 Meat & Fish', url: 'https://www.asda.com/groceries/meat-poultry-fish/meat-poultry/2-for-8-meat-fish' },
  { category: 'Meat, Poultry & Fish', name: 'Fish & Seafood', url: 'https://www.asda.com/groceries/meat-poultry-fish/fish-seafood/view-all-fish' },
  { category: 'Meat, Poultry & Fish', name: '3 for £5 Cooked Meats', url: 'https://www.asda.com/groceries/meat-poultry-fish/cooked-meat/3-for-5-cooked-meats' },
  { category: 'Meat, Poultry & Fish', name: 'Sliced Cooked Meats', url: 'https://www.asda.com/groceries/meat-poultry-fish/cooked-meat/sliced-cooked-meats' },
  { category: 'Meat, Poultry & Fish', name: 'Chicken & Turkey Pieces', url: 'https://www.asda.com/groceries/meat-poultry-fish/cooked-meat/chicken-turkey-pieces' },
  { category: 'Meat, Poultry & Fish', name: 'Continental Meats & Pate', url: 'https://www.asda.com/groceries/meat-poultry-fish/cooked-meat/continental-meats-pate' },
  { category: 'Meat, Poultry & Fish', name: 'Snacking & Hot Dogs', url: 'https://www.asda.com/groceries/meat-poultry-fish/cooked-meat/snacking-hot-dogs' },
  { category: 'Meat, Poultry & Fish', name: 'Exceptional Cooked Meat', url: 'https://www.asda.com/groceries/meat-poultry-fish/cooked-meat/exceptional-cooked-meat' },
  { category: 'Meat, Poultry & Fish', name: 'Vegan Cooked Meat Alternatives', url: 'https://www.asda.com/groceries/meat-poultry-fish/cooked-meat/vegan-cooked-meat-alternatives' }
];

/**
 * Get products from a subcategory page with pagination
 */
async function getProductsFromSubcategory(page, url) {
  console.log(`  Scanning: ${url}`);

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(resolve => setTimeout(resolve, 5000));

  let allProducts = [];
  let pageNum = 1;
  let hasMorePages = true;

  while (hasMorePages && pageNum <= 50) {
    const products = await page.evaluate(() => {
      const links = document.querySelectorAll('a[href*="/product/"]');
      return [...new Set([...links].map(a => a.href))];
    });

    if (products.length === 0) {
      hasMorePages = false;
      break;
    }

    console.log(`    Page ${pageNum}: Found ${products.length} products`);
    allProducts.push(...products);

    // Try to go to next page
    const nextButton = await page.evaluate(() => {
      const buttons = [...document.querySelectorAll('button, a')];
      const nextBtn = buttons.find(btn =>
        btn.textContent?.includes('Next') ||
        btn.getAttribute('aria-label')?.includes('Next')
      );
      if (nextBtn && !nextBtn.disabled) {
        nextBtn.click();
        return true;
      }
      return false;
    });

    if (!nextButton) {
      hasMorePages = false;
    } else {
      await new Promise(resolve => setTimeout(resolve, 3000));
      pageNum++;
    }
  }

  // Remove duplicates
  allProducts = [...new Set(allProducts)];
  console.log(`  Total unique products: ${allProducts.length}\n`);

  return allProducts;
}

/**
 * Wrap promise with timeout
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
 * Main scraper
 */
async function scrapeAsdaSubcategories() {
  console.log('\n' + '='.repeat(60));
  console.log('ASDA SUBCATEGORY SCRAPER');
  console.log('='.repeat(60));
  console.log(`Subcategories to scrape: ${ASDA_SUBCATEGORIES.length}`);
  console.log('='.repeat(60) + '\n');

  const overallStats = {
    totalSubcategories: 0,
    totalFound: 0,
    totalInserted: 0,
    totalUpdated: 0,
    totalErrors: 0,
    totalSkipped: 0,
    failedProducts: [],
    startTime: new Date()
  };

  const stealthArgs = stealth.getStealthLaunchArgs();
  let browser = await puppeteer.launch({
    headless: 'new',
    args: stealthArgs
  });

  let page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  // Handle cookie consent once at start
  try {
    await page.goto('https://www.asda.com/groceries', { waitUntil: 'domcontentloaded', timeout: 30000 });
    const buttons = await page.$$('button');
    for (const button of buttons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text && (text.includes('Accept') || text.includes('accept'))) {
        await button.click();
        console.log('✓ Accepted cookies\n');
        await new Promise(resolve => setTimeout(resolve, 2000));
        break;
      }
    }
  } catch (e) {}

  // Process each subcategory
  for (const subcat of ASDA_SUBCATEGORIES) {
    console.log(`\n${'#'.repeat(60)}`);
    console.log(`# ${subcat.category} > ${subcat.name}`);
    console.log(`${'#'.repeat(60)}`);

    overallStats.totalSubcategories++;

    try {
      const productUrls = await getProductsFromSubcategory(page, subcat.url);
      overallStats.totalFound += productUrls.length;

      // Scrape each product
      for (let i = 0; i < productUrls.length; i++) {
        const url = productUrls[i];
        console.log(`[${i + 1}/${productUrls.length}] Scraping...`);

        try {
          const product = await withTimeout(
            scrapeSupermarket(url, SUPERMARKET_SELECTORS['asda']),
            60000,
            'Product scraping timed out'
          );

          if (product && product.name && product.price) {
            console.log(`  ${product.name} - ${product.price}`);
            product.url = url;

            const result = await upsertProduct('asda', product);

            if (result) {
              if (result.action === 'inserted') {
                overallStats.totalInserted++;
                console.log(`  ✓ NEW product added`);
              } else if (result.action === 'updated') {
                overallStats.totalUpdated++;
                console.log(`  ✓ Updated`);
              }
            } else {
              overallStats.totalErrors++;
            }
          } else {
            console.log(`  ✗ Failed to extract data`);
            overallStats.totalErrors++;
            overallStats.failedProducts.push({ url, reason: 'Failed to extract data' });
          }

        } catch (error) {
          if (error.message.includes('timed out')) {
            console.error(`  ⏱️  TIMEOUT: Skipping`);
            overallStats.totalSkipped++;
            overallStats.failedProducts.push({ url, reason: 'Timeout' });
          } else {
            console.error(`  Error: ${error.message}`);
            overallStats.totalErrors++;
            overallStats.failedProducts.push({ url, reason: error.message });
          }
        }

        // Small delay between products
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
      }

    } catch (error) {
      console.error(`Error processing subcategory: ${error.message}`);
      overallStats.totalErrors++;
    }

    // Delay between subcategories
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));
  }

  await browser.close();

  // Print final summary
  const endTime = new Date();
  const durationMinutes = ((endTime - overallStats.startTime) / 1000 / 60).toFixed(2);

  console.log('\n' + '='.repeat(60));
  console.log('ASDA SUBCATEGORY SCRAPING COMPLETE');
  console.log('='.repeat(60));
  console.log(`Subcategories scraped: ${overallStats.totalSubcategories}`);
  console.log(`Total products found: ${overallStats.totalFound}`);
  console.log(`New products inserted: ${overallStats.totalInserted}`);
  console.log(`Existing products updated: ${overallStats.totalUpdated}`);
  console.log(`Skipped (timeout): ${overallStats.totalSkipped}`);
  console.log(`Errors: ${overallStats.totalErrors}`);
  console.log(`Duration: ${durationMinutes} minutes`);
  console.log('='.repeat(60));

  if (overallStats.failedProducts.length > 0) {
    console.log(`\nFailed/Skipped: ${overallStats.failedProducts.length} products`);
  }

  return overallStats;
}

// Run if executed directly
if (require.main === module) {
  scrapeAsdaSubcategories().catch(console.error);
}

module.exports = { scrapeAsdaSubcategories, ASDA_SUBCATEGORIES };
