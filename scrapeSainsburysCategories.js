require('dotenv').config();
const { upsertProduct } = require('./supabase-utils.js');
const { scrapeSupermarket, SUPERMARKET_SELECTORS } = require('./scraper-stealth-template.js');
const { addToPopularItemsIfMatches } = require('./add-to-popular-items.js');
const stealth = require('./stealth.js');
const XLSX = require('xlsx');
const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Add stealth plugin to puppeteer
puppeteer.use(StealthPlugin());

/**
 * Sainsburys-specific category scraper with advanced stealth features
 * Navigates through Sainsburys category pages to extract all grocery products
 *
 * Based on the ASDA/Tesco scraper pattern with Sainsburys-specific adaptations
 */

/**
 * Load all subcategories from the Excel file
 */
function loadCategoriesFromExcel() {
  const excelPath = path.join(__dirname, 'Supermarket Categories', 'Sainsburys_Complete_Categories.xlsx');

  console.log('Loading Sainsburys categories from Excel file:', excelPath);

  // Read the Excel file
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert to JSON objects
  const data = XLSX.utils.sheet_to_json(worksheet);

  console.log(`Loaded ${data.length} Sainsburys subcategories from Excel file\n`);

  // Group by main category for organized processing
  const groupedCategories = {};

  data.forEach(row => {
    const mainCategory = row['Main Category'] || row['Category'] || row['main_category'];
    const subCategory = row['Sub Category'] || row['Subcategory'] || row['sub_category'] || row['Name'];
    const url = row['URL'] || row['url'] || row['Link'];

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
      if (text && (text.includes('Accept') || text.includes('accept') || text.includes('Allow') || text.includes('Agree'))) {
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
 * Extract product URLs from a Sainsburys category page
 */
async function getProductsFromCategory(page, categoryUrl, isFirstCategory = false) {
  console.log(`  Scanning for products: ${categoryUrl}`);

  const allProductUrls = [];
  let currentPage = 1;
  const maxPages = 10; // Reduced safety limit for Sainsburys
  let lastPageProductCount = -1;
  let consecutiveSameCount = 0;

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

      // Wait for product grid to render
      await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));

      // Extract product URLs from this page - try multiple selectors for Sainsburys
      const productUrls = await page.evaluate(() => {
        const selectors = [
          'a[href*="/gol-ui/product/"]',
          'a[href*="/shop/gb/groceries/"]',
          '[data-testid="product-tile"] a',
          '.product-tile a',
          'a[data-test-id*="product"]',
          '.ln-o-grid__item a[href*="/product/"]'
        ];

        let urls = [];

        for (const selector of selectors) {
          const links = document.querySelectorAll(selector);
          links.forEach(link => {
            if (link.href && (link.href.includes('/product/') || link.href.includes('/gol-ui/') || link.href.includes('/groceries/'))) {
              urls.push(link.href);
            }
          });
          if (urls.length > 0) break; // Found products with this selector
        }

        return [...new Set(urls)]; // Remove duplicates
      });

      if (productUrls.length === 0) {
        // No products found, we've reached the end
        console.log(`    Page ${currentPage}: No products (end of pagination)`);
        break;
      }

      console.log(`    Page ${currentPage}: Found ${productUrls.length} products`);
      allProductUrls.push(...productUrls);

      // Check for infinite loop - if we get the same product count 3 times in a row, likely stuck
      if (productUrls.length === lastPageProductCount) {
        consecutiveSameCount++;
        if (consecutiveSameCount >= 2) { // Reduced from 3 to 2 for faster detection
          console.log(`    ⚠️  Detected possible infinite pagination (same count ${consecutiveSameCount + 1} times), stopping`);
          break;
        }
      } else {
        consecutiveSameCount = 0;
      }
      lastPageProductCount = productUrls.length;

      // Additional safeguard: if we see exactly 61 products repeatedly, it's likely Sainsburys infinite pagination
      if (productUrls.length === 61 && currentPage > 2) {
        console.log(`    ⚠️  Detected Sainsburys infinite pagination pattern (61 products repeatedly), stopping`);
        break;
      }

      // Check if there's a next page - improved detection
      const hasNextPage = await page.evaluate(() => {
        // Look for pagination buttons or "next" links with multiple selectors
        const nextSelectors = [
          'a[aria-label*="next"]:not(.disabled)',
          'a[rel="next"]:not(.disabled)',
          'button[aria-label*="next"]:not(:disabled)',
          '[data-testid="pagination-next"]:not(.disabled)',
          '.ln-c-pagination__link--next:not(.disabled)',
          'a[title*="Next"]:not(.disabled)',
          '.pagination-next:not(.disabled)',
          '[data-automation-id="pagination-next"]:not(.disabled)'
        ];

        for (const selector of nextSelectors) {
          const element = document.querySelector(selector);
          if (element && !element.hasAttribute('disabled') && !element.classList.contains('disabled')) {
            return true;
          }
        }
        return false;
      });

      if (!hasNextPage) {
        console.log(`    No more pages available`);
        break;
      }

      currentPage++;

      // Variable delay to appear more human
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
 * Main function to scrape all Sainsburys categories
 */
async function scrapeSainsburysCategories() {
  console.log('🛒 Starting prioritized Sainsburys category scraping...\n');

  // Load categories from Excel
  const allCategories = loadCategoriesFromExcel();

  // Prioritize categories that are most likely to contain popular items
  const priorityOrder = [
    'Dairy, Eggs & Chilled', // Contains dairy, eggs - most popular items
    'Bakery',               // Contains bread
    'Food Cupboard',        // Contains pasta, baked beans
    'Meat & Fish',          // Contains chicken, beef
    'Fruit & Vegetables',   // Contains fresh produce
    'Frozen',              // Frozen foods
    'Drinks',              // Beverages
    'Confectionery & Snacks', // Snacks
    'Dietary & World Foods', // Specialty foods
    'Baby & Toddler',       // Baby products
    'Toiletries & Health',  // Health products
    'Beauty & Cosmetics',   // Beauty products
    'Pet',                 // Pet food
    'Household'            // Household items
  ];

  // Reorder categories based on priority
  const categoriesByMain = {};
  priorityOrder.forEach(category => {
    if (allCategories[category]) {
      categoriesByMain[category] = allCategories[category];
    }
  });

  // Add any remaining categories not in priority list
  Object.keys(allCategories).forEach(category => {
    if (!categoriesByMain[category]) {
      categoriesByMain[category] = allCategories[category];
    }
  });

  console.log('🎯 Categories reordered by priority for popular items detection:');

  const browser = await puppeteer.launch({
	executablePath: '/usr/bin/chromium-browser',
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-gpu',
      '--window-size=1920,1080',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ]
  });

  const page = await browser.newPage();

  // Set realistic viewport
  await page.setViewport({
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1
  });

  // Set additional headers to mimic real browser
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
  });

  let totalProcessed = 0;
  let totalProducts = 0;
  let totalProductsFound = 0;
  let errors = 0;
  let isFirstCategory = true;

  console.log('📋 Categories to process:');
  Object.keys(categoriesByMain).forEach(mainCat => {
    console.log(`   ${mainCat}: ${categoriesByMain[mainCat].length} subcategories`);
  });
  console.log('');

  try {
    // Process each main category
    for (const [mainCategory, subcategories] of Object.entries(categoriesByMain)) {
      console.log(`\n🏷️  Processing Main Category: ${mainCategory}`);
      console.log(`📁 ${subcategories.length} subcategories to scrape\n`);

      // Process each subcategory
      for (let i = 0; i < subcategories.length; i++) {
        const subcategory = subcategories[i];
        totalProcessed++;

        console.log(`[${totalProcessed}] 🔍 Scraping: ${subcategory.name}`);
        console.log(`🔗 URL: ${subcategory.url}`);

        try {
          // Get all product URLs from this category
          const productUrls = await getProductsFromCategory(page, subcategory.url, isFirstCategory);
          isFirstCategory = false;

          totalProductsFound += productUrls.length;

          if (productUrls.length > 0) {
            console.log(`   ✅ Found ${productUrls.length} product URLs, now scraping each product...`);

            // Scrape each product individually
            for (let j = 0; j < productUrls.length; j++) {
              const productUrl = productUrls[j];

              try {
                // Use the stealth scraper for individual product
                const productData = await scrapeSupermarket(productUrl, SUPERMARKET_SELECTORS.sainsburys);

                if (productData && productData.name && productData.price) {
                  const result = await upsertProduct('sainsburys', {
                    name: productData.name,
                    price: productData.price,
                    url: productUrl,
                    imageUrl: productData.imageUrl
                  }, subcategory.name);

                  if (result && result.id) {
                    // Check if this product matches any popular items
                    await addToPopularItemsIfMatches(
                      result.id,
                      productData.name,
                      productUrl,
                      productData.imageUrl
                    );
                  }

                  totalProducts++;
                } else {
                  console.log(`     ⚠️  Incomplete product data: ${productUrl}`);
                }

                // Small delay between individual products
                if (j < productUrls.length - 1) {
                  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 500));
                }

              } catch (productError) {
                console.log(`     ❌ Product error: ${productError.message}`);
                errors++;
              }
            }

            console.log(`   💾 Saved ${totalProducts} products to database`);
          } else {
            console.log(`   ❌ No products found`);
          }

        } catch (scrapeError) {
          console.log(`   ❌ Category scraping error: ${scrapeError.message}`);
          errors++;
        }

        console.log(`   📊 Progress: ${totalProcessed} categories, ${totalProductsFound} URLs found, ${totalProducts} products saved, ${errors} errors\n`);

        // Add delay between categories
        if (i < subcategories.length - 1) {
          console.log('   ⏳ Waiting 3 seconds before next category...\n');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Sainsburys Category Scraping Complete!');
    console.log(`📊 Final Results:`);
    console.log(`   • Categories processed: ${totalProcessed}`);
    console.log(`   • Product URLs found: ${totalProductsFound}`);
    console.log(`   • Products saved: ${totalProducts}`);
    console.log(`   • Errors encountered: ${errors}`);
    console.log(`   • Success rate: ${((totalProcessed - errors) / totalProcessed * 100).toFixed(1)}%`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Fatal error during Sainsburys category scraping:', error);
  } finally {
    await browser.close();
  }
}

// Add command line argument support for testing specific categories
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--test')) {
    console.log('🧪 Running in test mode - processing only first 2 subcategories...\n');

    // Create a test version that limits the scraping
    async function testSainsburysCategories() {
      const categoriesByMain = loadCategoriesFromExcel();

      // Limit to first main category and first 2 subcategories
      const firstMainCategory = Object.keys(categoriesByMain)[0];
      const limitedCategories = {
        [firstMainCategory]: categoriesByMain[firstMainCategory].slice(0, 2)
      };

      console.log(`🧪 Test mode: Processing "${firstMainCategory}" - ${limitedCategories[firstMainCategory].length} subcategories\n`);

      // Set up browser with same configuration as main function
      const browser = await puppeteer.launch({
        executablePath: '/usr/bin/chromium-browser',
	headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-gpu',
          '--window-size=1920,1080',
          '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]
      });

      const page = await browser.newPage();

      await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1
      });

      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      });

      try {
        // Test just the category extraction for the first 2 subcategories
        const subcategories = limitedCategories[firstMainCategory];

        for (let i = 0; i < subcategories.length; i++) {
          const subcategory = subcategories[i];
          console.log(`[${i + 1}] 🔍 Testing: ${subcategory.name}`);
          console.log(`🔗 URL: ${subcategory.url}`);

          try {
            const productUrls = await getProductsFromCategory(page, subcategory.url, i === 0);
            console.log(`   ✅ Found ${productUrls.length} product URLs`);

            if (productUrls.length > 0) {
              // Test scraping first product only
              console.log(`   🧪 Testing first product: ${productUrls[0]}`);
              const productData = await scrapeSupermarket(productUrls[0], SUPERMARKET_SELECTORS.sainsburys);
              console.log(`   📦 Product data:`, productData);
            }
          } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
          }

          if (i < subcategories.length - 1) {
            console.log('   ⏳ Waiting 2 seconds...\n');
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      } finally {
        await browser.close();
      }
    }

    testSainsburysCategories().catch(console.error);
  } else {
    scrapeSainsburysCategories().catch(console.error);
  }
}

module.exports = { scrapeSainsburysCategories, loadCategoriesFromExcel };
