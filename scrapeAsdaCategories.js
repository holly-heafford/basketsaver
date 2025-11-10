require('dotenv').config();
const { upsertProduct } = require('./scrapeToSupabase.js');
const { scrapeSupermarket, SUPERMARKET_SELECTORS } = require('./scraper-stealth-template.js');
const stealth = require('./stealth.js');
const XLSX = require('xlsx');
const path = require('path');

/**
 * Asda-specific category scraper with advanced stealth features
 * Navigates through Asda's category pages to extract all grocery products
 *
 * IMPROVEMENTS:
 * - Integrated stealth.js module for anti-detection
 * - Reads complete category list from Excel file
 * - Better JavaScript-rendered content handling
 * - Enhanced HTTP headers and browser fingerprinting
 */

/**
 * Load all subcategories from the Excel file
 */
function loadCategoriesFromExcel() {
  const excelPath = path.join(__dirname, 'Supermarket Categories', 'ASDA_Complete_Categories.xlsx');

  console.log('Loading categories from Excel file:', excelPath);

  // Read the Excel file
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert to JSON objects
  const data = XLSX.utils.sheet_to_json(worksheet);

  console.log(`Loaded ${data.length} subcategories from Excel file\n`);

  // Group by main category for organized processing
  const groupedCategories = {};

  data.forEach(row => {
    const mainCategory = row['Main Category'];
    const subCategory = row['Sub Category'];
    const url = row['URL'];

    if (!groupedCategories[mainCategory]) {
      groupedCategories[mainCategory] = [];
    }

    groupedCategories[mainCategory].push({
      name: subCategory,
      url: url
    });
  });

  return groupedCategories;
}

/**
 * Handle cookie consent if it appears
 */
async function handleCookieConsent(page) {
  try {
    const buttons = await page.$$('button');
    for (const button of buttons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text && (text.includes('Accept') || text.includes('accept'))) {
        await button.click();
        console.log('  Clicked cookie consent button');
        await new Promise(resolve => setTimeout(resolve, 2000));
        break;
      }
    }
  } catch (e) {
    // Ignore errors - cookie consent might not be there
  }
}

/**
 * Extract product URLs from a category or subcategory page
 * Asda uses pagination, so we need to handle multiple pages
 */
async function getProductsFromCategory(page, categoryUrl, isFirstCategory = false) {
  console.log(`  Scanning for products: ${categoryUrl}`);

  const allProductUrls = [];
  let currentPage = 1;
  const maxPages = 50; // Safety limit

  while (currentPage <= maxPages) {
    try {
      // Navigate to the page (with page parameter if not first page)
      const pageUrl = currentPage === 1
        ? categoryUrl
        : `${categoryUrl}?page=${currentPage}`;

      await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Handle cookie consent on first page
      if (currentPage === 1 && isFirstCategory) {
        await handleCookieConsent(page);
      }

      // IMPROVEMENT: Longer wait for product grid to render
      await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));

      // Extract product URLs from this page
      const productUrls = await page.evaluate(() => {
        const links = document.querySelectorAll('a[href*="/groceries/product/"]');
        const urls = [];

        links.forEach(link => {
          if (link.href && link.href.includes('/groceries/product/')) {
            urls.push(link.href);
          }
        });

        return [...new Set(urls)]; // Remove duplicates
      });

      if (productUrls.length === 0) {
        // No products found, we've reached the end
        console.log(`    Page ${currentPage}: No products (end of pagination)`);
        break;
      }

      console.log(`    Page ${currentPage}: Found ${productUrls.length} products`);
      allProductUrls.push(...productUrls);

      // Check if there's a next page
      const hasNextPage = await page.evaluate(() => {
        // Look for pagination buttons or "next" links
        const nextButton = document.querySelector('a[aria-label*="next"]') ||
                          document.querySelector('a[rel="next"]') ||
                          document.querySelector('button[aria-label*="next"]');
        return nextButton !== null && !nextButton.hasAttribute('disabled');
      });

      if (!hasNextPage) {
        console.log(`    No more pages available`);
        break;
      }

      currentPage++;

      // IMPROVEMENT: Variable delay to appear more human
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));

    } catch (error) {
      console.error(`    Error on page ${currentPage}: ${error.message}`);
      break;
    }
  }

  // Remove duplicates from all pages
  const uniqueUrls = [...new Set(allProductUrls)];
  console.log(`  Total unique products found: ${uniqueUrls.length}`);

  return uniqueUrls;
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
 * Scrape all Asda categories with advanced stealth features
 */
async function scrapeAsda(maxProductsPerCategory = 999999) {
  console.log('\n' + '='.repeat(60));
  console.log('ASDA CATEGORY SCRAPER (READING FROM EXCEL FILE)');
  console.log('='.repeat(60));
  console.log(`Max products per category: ${maxProductsPerCategory}`);
  console.log('='.repeat(60) + '\n');

  // Load categories from Excel file
  const groupedCategories = loadCategoriesFromExcel();

  const puppeteer = require('puppeteer-extra');
  const StealthPlugin = require('puppeteer-extra-plugin-stealth');
  puppeteer.use(StealthPlugin());

  const overallStats = {
    totalCategories: 0,
    totalSubcategories: 0,
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
    // IMPROVEMENT: Launch browser with stealth arguments
    const stealthArgs = stealth.getStealthLaunchArgs();

    browser = await puppeteer.launch({
      headless: 'new',
      args: stealthArgs
    });

    page = await browser.newPage();

    // Simple setup - StealthPlugin handles most of the work
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Process each main category
    let isFirstCategory = true;
    for (const [mainCategoryName, subcategories] of Object.entries(groupedCategories)) {
      try {
        console.log(`\n${'#'.repeat(60)}`);
        console.log(`# ${mainCategoryName.toUpperCase()}`);
        console.log(`${'#'.repeat(60)}`);
        console.log(`Will scrape ${subcategories.length} subcategories`);

        overallStats.totalCategories++;
        overallStats.totalSubcategories += subcategories.length;

        // Collect products from all subcategories
        let allProductUrls = [];
        let productCategoryMap = {}; // Map product URL to MAIN category name

        for (let i = 0; i < subcategories.length; i++) {
          const subcat = subcategories[i];
          console.log(`\n[${i + 1}/${subcategories.length}] ${subcat.name}`);

          try {
            const products = await getProductsFromCategory(page, subcat.url, isFirstCategory);

            // Map each product to the MAIN category (not subcategory)
            products.forEach(url => {
              productCategoryMap[url] = mainCategoryName;
            });

            allProductUrls.push(...products);
            isFirstCategory = false;

            // IMPROVEMENT: Random delay between subcategories (2-4 seconds)
            await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));
          } catch (error) {
            console.error(`  Error scanning subcategory: ${error.message}`);
            // Continue to next subcategory
          }
        }

        // Remove duplicates (keep first occurrence)
        const uniqueUrls = [];
        const seen = new Set();
        for (const url of allProductUrls) {
          if (!seen.has(url)) {
            seen.add(url);
            uniqueUrls.push(url);
          }
        }
        allProductUrls = uniqueUrls;

        // Apply product limit if specified
        if (allProductUrls.length > maxProductsPerCategory) {
          console.log(`\nLimiting from ${allProductUrls.length} to ${maxProductsPerCategory} products`);
          allProductUrls = allProductUrls.slice(0, maxProductsPerCategory);
        }

        console.log(`\nTotal products to scrape from ${mainCategoryName}: ${allProductUrls.length}\n`);
        overallStats.totalFound += allProductUrls.length;

        // Scrape each product
        for (let i = 0; i < allProductUrls.length; i++) {
          const url = allProductUrls[i];
          console.log(`[${i + 1}/${allProductUrls.length}] Scraping product...`);

          try {
            // Wrap scraping with 60-second timeout
            const product = await withTimeout(
              scrapeSupermarket(url, SUPERMARKET_SELECTORS['asda']),
              60000,
              'Product scraping timed out after 60 seconds'
            );

            if (product && product.name && product.price) {
              console.log(`  ${product.name} - ${product.price}`);

              // Add URL to product data
              product.url = url;

              // Get category name for this product
              const categoryName = productCategoryMap[url] || null;

              const result = await upsertProduct('asda', product, categoryName);

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

          // IMPROVEMENT: Variable delay between products (1-2 seconds)
          await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        }

        // IMPROVEMENT: Longer delay between main categories (5-8 seconds)
        const delaySeconds = 5 + Math.random() * 3;
        console.log(`\nWaiting ${delaySeconds.toFixed(1)}s before next category...\n`);
        await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));

      } catch (error) {
        console.error(`Error processing category ${mainCategoryName}:`, error.message);
        overallStats.totalErrors++;

        // Try to recover by recreating browser
        try {
          await browser.close();
        } catch (e) {}

        console.log(`Recovering... reopening browser\n`);

        const newBrowser = await puppeteer.launch({
          headless: 'new',
          args: stealthArgs
        });

        page = await newBrowser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        browser = newBrowser;
      }
    }

    await browser.close();

    // Print final summary
    const endTime = new Date();
    const durationMinutes = ((endTime - overallStats.startTime) / 1000 / 60).toFixed(2);

    console.log('\n' + '='.repeat(60));
    console.log('ASDA SCRAPING COMPLETE - FINAL SUMMARY');
    console.log('='.repeat(60));
    console.log(`Categories scraped: ${overallStats.totalCategories}`);
    console.log(`Subcategories discovered: ${overallStats.totalSubcategories}`);
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
  scrapeAsda(maxProducts).catch(console.error);
}

module.exports = { scrapeAsda, loadCategoriesFromExcel };
