const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Add stealth plugin to puppeteer
puppeteer.use(StealthPlugin());

/**
 * Enhanced scraper with stealth mode for UK supermarkets
 * This template provides better bot detection evasion
 */
async function scrapeSupermarket(url, selectors) {
  const browser = await puppeteer.launch({
    headless: 'new', // Use new headless mode (more stable)
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled', // Hide automation
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
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

  try {
    console.log(`Navigating to: ${url}`);

    // Navigate with a more realistic timeout
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Wait for initial load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Handle cookie consent
    await handleCookieConsent(page);

    // Wait for content to be ready
    console.log('Waiting for content to load...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Optional: Scroll to simulate human behavior
    await autoScroll(page);

    // Take screenshot for debugging (disabled in production)
    // Uncomment the lines below if you need to debug scraping issues
    // const screenshotName = `debug-${Date.now()}.png`;
    // await page.screenshot({ path: screenshotName });
    // console.log(`Screenshot saved: ${screenshotName}`);

    // Extract product data using provided selectors
    const productData = await page.evaluate((sel) => {
      const getText = (selector) => {
        const element = document.querySelector(selector);
        return element ? element.textContent.trim() : null;
      };

      const getImageUrl = (selector) => {
        const element = document.querySelector(selector);
        if (!element) return null;

        // Try different image attributes
        return element.src || element.getAttribute('data-src') ||
               element.getAttribute('data-lazy-src') || null;
      };

      const name = getText(sel.name);
      let price = getText(sel.price);
      const imageUrl = sel.image ? getImageUrl(sel.image) : null;

      // Clean up price text - handle both regular and rollback prices
      if (price) {
        // For rollback prices like "was£2.56actual price£1.67"
        // Extract just the actual/current price
        if (price.includes('actual price')) {
          // Extract text after "actual price"
          const match = price.match(/actual price\s*£?([\d.]+)/i);
          if (match) {
            price = '£' + match[1];
          } else {
            // Fallback: remove everything before "actual price" and clean
            price = price.replace(/^.*actual price\s*/i, '').trim();
          }
        } else if (price.includes('was£')) {
          // If there's a "was" price but no "actual price" text
          // Extract the second price (the current price)
          const prices = price.match(/£[\d.]+/g);
          if (prices && prices.length > 1) {
            price = prices[1]; // Second price is the current price
          }
        }

        // Final cleanup: remove any "actual price" text that might remain
        price = price.replace(/actual price/i, '').trim();
      }

      return { name, price, imageUrl };
    }, selectors);

    await browser.close();
    return productData;

  } catch (error) {
    console.error('Scraping error:', error.message);
    await page.screenshot({ path: `error-${Date.now()}.png` });
    await browser.close();
    throw error;
  }
}

/**
 * Handle cookie consent dialogs
 */
async function handleCookieConsent(page) {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Common cookie button texts
    const cookieTexts = ['Accept', 'I Accept', 'Accept All', 'Accept Cookies', 'Agree'];

    const buttons = await page.$$('button');
    for (const button of buttons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text && cookieTexts.some(ct => text.includes(ct))) {
        await button.click();
        console.log('Clicked cookie consent button');
        await new Promise(resolve => setTimeout(resolve, 1500));
        break;
      }
    }
  } catch (e) {
    console.log('No cookie dialog found or already accepted');
  }
}

/**
 * Auto-scroll to simulate human behavior
 */
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight / 2) { // Scroll halfway
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });

  // Scroll back to top
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(resolve => setTimeout(resolve, 500));
}

// Example usage for different supermarkets
const SUPERMARKET_SELECTORS = {
  asda: {
    name: 'h1',
    price: '[data-locator="txt-pdp-product-price"]',
    image: '.chakra-image.css-11t16ac'
  },
  morrisons: {
    name: 'h1',
    price: '[data-test="price-container"]',
    image: 'img[alt*="product"], img[class*="product"]'
  },
  tesco: {
    name: 'h1',
    price: 'p[class*="priceText"]',
    image: '#carousel__product-image'
  },
  sainsburys: {
    name: 'h1',
    price: '[data-testid="pd-retail-price"]',
    image: '[data-testid="pd-product-image"]'
  },
  aldi: {
    name: 'h1',
    price: '.base-price__regular',
    image: '.product-image img'
  },
  lidl: {
    name: 'h1',
    price: '.ods-price__value',
    image: '.product-image img'
  },
  waitrose: {
    name: 'h1',
    price: '.product-pod-price',
    image: '.product-image img'
  },
  ocado: {
    name: 'h1',
    price: '[class*="bDnBwy"]',
    image: '.product-image img'
  }
};

// Test with Asda
if (require.main === module) {
  const testUrl = 'https://www.asda.com/groceries/product/regular-cola/coca-cola-original-taste-24-x-330ml/6035632';

  scrapeSupermarket(testUrl, SUPERMARKET_SELECTORS.asda)
    .then(data => {
      console.log('\n=== Product Data ===');
      console.log('Name:', data.name);
      console.log('Price:', data.price);
    })
    .catch(err => console.error('Error:', err));
}

module.exports = { scrapeSupermarket, SUPERMARKET_SELECTORS };
