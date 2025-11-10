require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { scrapeSupermarket, SUPERMARKET_SELECTORS } = require('./scraper-stealth-template.js');
const { normalizeProductName } = require('./normalizeProducts.js');
const { mapToMainCategory } = require('./categoryMapping.js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Use service key for write access
);

/**
 * Get or create a category by name
 * Returns the category_id
 * Note: Categories are shared across all supermarkets
 */
async function getOrCreateCategory(categoryName) {
  try {
    // First, try to find existing category
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('name', categoryName)
      .single();

    if (existing) {
      return existing.id;
    }

    // Category doesn't exist, create it
    const { data: newCategory, error } = await supabase
      .from('categories')
      .insert({
        name: categoryName
      })
      .select('id')
      .single();

    if (error) throw error;

    return newCategory.id;

  } catch (error) {
    console.error(`Error getting/creating category "${categoryName}":`, error.message);
    return null;
  }
}

/**
 * Upsert (insert or update) a product in Supabase
 * @param {string} supermarketName - Name of the supermarket
 * @param {object} productData - Product data including name, price, url
 * @param {string} categoryName - Optional category name to assign to the product
 */
async function upsertProduct(supermarketName, productData, categoryName = null) {
  try {
    // Get supermarket ID
    const { data: supermarket } = await supabase
      .from('supermarkets')
      .select('id')
      .eq('slug', supermarketName.toLowerCase())
      .single();

    if (!supermarket) {
      console.error(`Supermarket ${supermarketName} not found in database`);
      return null;
    }

    // Extract product code from URL
    const productCode = productData.url.split('/').pop();

    // Check if product already exists
    const { data: existing } = await supabase
      .from('products')
      .select('id, current_price')
      .eq('supermarket_id', supermarket.id)
      .eq('product_code', productCode)
      .single();

    // Parse price to decimal
    const price = parseFloat(productData.price.replace('£', '').replace(',', ''));

    // Normalize product name
    const { normalizedName, tags } = normalizeProductName(productData.name);

    // Get category ID if category name was provided
    let categoryId = null;
    if (categoryName) {
      // Map the supermarket's subcategory to our standard main category
      const mainCategory = mapToMainCategory(categoryName, supermarketName);

      if (mainCategory) {
        categoryId = await getOrCreateCategory(mainCategory);
      } else {
        // If no mapping found, log a warning and skip category assignment
        console.warn(`  ⚠️  No category mapping for "${categoryName}" at ${supermarketName}`);
      }
    }

    const productRecord = {
      supermarket_id: supermarket.id,
      name: productData.name,
      normalized_name: normalizedName,
      tags: tags.length > 0 ? tags : null,
      product_url: productData.url,
      product_code: productCode,
      current_price: price,
      image_url: productData.imageUrl || null,
      category_id: categoryId,
      is_available: true,
      last_scraped_at: new Date().toISOString()
    };

    if (existing) {
      // Update existing product
      const { data, error } = await supabase
        .from('products')
        .update(productRecord)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;

      // Price change will be automatically logged by trigger
      if (existing.current_price !== price) {
        console.log(`  Price changed: £${existing.current_price} → £${price}`);
      }

      return { ...data, action: 'updated' };
    } else {
      // Insert new product
      const { data, error } = await supabase
        .from('products')
        .insert(productRecord)
        .select()
        .single();

      if (error) throw error;

      // Manually create first price history entry for new products
      await supabase
        .from('price_history')
        .insert({
          product_id: data.id,
          price: price,
          recorded_at: new Date().toISOString()
        });

      return { ...data, action: 'inserted' };
    }

  } catch (error) {
    console.error('Error upserting product:', error.message);
    return null;
  }
}

/**
 * Log scrape activity
 */
async function logScrape(supermarketName, category, stats, status, errorMsg = null) {
  try {
    const { data: supermarket } = await supabase
      .from('supermarkets')
      .select('id')
      .eq('slug', supermarketName.toLowerCase())
      .single();

    await supabase
      .from('scrape_logs')
      .insert({
        supermarket_id: supermarket?.id,
        category: category,
        products_found: stats.found || 0,
        products_updated: stats.updated || 0,
        errors: stats.errors || 0,
        status: status,
        error_message: errorMsg,
        completed_at: new Date().toISOString()
      });

  } catch (error) {
    console.error('Error logging scrape:', error.message);
  }
}

/**
 * Custom Aldi scraper - navigates to categories and extracts products from category pages
 */
async function scrapeAldiCategory(page, categoryUrl, maxProducts) {
  console.log(`  Navigating to category: ${categoryUrl}`);

  await page.goto(categoryUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Extract product URLs from category page
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

  console.log(`  Found ${productUrls.length} products in category`);
  return productUrls.slice(0, maxProducts);
}

/**
 * Scrape products from a search term and save to Supabase
 */
async function scrapeSearchTermToSupabase(supermarketName, searchTerm, maxProducts = 50) {
  console.log(`\n=== Scraping ${supermarketName}: "${searchTerm}" ===\n`);

  const puppeteer = require('puppeteer-extra');
  const StealthPlugin = require('puppeteer-extra-plugin-stealth');
  puppeteer.use(StealthPlugin());

  const stats = { found: 0, updated: 0, inserted: 0, errors: 0 };

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Build search URL based on supermarket
    let searchUrl;
    if (supermarketName === 'asda') {
      searchUrl = `https://www.asda.com/groceries/search/${encodeURIComponent(searchTerm)}`;
    } else if (supermarketName === 'morrisons') {
      searchUrl = `https://groceries.morrisons.com/search?entry=${encodeURIComponent(searchTerm)}`;
    } else if (supermarketName === 'tesco') {
      searchUrl = `https://www.tesco.com/groceries/en-GB/search?query=${encodeURIComponent(searchTerm)}`;
    } else if (supermarketName === 'sainsburys') {
      // Note: Sainsbury's has very strong bot detection that blocks automated scraping
      // They use /gol-ui/ URLs instead of /groceries/
      // Using their newer search interface which may have better compatibility
      searchUrl = `https://www.sainsburys.co.uk/gol-ui/SearchResults/${encodeURIComponent(searchTerm)}`;
    } else if (supermarketName === 'aldi') {
      searchUrl = `https://www.aldi.co.uk/search?text=${encodeURIComponent(searchTerm)}`;
    } else if (supermarketName === 'lidl') {
      searchUrl = `https://www.lidl.co.uk/search?q=${encodeURIComponent(searchTerm)}`;
    } else if (supermarketName === 'waitrose') {
      searchUrl = `https://www.waitrose.com/ecom/shop/search?&searchTerm=${encodeURIComponent(searchTerm)}`;
    } else if (supermarketName === 'ocado') {
      searchUrl = `https://www.ocado.com/search?entry=${encodeURIComponent(searchTerm)}`;
    }

    console.log(`Fetching: ${searchUrl}`);
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Handle cookies
    try {
      const buttons = await page.$$('button');
      for (const button of buttons) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text && (text.includes('Accept') || text.includes('accept'))) {
          await button.click();
          await new Promise(resolve => setTimeout(resolve, 2000));
          break;
        }
      }
    } catch (e) {}

    // Get product URLs - use supermarket-specific selectors
    let productUrls;

    if (supermarketName === 'aldi') {
      // Aldi requires special handling - search returns category pages, not products
      // We need to extract category URLs, then visit each category to get products
      const categoryUrls = await page.evaluate(() => {
        const links = document.querySelectorAll('a[href*="/products/"]');
        const filtered = [...links].filter(a => {
          const url = a.href.toLowerCase();
          return !url.includes('onetrust.com') &&
                 !url.includes('cookie') &&
                 !url.includes('privacy') &&
                 url.includes('/k/'); // Category URLs have /k/ in them
        });
        return [...new Set(filtered.map(a => a.href))];
      });

      console.log(`Found ${categoryUrls.length} categories, extracting products from each...`);

      // Visit each category and collect product URLs
      productUrls = [];
      const maxCategories = 5; // Limit categories to visit
      for (let i = 0; i < Math.min(categoryUrls.length, maxCategories); i++) {
        const categoryProducts = await scrapeAldiCategory(page, categoryUrls[i], 10);
        productUrls.push(...categoryProducts);

        if (productUrls.length >= maxProducts) {
          productUrls = productUrls.slice(0, maxProducts);
          break;
        }
      }
    } else {
      // Standard scraping for other supermarkets
      productUrls = await page.evaluate((supermarket) => {
        let links;
        if (supermarket === 'sainsburys') {
          // Sainsbury's uses /gol-ui/product/ URLs
          links = document.querySelectorAll('a[href*="/gol-ui/product/"]');
        } else if (supermarket === 'asda') {
          links = document.querySelectorAll('a[href*="/groceries/product/"]');
        } else if (supermarket === 'tesco') {
          links = document.querySelectorAll('a[href*="/groceries/"][href*="/products/"]');
        } else if (supermarket === 'morrisons') {
          links = document.querySelectorAll('a[href*="/products/"]');
        } else {
          // Default fallback
          links = document.querySelectorAll('a[href*="/product/"], a[href*="/products/"]');
        }

        // Filter out external links (like OneTrust cookie consent)
        const filteredLinks = [...links].filter(a => {
          const url = a.href.toLowerCase();
          return !url.includes('onetrust.com') &&
                 !url.includes('cookie') &&
                 !url.includes('privacy');
        });

        return [...new Set(filteredLinks.map(a => a.href))];
      }, supermarketName);
    }

    stats.found = Math.min(productUrls.length, maxProducts);
    console.log(`Found ${productUrls.length} products (scraping first ${stats.found})\n`);

    // Scrape each product
    for (let i = 0; i < stats.found; i++) {
      const url = productUrls[i];
      console.log(`[${i + 1}/${stats.found}] Scraping product...`);

      try {
        const product = await scrapeSupermarket(url, SUPERMARKET_SELECTORS[supermarketName]);

        if (product && product.name && product.price) {
          console.log(`  ${product.name} - ${product.price}`);

          // Add URL to product data
          product.url = url;

          const result = await upsertProduct(supermarketName, product);

          if (result) {
            if (result.action === 'inserted') stats.inserted++;
            if (result.action === 'updated') stats.updated++;
            console.log(`  ✓ Saved to database (${result.action})`);
          } else {
            stats.errors++;
          }
        } else {
          console.log(`  ✗ Failed to extract product data`);
          stats.errors++;
        }

      } catch (error) {
        console.error(`  Error: ${error.message}`);
        stats.errors++;
      }

      // Small delay between products
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    await browser.close();

    // Log scrape results
    await logScrape(supermarketName, searchTerm, stats, 'success');

    console.log(`\n=== Scrape Complete ===`);
    console.log(`Found: ${stats.found}`);
    console.log(`Inserted: ${stats.inserted}`);
    console.log(`Updated: ${stats.updated}`);
    console.log(`Errors: ${stats.errors}`);

    return stats;

  } catch (error) {
    console.error('Fatal error:', error);
    await logScrape(supermarketName, searchTerm, stats, 'failed', error.message);
    throw error;
  }
}

/**
 * Test scraper with a few products
 */
async function testScraper() {
  // Check if env vars are set
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('ERROR: Please set up your .env file with Supabase credentials');
    console.error('Copy .env.example to .env and fill in your values');
    process.exit(1);
  }

  console.log('Testing Supabase connection...');

  // Test database connection
  const { data, error } = await supabase.from('supermarkets').select('*');
  if (error) {
    console.error('ERROR: Could not connect to Supabase:', error.message);
    process.exit(1);
  }

  console.log(`✓ Connected to Supabase`);
  console.log(`✓ Found ${data.length} supermarkets in database`);

  // Test scraping a few products from Asda
  await scrapeSearchTermToSupabase('asda', 'coca cola', 5);
}

// Run test if executed directly
if (require.main === module) {
  testScraper().catch(console.error);
}

module.exports = {
  upsertProduct,
  getOrCreateCategory,
  scrapeSearchTermToSupabase,
  logScrape
};
